import React, { useEffect, useState } from 'react';
import axios from "axios";
import { Table } from 'react-bootstrap';
import '../assets/table.css';

const Forecasting = () => {
    const [forecast, setForecast] = useState([]);
    const [inventory, setInventory] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [forecastRes, inventoryRes] = await Promise.all([
                axios.get("http://localhost:80/api/forecasting.php"),
                axios.get("http://localhost:80/api/inventory.php")
            ]);

            if (forecastRes.data.status === 1 && Array.isArray(forecastRes.data.popular_products)) {
                setForecast(forecastRes.data.popular_products);
            } else {
                setForecast([]);
            }

            if (inventoryRes.data.status === "success" && Array.isArray(inventoryRes.data.inventory)) {
                setInventory(inventoryRes.data.inventory);
            } else {
                console.warn("Inventory API response invalid:", inventoryRes.data);
                setInventory([]);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const calculateSalesMetrics = (productName, sku = null) => {
        const productSales = forecast.filter(item => {
            const nameMatch = item.product_name.trim().toLowerCase() === productName.trim().toLowerCase();
            if (sku && item.sku) {
                return nameMatch && item.sku === sku;
            }
            return nameMatch;
        });

        if (productSales.length === 0) {
            return {
                totalSales: 0,
                salesVelocity: 0,
                predictedDaysLeft: 'N/A'
            };
        }

        let totalQuantitySold = 0;
        let firstSaleDate = null;
        let lastSaleDate = null;

        productSales.forEach(sale => {
            const quantity = parseInt(sale.total_quantity, 10) || 0;
            totalQuantitySold += quantity;

            const saleDate = new Date(`${sale.month} 1, ${new Date().getFullYear()}`);
            
            if (!firstSaleDate || saleDate < firstSaleDate) firstSaleDate = saleDate;
            if (!lastSaleDate || saleDate > lastSaleDate) lastSaleDate = saleDate;
        });

        let salesVelocity = 0;
        if (firstSaleDate && lastSaleDate && totalQuantitySold > 0) {
            const timeDiff = lastSaleDate - firstSaleDate;
            const daysDiff = Math.max(timeDiff / (1000 * 60 * 60 * 24), 1);
            salesVelocity = totalQuantitySold / daysDiff;
        }

        const product = inventory.find(item => 
            item.product_name.trim().toLowerCase() === productName.trim().toLowerCase() &&
            (!sku || item.sku === sku)
        );
        
        const currentStock = product ? parseInt(product.quantity, 10) || 0 : 0;

        let predictedDaysLeft = 'N/A';
        if (salesVelocity > 0 && currentStock > 0) {
            predictedDaysLeft = Math.round(currentStock / salesVelocity);
        }

        return {
            totalSales: totalQuantitySold,
            salesVelocity: salesVelocity.toFixed(2),
            predictedDaysLeft: predictedDaysLeft
        };
    };

    const getStockStatusColor = (stock) => {
        const stockValue = parseInt(stock, 10) || 0;
        if (stockValue === 0) return 'text-danger'; // Red for out of stock
        if (stockValue < 5) return 'text-warning'; // Orange/Yellow for low stock
        return 'text-success'; // Green for sufficient stock
    };

    const getInventoryStatus = (productName, sku = null, supplierLeadTime = 3) => {
        if (!inventory || inventory.length === 0) {
            return { 
                stock: 0,
                salesVelocity: 0,
                predictedDaysLeft: 'N/A',
                sku: sku || 'N/A',
                estimatedDepletionDate: "N/A",
                recommendedPurchaseDate: "ASAP"
            };
        }

        const normalizedProductName = productName.trim().toLowerCase();
        const allProductVariants = inventory.filter(item =>
            (item.product_name && item.product_name.trim().toLowerCase() === normalizedProductName) ||
            (item.generic_name && item.generic_name.trim().toLowerCase() === normalizedProductName)
        );

        if (allProductVariants.length === 0) {
            return { 
                stock: 0,
                salesVelocity: 0,
                predictedDaysLeft: 'N/A',
                sku: sku || 'N/A',
                estimatedDepletionDate: "N/A",
                recommendedPurchaseDate: "ASAP"
            };
        }

        if (sku) {
            const product = allProductVariants.find(item => item.sku === sku);
            if (!product) {
                return { 
                    stock: 0,
                    salesVelocity: 0,
                    predictedDaysLeft: 'N/A',
                    sku: sku,
                    estimatedDepletionDate: "N/A",
                    recommendedPurchaseDate: "ASAP"
                };
            }
            return calculateStatusForProduct(product, productName, sku, supplierLeadTime);
        }

        return calculateStatusForProduct(allProductVariants[0], productName, allProductVariants[0].sku, supplierLeadTime);
    };

    const calculateStatusForProduct = (product, productName, sku, supplierLeadTime) => {
        const stock = parseInt(product.quantity, 10) || 0;
        const salesMetrics = calculateSalesMetrics(productName, sku);
        const salesVelocity = parseFloat(salesMetrics.salesVelocity) || 0;

        let estimatedDepletionDate = "N/A";
        let recommendedPurchaseDate = "No need";

        if (salesVelocity > 0) {
            const daysLeft = stock / salesVelocity;
            const today = new Date();
            const depletionDate = new Date(today);
            depletionDate.setDate(today.getDate() + daysLeft);
            
            const recommendedDate = new Date(depletionDate);
            recommendedDate.setDate(depletionDate.getDate() - supplierLeadTime);
            
            const formatDate = (date) => {
                return date.toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric', 
                    year: 'numeric' 
                });
            };

            estimatedDepletionDate = daysLeft > 0 
                ? `${formatDate(depletionDate)}` 
                : "Out of stock!";

            if (daysLeft <= supplierLeadTime) {
                recommendedPurchaseDate = "ASAP";
            } else if (daysLeft <= supplierLeadTime + 5) {
                recommendedPurchaseDate = formatDate(recommendedDate);
            } else {
                recommendedPurchaseDate = formatDate(recommendedDate);
            }
        } else if (stock === 0) {
            recommendedPurchaseDate = "ASAP";
        } else if (stock < 5) {
            const today = new Date();
            const orderByDate = new Date(today);
            orderByDate.setDate(today.getDate() + 7);
            recommendedPurchaseDate = orderByDate.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric', 
                year: 'numeric' 
            });
        }

        return { 
            stock,
            salesVelocity: salesMetrics.salesVelocity,
            predictedDaysLeft: salesMetrics.predictedDaysLeft,
            sku: sku || product.sku || 'N/A',
            estimatedDepletionDate,
            recommendedPurchaseDate
        };
    };

    const getProductVariants = () => {
        const variantsMap = new Map();
    
        inventory.forEach(item => {
            if (item.sku) {
                const key = `${item.product_name}_${item.sku}`;
                if (!variantsMap.has(key)) {
                    variantsMap.set(key, {
                        productName: item.product_name,
                        sku: item.sku,
                        genericName: item.generic_name
                    });
                }
            }
        });
    
        return Array.from(variantsMap.values());
    };

    if (loading) {
        return <div className="text-center mt-5">Loading...</div>;
    }

    const productVariants = getProductVariants();

    return (
        <div className='container mt-4'>
            <h2 className="text-center text-white bg-dark p-3 rounded">Product Inventory Forecast</h2>
            <div className="table-responsive mt-3">
                <Table striped bordered hover className="text-center">
                    <thead className="bg-dark text-white">
                        <tr>
                            <th>SKU</th>
                            <th>Product Name</th>
                            <th>Current Stock</th>
                            <th>Sales Velocity (units/day)</th>
                            <th>Estimated Depletion Date</th>
                            <th>Recommended Purchase Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        {productVariants.length > 0 ? (
                            productVariants.map((variant, index) => {
                                const inventoryStatus = getInventoryStatus(variant.productName, variant.sku);
                                const stockColorClass = getStockStatusColor(inventoryStatus.stock);
                                
                                return (
                                    <tr key={index}>
                                        <td>{inventoryStatus.sku}</td>
                                        <td>{variant.productName}</td>
                                        <td className={`fw-bold ${stockColorClass}`}>
                                            {inventoryStatus.stock}
                                        </td>
                                        <td>{inventoryStatus.salesVelocity}</td>
                                        <td>{inventoryStatus.estimatedDepletionDate}</td>
                                        <td>{inventoryStatus.recommendedPurchaseDate}</td>
                                    </tr>
                                );
                            })
                        ) : (
                            <tr>
                                <td colSpan="6" className="text-center">
                                    No products with SKU information available
                                </td>
                            </tr>
                        )}
                    </tbody>
                </Table>
            </div>
        </div>
    );
};

export default Forecasting;