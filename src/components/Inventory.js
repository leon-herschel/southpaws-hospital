import React, { useState, useEffect, useRef, useMemo } from 'react';
import { FaEdit, FaTrash, FaPlus, FaCaretUp, FaCaretDown, FaEye, FaArchive  } from 'react-icons/fa';
import { AiOutlineArrowUp, AiOutlineArrowDown } from 'react-icons/ai';
import axios from 'axios';
import { Pagination, Button, Modal, Tooltip, OverlayTrigger } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import '../assets/table.css';
import AddInventoryModal from '../components/Add/AddInventoryModal';
import ViewInventoryModal from '../components/View/ViewInventoryModal';
import EditInventoryModal from '../components/Edit/EditInventoryModal';
import {  toast } from 'react-toastify'; // Import Toastify

const Inventory = () => {
    const [products, setProducts] = useState([]);
    const [originalProducts, setOriginalProducts] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [productsPerPage, setProductsPerPage] = useState(5);
    const [sortBy, setSortBy] = useState({ key: '', order: '' });

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showViewDetailsModal, setShowViewDetailsModal] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [inventoryIdToDelete, setInventoryIdToDelete] = useState(null);
    const [productIdToEdit, setProductIdToEdit] = useState(null);
    const [productDetails, setProductDetails] = useState(null);
    const [editProduct, setEditProduct] = useState({});
    const [brands, setBrands] = useState([]);
    const [categories, setCategories] = useState([]);
    const [productName, setProductName] = useState('');
    const [inventoryItemToEdit, setInventoryItemToEdit] = useState(null); 
    const [units, setUnits] = useState([]);
    const [genericNames, setGenericNames] = useState([]);

    const [expandedProduct, setExpandedProduct] = useState(null); 
    const [inventoryData, setInventoryData] = useState({});
    const [selectedProductId, setSelectedProductId] = useState(null);

    const [showViewModal, setShowViewModal] = useState(false);
    const [inventoryItemToView, setInventoryItemToView] = useState(null);

    const navigate = useNavigate();
    const [userRole, setUserRole] = useState(null); 

    const [suppliers, setSuppliers] = useState([]);

    const [showAddStockModal, setShowAddStockModal] = useState(false);
    const [inventoryItemToAddStock, setInventoryItemToAddStock] = useState(null);
    const [stockQuantity, setStockQuantity] = useState(''); // Use string initially to handle backspace
    const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

    const handleAddStockClick = (inventoryItem) => {
        setInventoryItemToAddStock(inventoryItem); // Store the inventory item to add stock
        setShowAddStockModal(true); // Show the add stock modal
    };    

    const handleViewStockClick = (inventoryItem) => {
        setInventoryItemToView(inventoryItem.id); // Make sure only the ID or necessary data is passed
        setShowViewModal(true); // Open modal
    };
    
    const handleCloseViewModal = () => {
        setShowViewModal(false);  // Close the view stock modal
        setInventoryItemToView(null);  // Reset the selected inventory item
    };

    const handleStockQuantityChange = (e) => {
        const value = e.target.value;
    
        // Allow empty input, valid numbers, and negative numbers
        if (value === '' || value === '-' || /^-?[0-9]+$/.test(value)) {
            setStockQuantity(value); // Update state with valid input
        }
    };    

    const deleteInventory = () => {
        axios.delete(`${API_BASE_URL}/api/inventory.php/${inventoryIdToDelete}`)
            .then(() => {
                getInventory();
                handleCloseDeleteModal();
                toast.success('Inventory deleted successfully!'); // Show success notification
            })
            .catch(error => {
                toast.error('Failed to delete category'); // Show error notification
            });
    };
    

    const fetchSuppliers = () => {
        axios.get(`${API_BASE_URL}/api/suppliers.php`) // Use the actual API endpoint for suppliers
            .then(response => {
                // Check if the response contains 'suppliers' and it is an array
                if (response.data && Array.isArray(response.data.suppliers)) {
                    setSuppliers(response.data.suppliers);
                } else {
                    console.error('Invalid or missing suppliers data:', response.data);
                    setSuppliers([]); // Ensure state is set to an empty array if data is not as expected
                }
            })
            .catch(error => {
                console.error('Error fetching suppliers:', error);
                setSuppliers([]); // Set to an empty array on error to maintain consistent state handling
            });
    };

    

    useEffect(() => {
        // Retrieve user role from localStorage
        const role = parseInt(localStorage.getItem('userRole'), 10);
        setUserRole(role);
    }, []);

    const toggleExpand = (productId) => {
        if (expandedProduct === productId) {
            setExpandedProduct(null); // ✅ Collapse if already expanded
            setInventoryData([]); // ✅ Clear previous data
        } else {
            setExpandedProduct(productId); // ✅ Expand and set the correct product immediately
            setInventoryData([]); // ✅ Clear previous inventory before fetching new data
    
            axios.get(`${API_BASE_URL}/api/inventory.php/${productId}`)
                .then(response => {
                    if (Array.isArray(response.data.inventory)) {
                        setInventoryData(response.data.inventory); // ✅ Load only this product’s details
                    } else {
                        setInventoryData([]);
                    }
                })
                .catch(error => {
                    console.error('Error fetching inventory data:', error);
                    setInventoryData([]);
                });
        }
    };
    
    useEffect(() => {
        if (expandedProduct) {
            axios.get(`${API_BASE_URL}/api/inventory.php/${expandedProduct}`)
                .then(response => {    
                    // Check if there are multiple inventory items
                    if (response.data.inventory && response.data.inventory.length > 0) {
                        setInventoryData(response.data.inventory);  // Set inventory array
                    } else {
                        setInventoryData([]);  // Clear inventory data if not available
                    }
                })
                .catch(error => {
                    console.error('Error fetching inventory data:', error);
                });
        } else {
            setInventoryData([]);  // Clear inventory data when no product is expanded
        }
    }, [expandedProduct]);

    const handleClose = () => setShowModal(false);


    const handleCloseDeleteModal = () => setShowDeleteModal(false);

    const handleShowDeleteModal = (inventoryItem) => {
        setInventoryIdToDelete(inventoryItem.id);
        setShowDeleteModal(true);
    };

    const getInventory = () => {
        axios.get(`${API_BASE_URL}/api/inventory.php/`)
            .then(response => {
                console.log("API Response:", response.data); // Log the entire response
                if (Array.isArray(response.data.inventory)) {
                    setInventoryData(response.data.inventory);
                } else {
                    console.error('Inventory data is not an array:', response.data.inventory);
                }
            })
            .catch(error => {
                console.error('Error fetching inventory:', error);
            });
    };
    
    const handleCloseEditModal = () => {
        setShowEditModal(false);
        navigate('/inventory');
    };

    const handleShowEditModal = (inventoryItem) => {
        setInventoryItemToEdit(inventoryItem); // Set the selected inventory item
        setShowEditModal(true); // Show the edit modal
    };
    

    const handleEditSubmit = () => {
        if (!expandedProduct) return; // ✅ Prevent updating wrong inventory if none is expanded
    
        axios.get(`${API_BASE_URL}/api/inventory.php/${expandedProduct}`)
            .then(response => {
                if (Array.isArray(response.data.inventory)) {
                    setInventoryData(response.data.inventory); // ✅ Update only the expanded product's inventory
                } else {
                    setInventoryData([]);
                }
            })
            .catch(error => {
                console.error('Error fetching inventory details:', error);
                setInventoryData([]); // Prevents UI crash
            });
    
        setShowEditModal(false);
    };
    
    
    
    useEffect(() => {
        // Fetch products
        getInventory()
        getProducts();
        fetchUnits();
        fetchGenerics();
        fetchSuppliers();
        
        // Fetch brands
        axios.get(`${API_BASE_URL}/api/brands.php`)
            .then(response => setBrands(response.data.brands))
            .catch(error => console.error('Error fetching brands:', error));

        // Fetch categories
        axios.get(`${API_BASE_URL}/api/category.php`)
            .then(response => setCategories(response.data.categories))
            .catch(error => console.error('Error fetching categories:', error));

    }, []);

    const fetchGenerics = () => {
        axios.get(`${API_BASE_URL}/api/generic.php`) // Adjust URL if needed
            .then(response => {
                if (response.data && Array.isArray(response.data.records)) {
                    setGenericNames(response.data.records);
                } else {
                    console.error('Invalid generic names data:', response.data);
                    setGenericNames([]);
                }
            })
            .catch(error => {
                console.error('Error fetching generic names:', error);
                setGenericNames([]);
            });
    };

    const fetchUnits = () => {
        // Ensure the 'archived' query parameter is passed as expected (e.g., 0 for active units)
        axios.get(`${API_BASE_URL}/api/units.php?archived=0`) // Fetch only active units
            .then(response => {
                // Check if response.data and response.data.units exist and are an array
                if (response.data && Array.isArray(response.data.units)) {
                    setUnits(response.data.units); // Set the units correctly
                } else {
                    // Log error and set empty array if no valid data
                    console.error('No valid unit data received:', response.data);
                    setUnits([]); // Reset units
                }
            })
            .catch(error => {
                // Handle error during fetch
                console.error('Error fetching units:', error);
                setUnits([]); // Reset units on error
            });
    };
    
    useEffect(() => {
        if (showEditModal && productIdToEdit) {
            axios.get(`${API_BASE_URL}/api/products.php/${productIdToEdit}`)
                .then(response => {
                    const productData = response.data.products;
                    if (productData) {
                        setEditProduct(productData);
                    } else {
                        console.error("Error: Product not found");
                        setEditProduct({});
                    }
                })
                .catch(error => {
                    console.error("Error fetching product:", error);
                    setEditProduct({});
                });
        }
    }, [showEditModal, productIdToEdit]);

    const archiveInventory = (inventoryId) => {
        if (!inventoryId) {
            toast.error('Invalid inventory ID.'); // Prevent sending an invalid request
            return;
        }
    
        // Ensure you're only sending the relevant data (id and archived)
    
        axios.put(`${API_BASE_URL}/api/inventory.php`, { 
            id: inventoryId, 
            archived: 1  // Ensure archived is correctly set to 1
        })
        .then((response) => {
            if (response.data.status === 1) {
                getInventory(); // Refresh the inventory list after archiving
                getProducts();
                handleCloseDeleteModal();
                toast.success('Inventory item archived successfully!');
            } else {
                toast.warning(response.data.message || 'No changes made.');
            }
        })
        .catch((error) => {
            console.error('Error archiving inventory item:', error);
            toast.error('Failed to archive inventory item.');
        });
    };
    

    const getProducts = () => {
        axios.get(`${API_BASE_URL}/api/products.php`)
            .then(response => {
                if (Array.isArray(response.data.products)) {
                    const sortedProducts = response.data.products.sort((a, b) => {
                        return new Date(b.created_at) - new Date(a.created_at);
                    });
    
                    // Fetch inventory data to sum values per product
                    axios.get(`${API_BASE_URL}/api/inventory.php`)
                        .then(inventoryResponse => {
                            const inventoryData = inventoryResponse.data.inventory || [];
    
                            // Aggregate inventory data by summing the values for each product
                            const productInventoryMap = inventoryData.reduce((acc, inventoryItem) => {
                                const productId = inventoryItem.product_id;
    
                                if (!acc[productId]) {
                                    acc[productId] = {
                                        total_count: 0,
                                        quantity: 0,
                                        item_sold: 0,
                                        inventory: [], // Store inventory items for each product
                                    };
                                }
    
                                acc[productId].total_count += inventoryItem.total_count || 0;
                                acc[productId].quantity += inventoryItem.quantity || 0;
                                acc[productId].item_sold += inventoryItem.item_sold || 0;
                                acc[productId].inventory.push(inventoryItem); // Add inventory item
    
                                return acc;
                            }, {});
    
                            // Merge the aggregated inventory data with products list
                            const mergedProducts = sortedProducts.map(product => ({
                                ...product,
                                total_count: productInventoryMap[product.id]?.total_count || 0,
                                quantity: productInventoryMap[product.id]?.quantity || 0,
                                item_sold: productInventoryMap[product.id]?.item_sold || 0,
                                inventory: productInventoryMap[product.id]?.inventory || [], // Include inventory items
                            }));
    
                            setProducts(mergedProducts);
                            setOriginalProducts(mergedProducts);
                        })
                        .catch(error => {
                            console.error('Error fetching inventory data:', error);
                            setProducts(sortedProducts);
                            setOriginalProducts(sortedProducts);
                        });
                } else {
                    console.error('Products data is not an array');
                }
            })
            .catch(error => {
                console.error('Error fetching products:', error);
            });
    };

    const flattenData = (products, inventoryData) => {
        return products.map(product => ({
            ...product,
            inventory: inventoryData.filter(inventory => inventory.product_id === product.id),
        }));
    };
    
    const handleFilter = (event) => {
        const searchText = event.target.value.toLowerCase();
    
        const newData = originalProducts.filter(product => {
            // Check main product fields
            const matchesMainFields = (
                String(product.product_name).toLowerCase().includes(searchText) ||
                String(product.generic_name).toLowerCase().includes(searchText) ||
                String(product.category_name).toLowerCase().includes(searchText) ||
                String(product.unit_name).toLowerCase().includes(searchText) ||
                String(product.id).toLowerCase().includes(searchText) ||
                String(product.created_by).toLowerCase().includes(searchText)
            );
    
            // Check inventory fields (SKU, supplier_name, etc.)
            const matchesInventoryFields = product.inventory?.some(inventory => (
                String(inventory.sku).toLowerCase().includes(searchText) ||
                String(inventory.supplier_name).toLowerCase().includes(searchText)
            ));
    
            return matchesMainFields || matchesInventoryFields;
        });
    
        setProducts(searchText ? newData : originalProducts);
    };

    const indexOfLastProduct = currentPage * productsPerPage;
    const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
    const currentProducts = products.slice(indexOfFirstProduct, indexOfLastProduct);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    const handlePerPageChange = (e) => {
        setCurrentPage(1);
        setProductsPerPage(Number(e.target.value));
    };

    const handleSort = (key) => {
        let order = 'asc';
        if (sortBy.key === key && sortBy.order === 'asc') {
            order = 'desc';
        }
        setSortBy({ key, order });

        const sortedProducts = [...products].sort((a, b) => {
            let valueA = a[key];
            let valueB = b[key];

            // Handle null/undefined
            if (valueA === null || valueA === undefined) valueA = 0;
            if (valueB === null || valueB === undefined) valueB = 0;

            if (typeof valueA === "number" && typeof valueB === "number") {
                return order === "asc" ? valueA - valueB : valueB - valueA;
            }

            valueA = String(valueA).toLowerCase();
            valueB = String(valueB).toLowerCase();
            if (valueA < valueB) return order === "asc" ? -1 : 1;
            if (valueA > valueB) return order === "asc" ? 1 : -1;
            return 0;
        });

        setProducts(sortedProducts);
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat('en-US', { 
            minimumFractionDigits: 2, 
            maximumFractionDigits: 2 
        }).format(price);
    };

    const formatDate = (date) => {
        if (!date) return 'No Expiry Date'; // Handle null or undefined dates
        const parsedDate = new Date(date);
        if (isNaN(parsedDate)) return 'No Expiry Date'; // Handle invalid dates
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return parsedDate.toLocaleDateString('en-US', options);
    };

    const getSortIcon = (key) => {
        if (sortBy.key === key) {
            return sortBy.order === 'asc' ? <AiOutlineArrowUp /> : <AiOutlineArrowDown />;
        }
        return null;
    };

    const handleProductAdded = () => {
        getProducts(); // Refresh product list
        if (expandedProduct) {
            // Refresh inventory details for the expanded product
            axios.get(`${API_BASE_URL}/api/inventory.php/${expandedProduct}`)
                .then(response => {
                    setInventoryData(response.data.inventory);
                })
                .catch(error => {
                    console.error('Error fetching inventory data:', error);
                });
        }
    };
    
    const handleShow = (productId) => {
        setSelectedProductId(productId); // Pass the product ID to modal
        setShowModal(true);
    };

    const handleAddStockSubmit = async () => {
        const parsedQuantity = parseInt(stockQuantity, 10);
    
        if (!inventoryItemToAddStock) {
            toast.error("No inventory item selected.");
            return;
        }
    
        if (isNaN(parsedQuantity)) {
            toast.error("Please enter a valid numeric quantity.");
            return;
        }
    
        // Check if subtraction would make inventory go below 0
        if (parsedQuantity < 0 && inventoryItemToAddStock.quantity + parsedQuantity < 0) {
            toast.error(`Cannot reduce stock below 0. Current stock: ${inventoryItemToAddStock.quantity}`);
            return;
        }
    
        const updatedInventory = {
            id: inventoryItemToAddStock.id,
            add_to_quantity: parsedQuantity,  // This can be negative (for reducing stock)
        };
    
        try {
            const response = await axios.put(`${API_BASE_URL}/api/inventory.php`, updatedInventory);
            if (response.data.status === 1) {
                getProducts();
                if (expandedProduct) {
                    axios.get(`${API_BASE_URL}/api/inventory.php/${expandedProduct}`)
                        .then(response => {
                            if (Array.isArray(response.data.inventory)) {
                                setInventoryData(response.data.inventory);
                            } else {
                                setInventoryData([]);
                            }
                        })
                        .catch(error => {
                            console.error('Error fetching updated inventory:', error);
                            setInventoryData([]);
                        });
                }
    
                setShowAddStockModal(false);
                setStockQuantity(''); // Reset input field
                toast.success('Stock updated successfully!');
            } else {
                toast.error(response.data.message || 'Failed to update stock.');
            }
        } catch (error) {
            console.error('Error updating stock:', error);
            toast.error('Failed to update stock.');
        }
    };
    
    

    const sortedInventory = useMemo(() => {
        if (!Array.isArray(inventoryData) || inventoryData.length === 0) return [];
    
        return [...inventoryData].sort((a, b) => {
            let nameA = a.supplier_name?.toLowerCase() || ''; // Handle null/undefined
            let nameB = b.supplier_name?.toLowerCase() || '';
            return nameA.localeCompare(nameB); // Alphabetical sorting A → Z
        });
    }, [inventoryData]); // ✅ Ensures it only runs when inventoryData is an array
    
    


    // Function to determine stock status
    const getStockIndicator = (quantity) => {
        if (quantity === 0) return { color: "red", text: "Out of Stock" };
        if (quantity <= 5) return { color: "orange", text: "Low Stock" };
        return { color: "green", text: "In Stock" };
    };

    const notifiedProducts = useRef(new Set()); // ✅ Tracks products already notified

    useEffect(() => {
        if (inventoryData && inventoryData.length > 0) {
            inventoryData.forEach((item) => {
                const productKey = `${item.product_name}-${item.quantity}`; // Unique key per stock level
    
                // ✅ Prevent duplicate notifications
                if (!notifiedProducts.current.has(productKey)) {
                    if (item.quantity === 0) {
                        toast.error(`${item.product_name} from ${item.supplier_name || "Unknown Supplier"} has no more stock!`, {
                            position: "top-right",
                            autoClose: 3000,
                            hideProgressBar: false,
                            closeOnClick: true,
                            pauseOnHover: true,
                            draggable: true,
                        });
                    } else if (item.quantity > 0 && item.quantity <= 5) {
                        toast.warning(`${item.product_name} from ${item.supplier_name || "Unknown Supplier"} is low on stock!`, {
                            position: "top-right",
                            autoClose: 3000,
                            hideProgressBar: false,
                            closeOnClick: true,
                            pauseOnHover: true,
                            draggable: true,
                        });
                    }
                    notifiedProducts.current.add(productKey); // ✅ Mark as notified
                }
            });
        }
    }, [inventoryData]); // ✅ Runs only when inventoryData updates
    

    return (
        <div className='container mt-2'>
            <h1 style={{ textAlign: 'left', fontWeight: 'bold' }}>Inventory</h1>
            <div className='d-flex justify-content-between align-items-center'>
                <div className="input-group" style={{ width: '25%' }}>
                    <input type="text" className="form-control shadow-sm" onChange={handleFilter} placeholder="Search" />
                </div>
            </div>
            <div className="table-responsive">
            <table className="table table-striped shadow-sm table-hover custom-table align-middle" style={{ width: '100%' }}>
    <thead className="table-light">
        <tr>
            <th className="text-center" onClick={() => handleSort('product_name')}>
                Product Name
                {getSortIcon('product_name')}
            </th>
            <th className="text-center" onClick={() => handleSort('generic_name')}>
                Generic Name
                {getSortIcon('generic_name')}
            </th>
            <th className="text-center" onClick={() => handleSort('category_name')}>
                Category
                {getSortIcon('category_name')}
            </th>
            <th className="text-center" onClick={() => handleSort('unit_name')}>
                Type
                {getSortIcon('unit_name')}
            </th>
            <th className="text-center" onClick={() => handleSort('total_count')}>
                Total Count
                {getSortIcon('total_count')}
            </th>
            <th className="text-center" onClick={() => handleSort('quantity')}>
                In Stock
                {getSortIcon('quantity')}
            </th>
            <th className="text-center" onClick={() => handleSort('item_sold')}>
                Total Item Sold
                {getSortIcon('item_sold')}
            </th>
            <th className="text-center">Action</th>
        </tr>
    </thead>
    <tbody>
        {currentProducts.map((product, index) => (
            <React.Fragment key={product.id}>
                {/* Product Row */}
                <tr>
                    <td className="text-center">{product.product_name}</td>
                    <td className="text-center">
                        {genericNames.find(generic => generic.id === product.generic_id)?.generic_name || 'Unknown'}
                    </td>
                    <td className="text-center">{product.category_name}</td>
                    <td className="text-center">
                        {units.find(unit => unit.id === product.unit_id)?.unit_name || 'Unknown Units'}
                    </td>
                    <td className="text-center">{product.total_count}</td>
                    <td className="text-center">{product.quantity}</td>
                    <td className="text-center">{product.item_sold}</td>
                    <td className="text-center">
                        <div className="d-flex justify-content-center align-items-center">
                            {/* Expand Button (Visible for all roles) */}
                            <OverlayTrigger
                                placement="top"
                                overlay={<Tooltip id={`expand-tooltip-${product.id}`}>Expand</Tooltip>}
                            >
                                <Button className="btn me-2" onClick={() => toggleExpand(product.id)}>
                                    {expandedProduct === product.id ? <FaCaretUp /> : <FaCaretDown />}
                                </Button>
                            </OverlayTrigger>

                            {/* Add Stocks Button (Hidden for userRole === 1) */}
                            {userRole !== 1 && (
                                <OverlayTrigger
                                    placement="top"
                                    overlay={<Tooltip id={`add-tooltip-${product.id}`}>Add Stocks</Tooltip>}
                                >
                                    <Button
                                        onClick={() => handleShow(product.id)}
                                        className="btn btn-success me-2"
                                    >
                                        <FaPlus />
                                    </Button>
                                </OverlayTrigger>
                            )}
                        </div>
                    </td>
                </tr>

                {/* Expanded Details Row (Visible for all roles) */}
                {expandedProduct === product.id && (
    <tr>
        <td colSpan="8" className="bg-light">
            <div style={{ paddingLeft: '30px' }}>
                <table className="table text-center table-borderless">
                    <tbody>
                        {/* Title Row with Different Style */}
                        <tr className="inventory-details-title">
                            <td><strong>SKU</strong></td>
                            <td><strong>Supplier</strong></td>
                            <td><strong>Price</strong></td>
                            <td><strong>Total Count</strong></td>
                            <td><strong>In Stock</strong></td>
                            <td><strong>Items Sold</strong></td>
                            <td><strong>Expiration Date</strong></td>
                            <td><strong>Action</strong></td>
                        </tr>

                        {/* Data Rows for multiple inventory items */}
                        {product.inventory.length > 0 ? (
                            product.inventory.map((inventoryItem, index) => (
                                <tr key={index} className='align-middle'>
                                    <td>{inventoryItem?.sku || 'N/A'}</td>
                                    <td>{inventoryItem?.supplier_name || 'N/A'}</td>
                                    <td>₱{inventoryItem?.price ? formatPrice(inventoryItem.price) : 'N/A'}</td>
                                    <td>{inventoryItem?.total_count !== undefined ? inventoryItem.total_count : 'N/A'}</td>
                                    <td style={{ color: getStockIndicator(inventoryItem?.quantity).color, fontWeight: "bold" }}>
                                        {inventoryItem?.quantity !== undefined ? inventoryItem.quantity : 'N/A'}
                                    </td>
                                    <td>{inventoryItem?.item_sold !== undefined ? inventoryItem.item_sold : 'N/A'}</td>
                                    <td className="p-0">
                                        {inventoryItem?.expiration_date ? formatDate(inventoryItem.expiration_date) : 'No Expiry Date'}
                                    </td>
                                    <td className="d-flex justify-content-start p-0">
                                        {/* View Stock Button (Visible for all roles) */}
                                        <OverlayTrigger
                                            placement="top"
                                            overlay={<Tooltip id={`tooltip-view-stock`}>View Stock</Tooltip>}
                                        >
                                            <Button
                                                onClick={() => handleViewStockClick(inventoryItem)}
                                                className="btn btn-info btn-sm me-1"
                                                style={{ fontSize: "1.1rem" }}
                                            >
                                                <FaEye />
                                            </Button>
                                        </OverlayTrigger>

                                        {/* Edit, Add, and Archive Buttons (Hidden for userRole === 1) */}
                                        {userRole !== 1 && (
                                            <>
                                                <OverlayTrigger
                                                    placement="top"
                                                    overlay={<Tooltip id={`tooltip-edit-stock`}>Edit Stock</Tooltip>}
                                                >
                                                    <Button
                                                        onClick={() => handleShowEditModal(inventoryItem)}
                                                        className="btn btn-blue btn-sm me-1"
                                                        style={{ fontSize: "1.1rem" }}
                                                    >
                                                        <FaEdit />
                                                    </Button>
                                                </OverlayTrigger>

                                                <OverlayTrigger
                                                    placement="top"
                                                    overlay={<Tooltip id={`tooltip-add-stock`}>Add Stock</Tooltip>}
                                                >
                                                    <Button
                                                        onClick={() => handleAddStockClick(inventoryItem)}
                                                        className="btn btn-success btn-sm me-1"
                                                        style={{ fontSize: "1.1rem" }}
                                                    >
                                                        <FaPlus />
                                                    </Button>
                                                </OverlayTrigger>

                                                <OverlayTrigger
                                                    placement="top"
                                                    overlay={<Tooltip id={`tooltip-archive`}>Archive</Tooltip>}
                                                >
                                                    <Button
                                                        onClick={() => handleShowDeleteModal(inventoryItem)}
                                                        className="btn btn-warning btn-sm me-1"
                                                        style={{ fontSize: "1.1rem" }}
                                                    >
                                                        <FaArchive />
                                                    </Button>
                                                </OverlayTrigger>
                                            </>
                                        )}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="8">No inventory data available</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </td>
    </tr>
)}
            </React.Fragment>
        ))}
    </tbody>
</table>

            </div>
            <div className="d-flex justify-content-between align-items-center">
                {/* Items per page selector (left) */}
                <div className="d-flex align-items-center">
                    <label className="me-2 fw-bold">Items per page:</label>
                    <select 
                    className="form-select form-select-sm shadow-sm" 
                    style={{ width: '80px' }} 
                    value={productsPerPage} 
                    onChange={handlePerPageChange}
                    >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                    </select>
                </div>

                {/* Pagination (right) */}
                <Pagination className="mb-0">
                    {/* Prev button */}
                    <Pagination.Prev
                    onClick={() => currentPage > 1 && paginate(currentPage - 1)}
                    disabled={currentPage === 1}
                    />

                    {Array.from({ length: Math.ceil(products.length / productsPerPage) }, (_, index) => index + 1)
                    .filter(page =>
                        page === 1 ||
                        page === Math.ceil(products.length / productsPerPage) ||
                        (page >= currentPage - 2 && page <= currentPage + 2) // show range around current page
                    )
                    .map((page, i, arr) => (
                        <React.Fragment key={page}>
                        {/* Add ellipsis when gap */}
                        {i > 0 && arr[i] !== arr[i - 1] + 1 && <Pagination.Ellipsis disabled />}
                        <Pagination.Item
                            active={page === currentPage}
                            onClick={() => paginate(page)}
                        >
                            {page}
                        </Pagination.Item>
                        </React.Fragment>
                    ))}

                    {/* Next button */}
                    <Pagination.Next
                    onClick={() =>
                        currentPage < Math.ceil(products.length / productsPerPage) &&
                        paginate(currentPage + 1)
                    }
                    disabled={currentPage === Math.ceil(products.length / productsPerPage)}
                    />
                </Pagination>
                </div>

            <EditInventoryModal
                show={showEditModal}
                handleClose={handleCloseEditModal}
                onItemUpdated={handleEditSubmit}
                inventoryId={inventoryItemToEdit?.id} // Ensure this is set properly in your Inventory component
            />


            <AddInventoryModal show={showModal} handleClose={handleClose} onItemAdded={handleProductAdded} productId={selectedProductId} />
            <ViewInventoryModal
                show={showViewModal}
                handleClose={handleCloseViewModal}
                inventoryId={inventoryItemToView}
            />



            <Modal show={showDeleteModal} onHide={handleCloseDeleteModal} className="custom-modal">
                <Modal.Header closeButton>
                     <Modal.Title>Archive Inventory</Modal.Title>
                                </Modal.Header>
                                <Modal.Body>Are you sure you want to archive this inventory?</Modal.Body>
                                <Modal.Footer>
                                    <Button variant="secondary" onClick={handleCloseDeleteModal}>
                                        Cancel
                                    </Button>
                                    <Button variant="warning" onClick={() => archiveInventory(inventoryIdToDelete)}> {/* Changed to 'warning' */}
                                        Archive
                                    </Button>
                                </Modal.Footer>
            </Modal>

            <Modal show={showAddStockModal} onHide={() => setShowAddStockModal(false)} className="custom-modal">
            <Modal.Header closeButton>
                <Modal.Title>Add Stock</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <div>
                    <label htmlFor="quantity">Enter quantity to add:</label>
                    <input
                        type="text"
                        id="quantity"
                        value={stockQuantity}
                        onChange={(e) => handleStockQuantityChange(e)}
                        className="form-control"
                        placeholder="Enter quantity"
                    />
                </div>
            </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowAddStockModal(false)}>
                        Cancel
                    </Button>
                    <Button variant="primary" onClick={handleAddStockSubmit}>
                        Add Stock
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
}

export default Inventory;
