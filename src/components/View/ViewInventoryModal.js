import React, { useState, useEffect, useRef } from 'react';
import { Modal, Button, Form, Row, Col } from 'react-bootstrap';
import axios from 'axios';
import JsBarcode from 'jsbarcode';
import '../../assets/add.css';

const ViewInventoryModal = ({ show, handleClose, inventoryId }) => {
    const [inventoryData, setInventoryData] = useState(null);  // Store inventory data
    const barcodeRef = useRef(null);
    const [showQuantityDialog, setShowQuantityDialog] = useState(false); // State for quantity dialog
    const [barcodeQuantity, setBarcodeQuantity] = useState(1); // Barcode quantity to print

    // Convert datetime string to a date-only string (yyyy-MM-dd)
    const formatDate = (dateStr) => {
        if (!dateStr || dateStr === "0000-00-00 00:00:00" || dateStr === "0000-00-00") {
            return null; // Return null for invalid dates
        }
        
        try {
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) {
                return null; // Invalid date
            }
            return date.toISOString().split('T')[0];
        } catch (error) {
            console.error("Error formatting date:", error);
            return null;
        }
    };

    useEffect(() => {
        if (inventoryId && show) {
            axios.get(`http://localhost:80/api/inventory.php?id=${inventoryId}`)
                .then(response => {
                    const inventory = response.data.inventory;
                    console.log("Category Name:", inventoryData?.category_name);
                    // Check if inventory is an array and only one item is expected
                    if (Array.isArray(inventory) && inventory.length > 0) {
                        const matchedInventory = inventory.find(item => parseInt(item.id) === parseInt(inventoryId));
    
                        if (matchedInventory) {
                            // Check and handle expiration_date
                            if (!matchedInventory.expiration_date || matchedInventory.expiration_date === "0000-00-00 00:00:00") {
                                matchedInventory.expiration_date = ""; // Set to empty string instead of "No Expiration Date"
                            } else {
                                matchedInventory.expiration_date = formatDate(matchedInventory.expiration_date);
                            }
                            
                            setInventoryData(matchedInventory);
                        } else {
                            console.error("Error: No matching inventory found for ID", inventoryId);
                            setInventoryData(null);
                        }
                    } else {
                        console.error("Error: Inventory data not found or not in expected format");
                        setInventoryData(null);
                    }
                })
                .catch(error => {
                    console.error("Error fetching inventory details:", error);
                    setInventoryData(null);
                });
        }
    }, [inventoryId, show]);
    
    

    // Generate the barcode based on the product's barcode
    useEffect(() => {
        if (barcodeRef.current && inventoryData?.barcode) {
            try {
                // Check if barcode is a valid format
                if (typeof inventoryData.barcode !== "string" || inventoryData.barcode.trim() === "") {
                    console.warn("Invalid barcode:", inventoryData.barcode);
                    return; // Exit early if barcode is invalid
                }
    
                JsBarcode(barcodeRef.current, inventoryData.barcode, {
                    format: "CODE128",
                    displayValue: true,
                    lineColor: "#000",
                    width: 2,
                    height: 50,
                });
            } catch (error) {
                console.error("Error generating barcode:", error);
            }
        }
    }, [inventoryData]);
    

    const handlePrintBarcode = () => {
        setShowQuantityDialog(true); // Show the dialog to select quantity
    };

    const handlePrint = () => {
        if (barcodeQuantity <= 0) {
            alert('Please enter a valid number of barcodes.');
            return;
        }

        const printWindow = window.open('', '_blank');
        printWindow.document.open();
        printWindow.document.write(`
            <html>
            <head>
                <title>Print Barcode</title>
            </head>
            <body onload="window.print(); window.close();">
                ${Array.from({ length: barcodeQuantity }).map(() => `
                    <svg class="barcode"></svg>
                `).join('')}
                <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.0/dist/JsBarcode.all.min.js"></script>
                <script>
                    const sku = "${inventoryData.barcode}";
                    document.querySelectorAll('.barcode').forEach(el => {
                        JsBarcode(el, sku, {
                            format: "CODE128",
                            displayValue: true,
                            lineColor: "#000",
                            width: 2,
                            height: 50,
                        });
                    });
                </script>
            </body>
            </html>
        `);
        printWindow.document.close();
        setShowQuantityDialog(false); // Close the quantity dialog after printing
    };

    return (
        <Modal show={show} onHide={handleClose} className="custom-modal">
            <Modal.Header closeButton>
                <Modal.Title>View Inventory</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {inventoryData ? (
                    <Form>
                        <Row>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Product Name</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="name"
                                        value={inventoryData.product_name || ''}
                                        readOnly
                                    />
                                </Form.Group>
                                <Form.Group>
                                    <Form.Label>SKU</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="sku"
                                        value={inventoryData.sku || ''}
                                        readOnly
                                    />
                                </Form.Group>
                                <Form.Group>
                                <Form.Label>Category</Form.Label>
                                <Form.Control 
                                type="text" 
                                name="name"
                                value={inventoryData.category_name || ''}
                                readOnly 
                                />
                            </Form.Group>
                                <Form.Group>
                                    <Form.Label>Brand Name</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="name"
                                        value={inventoryData.brand_name || ''}
                                        readOnly
                                    />
                                </Form.Group>
                                <Form.Group>
                                    <Form.Label>Price</Form.Label>
                                    <Form.Control
                                        type="number"
                                        step="any"
                                        name="price"
                                        value={inventoryData.price || ''}
                                        readOnly
                                    />
                                </Form.Group>
                                <Form.Group>
                                    <Form.Label>Quantity</Form.Label>
                                    <Form.Control
                                        type="number"
                                        name="quantity"
                                        value={inventoryData.quantity || '0'}
                                        readOnly
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                            <Form.Group>
                                    <Form.Label>Generic Name</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="name"
                                        value={inventoryData.generic_name}
                                        readOnly
                                    />
                                </Form.Group>
                                <Form.Group>
                                    <Form.Label>Barcode</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="barcode"
                                        value={inventoryData.barcode || ''}
                                        readOnly
                                    />
                                </Form.Group>
                                <Form.Group>
                                    <Form.Label>Supplier</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="supplier_name"
                                        value={inventoryData.supplier_name || ''}
                                        readOnly
                                    />
                                </Form.Group>
                                <Form.Group>
                                    <Form.Label>Unit of Measurement</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="unit_of_measurement"
                                        value={inventoryData.unit_name || ''}
                                        readOnly
                                    />
                                </Form.Group>
                                <Form.Group>
                                    <Form.Label>Expiration Date</Form.Label>
                                    <Form.Control
    type={inventoryData.expiration_date ? "date" : "text"}
    name="expiration_date"
    value={inventoryData.expiration_date || "No Expiry Date"}
    readOnly
/>

                                </Form.Group>
                            </Col>
                        </Row>

                        {/* Barcode Display */}
                        {inventoryData.barcode && (
                            <Row className="mt-3">
                                <Col md={12} className="text-center">
                                    <Form.Group>
                                        <Form.Label>Generated Barcode</Form.Label>
                                        <div className="mt-2">
                                            <svg ref={barcodeRef}></svg>
                                        </div>
                                    </Form.Group>
                                </Col>
                            </Row>
                        )}

                        <div className="text-center mt-4">
                            <Button variant="secondary" onClick={handlePrintBarcode} className="button">
                                Print Barcode
                            </Button>
                        </div>
                    </Form>
                ) : (
                    <div>Loading...</div>  // Loading state until the inventory data is fetched
                )}
            </Modal.Body>

            {/* Quantity Input Modal */}
            <Modal show={showQuantityDialog} onHide={() => setShowQuantityDialog(false)} className="custom-modal">
                <Modal.Header closeButton>
                    <Modal.Title>Enter Number of Barcodes</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Form.Group>
                            <Form.Label>Number of Barcodes</Form.Label>
                            <Form.Control
                                type="number"
                                min="1"
                                value={barcodeQuantity}
                                onChange={(e) => setBarcodeQuantity(parseInt(e.target.value, 10))}
                            />
                        </Form.Group>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowQuantityDialog(false)}>
                        Cancel
                    </Button>
                    <Button variant="primary" onClick={handlePrint}>
                        Print
                    </Button>
                </Modal.Footer>
            </Modal> {/* End of quantity input modal */}
          
        </Modal>
    );
};

export default ViewInventoryModal;
