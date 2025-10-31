import React, { useState, useEffect, useRef } from 'react';
import { Modal, Button, Form, Row, Col } from 'react-bootstrap';
import axios from 'axios';
import JsBarcode from 'jsbarcode';
import '../../assets/add.css';
import { toast } from 'react-toastify';
import AddUnitOfMeasurementModal from '../Add/AddUnitModal'; // Import the new modal
import AddSupplierModal from '../Add/AddSupplierModal'; // Import the Add Supplier modal

const EditInventoryModal = ({ show, handleClose, onItemUpdated, inventoryId }) => {
    const [inputs, setInputs] = useState({
        name: '',
        barcode: '',
        quantity: '',
        price: '',
        unit_of_measurement: '',
        expiration_date: '',
        supplier_id: '',
        sku:'',
    });
    const [suppliers, setSuppliers] = useState([]);
    const [unitsOfMeasurement, setUnitsOfMeasurement] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showUOMModal, setShowUOMModal] = useState(false);
    const [showSupplierModal, setShowSupplierModal] = useState(false);
    const barcodeRef = useRef(null);
    const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

    useEffect(() => {
        if (inventoryId && show) {
            fetchInventoryDetails();
        }
    }, [inventoryId, show]);

    useEffect(() => {
        // Update the barcode preview whenever the barcode changes
        if (barcodeRef.current && inputs.barcode) {
            JsBarcode(barcodeRef.current, inputs.barcode, {
                format: 'CODE128',
                displayValue: true,
                lineColor: '#000',
                width: 2,
                height: 50,
            });
        }
    }, [inputs.barcode]);

    useEffect(() => {
        if (show) {
            fetchSuppliers();
        }
    }, [show]);

    useEffect(() => {
        fetchUnitsOfMeasurement();
    }, []);

    const fetchInventoryDetails = () => {
        axios.get(`${API_BASE_URL}/api/inventory.php?id=${inventoryId}`)
            .then((response) => {
                const inventoryArray = response.data.inventory;
    
                // Check if the array is not empty and contains the data
                if (Array.isArray(inventoryArray) && inventoryArray.length > 0) {
                    // Find the specific inventory by ID, assuming `inventoryId` might not be unique or API can return multiple entries
                    const inventory = inventoryArray.find(item => parseInt(item.id) === parseInt(inventoryId));
    
                    if (inventory) {
                        setInputs({
                            name: inventory.name || '',
                            barcode: inventory.barcode || '',
                            quantity: inventory.quantity || '',
                            price: inventory.price || '',
                            unit_of_measurement: inventory.unit_of_measurement?.trim() || '',
                            expiration_date: inventory.expiration_date
                                ? inventory.expiration_date.split(' ')[0] // Extract date only
                                : '',
                            supplier_id: inventory.supplier_id || '',
                            sku: inventory.sku || '',
                        });
    
                        if (barcodeRef.current && inventory.barcode) {
                            JsBarcode(barcodeRef.current, inventory.barcode, {
                                format: 'CODE128',
                                displayValue: true,
                                lineColor: '#000',
                                width: 2,
                                height: 50,
                            });
                        }
                    } else {
                        toast.error('Specific inventory item not found.');
                    }
                } else {
                    toast.error('No inventory data found.');
                }
            })
            .catch((error) => {
                console.error('Error fetching inventory details:', error);
                toast.error('Failed to fetch inventory details.');
            });
    };
    

    const fetchSuppliers = () => {
        axios
            .get(`${API_BASE_URL}/api/suppliers.php`)
            .then((response) => {
                setSuppliers(response.data.suppliers || []);
            })
            .catch((error) => {
                console.error('Error fetching suppliers:', error);
                toast.error('Failed to fetch suppliers.');
            });
    };

    const fetchUnitsOfMeasurement = () => {
        axios
            .get(`${API_BASE_URL}/api/units.php`)
            .then((response) => {
                const unitsArray = Array.isArray(response.data.unit_of_measurement) 
                    ? response.data.unit_of_measurement.map((unit) => ({
                        ...unit,
                        unit_name: unit.unit_name.trim(),
                    }))
                    : [];
    
                setUnitsOfMeasurement(unitsArray);
            })
            .catch((error) => {
                console.error('Error fetching units of measurement:', error);
                toast.error('Failed to fetch units of measurement.');
                setUnitsOfMeasurement([]); // Ensure it's always an array
            });
    };
    

    const handleChange = (event) => {
        const { name, value } = event.target;
    
        setInputs((prevInputs) => ({
            ...prevInputs,
            [name]: value === '' ? null : value, // ✅ Set empty date to null
        }));
    };
    

    const handleSubmit = (event) => {
        event.preventDefault();
    
        const userId = localStorage.getItem('userID');
        if (!userId) {
            toast.error('User ID is missing. Please log in.');
            return;
        }
    
        const formattedInputs = { 
            ...inputs, 
            id: inventoryId, 
            updated_by: userId,
            expiration_date: inputs.expiration_date ? inputs.expiration_date : null  // ✅ Ensure empty date is set as null
        };
    
        axios.put(`${API_BASE_URL}/api/inventory.php/${inventoryId}`, formattedInputs)
            .then((response) => {
                if (response.data.status === 1) {
                    toast.success('Inventory updated successfully!');
                    handleClose();
                    onItemUpdated(response.data.updatedInventoryItem);
                } else {
                    toast.error(response.data.message || 'Failed to update inventory.');
                }
            })
            .catch((error) => {
                console.error('Error updating inventory:', error);
                toast.error('Failed to update inventory. Please try again.');
            });
    };
    
    
    
    const handleAddUOM = () => {
        setShowUOMModal(true);
    };

    const handleAddSupplier = () => {
        setShowSupplierModal(true);
    };

    const handleUnitAdded = () => {
        fetchUnitsOfMeasurement();
    };

    const handleSupplierAdded = () => {
        fetchSuppliers();
    };

    return (
        <Modal show={show} onHide={handleClose} className="custom-modal">
            <Modal.Header closeButton>
                <Modal.Title>Edit Inventory</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form onSubmit={handleSubmit}>
                    <Row>
                        <Col md={6}>
                        <Form.Group className="mb-3">
                                <Form.Label style={{ margin: 0 }}>SKU</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="sku"
                                        value={inputs.sku || ''}  // ✅ Prepopulate SKU
                                        onChange={handleChange}
                                        placeholder="Enter SKU"
                                        required
                                        autoFocus // Simple auto-focus without ref

                                    />
                                </Form.Group>

                            <Form.Group className="mb-3">
                                <Form.Label style={{ margin: 0 }}>Price</Form.Label>
                                <Form.Control
                                    type="number"
                                    name="price"
                                    value={inputs.price || ''}
                                    onChange={(e) => {
                                        const value = parseFloat(e.target.value);
                                        if (value >= 0 || e.target.value === '') {
                                            handleChange(e);
                                        }
                                    }}
                                    placeholder="Enter price"
                                    required
                                    min="0"
                                />
                            </Form.Group>
                        </Col>
                        
                        <Col md={6}>

                            <Form.Group className="mb-3">
                                <Form.Label style={{ margin: 0 }}>Supplier</Form.Label>
                                <Form.Control
                                    as="select"
                                    name="supplier_id"
                                    value={inputs.supplier_id || ''}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="">Select supplier</option>
                                    {suppliers.map((supplier) => (
                                        <option key={supplier.id} value={supplier.id}>
                                            {supplier.supplier_name}
                                        </option>
                                    ))}
                                </Form.Control>
                            </Form.Group>
                            <Form.Group className="mb-3">
                                <Form.Label style={{ margin: 0 }}>Expiration Date</Form.Label>
                                <Form.Control
                                    type="date"
                                    name="expiration_date"
                                    value={inputs.expiration_date || ''}
                                    onChange={handleChange}
                                    min={new Date().toISOString().split("T")[0]}
                                />
                            </Form.Group>
                        </Col>
                    </Row>
                                          {/* Barcode Preview Above Update Button */}
                            <Row className="mt-3">
                                <Col md={12} className="text-center">
                                    <Form.Group className="mb-3">
                                        <Form.Label style={{ margin: 0 }}>Generated Barcode</Form.Label>
                                        <div className="mt-2">
                                            <svg ref={barcodeRef}></svg>
                                        </div>
                                    </Form.Group>
                                </Col>
                            </Row>
                        <div className="button-container">
                            <Button variant="primary" type="submit" className="button btn-gradient">
                                Update
                            </Button>
                        </div>
                </Form>
            </Modal.Body>
            <AddSupplierModal
                show={showSupplierModal}
                onClose={() => setShowSupplierModal(false)}
                onSupplierAdded={handleSupplierAdded}
            />
        </Modal>
    );
};

export default EditInventoryModal;
