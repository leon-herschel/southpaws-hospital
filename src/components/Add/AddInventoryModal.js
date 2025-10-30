import React, { useState, useEffect, useRef } from 'react';
import { Modal, Button, Form, Row, Col } from 'react-bootstrap';
import axios from 'axios';
import JsBarcode from 'jsbarcode';
import '../../assets/add.css';
import { toast } from 'react-toastify'; // Import Toastify
import AddSupplierModal from './AddSupplierModal'; // Import the Add Supplier modal
import { v4 as uuidv4 } from 'uuid'; // For generating unique barcodes
import { FaPlus } from 'react-icons/fa';

const CreateInventoryModal = ({ show, handleClose, onItemAdded, productId }) => {
    const [inputs, setInputs] = useState([]);
    const [suppliers, setSuppliers] = useState([]);  // List of suppliers
    const [isSubmitting, setIsSubmitting] = useState(false);  // Track submission state
    const [showSupplierModal, setShowSupplierModal] = useState(false);  // State to control Supplier modal visibility
    const barcodeRef = useRef(null);
    const inventoryNameRef = useRef(null);
    const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
    const [existingExpirations, setExistingExpirations] = useState([]); // Stores existing expiration dates

    const [barcode, setBarcode] = useState('');

    // Generate barcode when the component mounts
    useEffect(() => {
        generateBarcode();
    }, []);

    const generateBarcode = () => {
        const uniqueBarcode = uuidv4().replace(/-/g, '').substring(0, 8); // Generate a 12-character barcode
        setBarcode(uniqueBarcode);
        setInputs(prev => ({
            ...prev,
            barcode: uniqueBarcode, // Ensure the barcode is saved in the form state
        }));
    };

    useEffect(() => {
        if (show && inventoryNameRef.current) {
            inventoryNameRef.current.focus(); // ✅ Auto-focus when modal opens
        }
    }, [show]);

    useEffect(() => {
    if (show && productId) {
        // Fetch product details for the selected productId
        axios.get(`${API_BASE_URL}/api/products.php?id=${productId}`)
            .then((response) => {
                const productData = response.data.product; // Ensure API returns product data

                if (response.data.inventory) {
                    setExistingExpirations(response.data.inventory.map(item => ({
                        barcode: item.barcode,
                        supplier_id: item.supplier_id,
                        expiration_date: item.expiration_date
                    })));
                } else {
                    setExistingExpirations([]); // Clear if no inventory
                }

                if (productData) {
                    setInputs(prev => ({
                        ...prev,
                        product_id: productId,
                        sku: productData.sku || '',
                        barcode: productData.barcode || barcode, // Ensure barcode is set
                        product_name: productData.product_name || '', // Ensure this field exists in API response
                        generic_name: productData.generic_name || '', // Ensure this field exists in API response
                    }));
                } else {
                    toast.error('Product not found.');
                    setInputs(prev => ({
                        ...prev,
                        product_id: '',
                        sku: '',
                        barcode: barcode, // Ensure barcode is preserved
                        product_name: '',
                        generic_name: '',
                    }));
                }
            })
            .catch((error) => {
                console.error('Error fetching product details:', error);
                toast.error('Failed to fetch product details.');
                setInputs(prev => ({
                    ...prev,
                    product_id: '',
                    sku: '',
                    barcode: '',
                    product_name: '',
                    generic_name: '',
                }));
            });
    } else {
        // Clear inputs when modal is closed or no product is selected
        setInputs({
            quantity: '',
            product_id: '',
            sku: '',
            barcode: '',
            product_name: '',
            generic_name: '',
        });
    }
}, [show, productId]); // Depend on show and productId
    

    // Fetch suppliers when the modal is opened
    useEffect(() => {
        if (show) {
            fetchSuppliers();
        }
    }, [show]);

    useEffect(() => {
        if (barcodeRef.current && inputs.barcode) {
            // Generate the barcode based on the entered barcode value
            JsBarcode(barcodeRef.current, inputs.barcode, {
                format: "CODE128",
                displayValue: true,
                lineColor: "#000",
                width: 2,
                height: 50,
            });
        }
    }, [inputs.barcode]);
    
    useEffect(() => {
        if (barcodeRef.current && inputs.sku) {
            JsBarcode(barcodeRef.current, inputs.sku, {
                format: "CODE128",
                displayValue: true,
                lineColor: "#000",
                width: 2,
                height: 50,
            });
        }
    }, [inputs.sku]);

    const fetchSuppliers = () => {
        axios
            .get(`${API_BASE_URL}/api/suppliers.php`)
            .then((response) => {
                setSuppliers(response.data.suppliers || []); // Safeguard with default empty array
            })
            .catch((error) => {
                console.error('Error fetching suppliers:', error);
                toast.error('Failed to fetch suppliers.');
                setSuppliers([]); // Reset suppliers if there's an error
            });
    };

    const handleChange = (event) => {
        const { name, value } = event.target;

        if (name === 'eom.quantity') {
            // Update eom.quantity separately
            setInputs((prevInputs) => ({
                ...prevInputs,
                eom: {
                    ...prevInputs.eom,
                    quantity: value,
                }
            }));
        } else {
            setInputs((prevInputs) => ({
                ...prevInputs,
                [name]: value,
            }));
        }
    };

    const handleSubmit = (event) => {
        event.preventDefault();
    
        const userId = localStorage.getItem('userID');
    
        if (!userId) {
            toast.error('User ID is missing. Please log in.');
            return;
        }
    
        if (!inputs.supplier_id) {
            toast.error('Please select a valid supplier.');
            return;
        }
    
        if (!inputs.price || !inputs.quantity) {
            toast.error('Please fill all required fields.');
            return;
        }
    
        const expirationDate = inputs.expiration_date ? inputs.expiration_date : "00";
    
        const isDuplicateBarcode = existingExpirations.some(
            item => item.barcode === inputs.barcode && 
                    item.supplier_id === inputs.supplier_id && 
                    item.expiration_date === expirationDate
        );
    
        if (isDuplicateBarcode) {
            toast.error('This barcode already exists with the same supplier and expiration date.');
            return;
        }
    
        const dataToSubmit = {
            ...inputs,
            barcode: inputs.barcode || barcode,
            expiration_date: expirationDate,
            created_by: userId,
        };
    
        setIsSubmitting(true);
    
        axios.post(`${API_BASE_URL}/api/inventory.php`, dataToSubmit)
            .then((response) => {
                if (response.data.status === 1) {
                    toast.success('Stock added successfully!');
    
                    // Generate a new barcode after submission
                    const newBarcode = uuidv4().replace(/-/g, '').substring(0, 12);
    
                    // Reset form fields but keep the new barcode
                    setInputs({
                        product_id: inputs.product_id, // Keep product info
                        sku: '',
                        barcode: newBarcode, // Assign new barcode
                        product_name: inputs.product_name, 
                        generic_name: inputs.generic_name,
                        price: '',
                        quantity: '',
                        expiration_date: '',
                        supplier_id: ''
                    });
    
                    // Update the barcode state
                    setBarcode(newBarcode);
    
                    // Notify parent component and close the modal
                    onItemAdded();
                    handleClose(); 
                } else {
                    toast.error(response.data.message);
                }
                setIsSubmitting(false);
            })
            .catch((error) => {
                toast.error('Failed to add stock. Please try again.');
                setIsSubmitting(false);
            });
    };

    const handleAddSupplier = () => {
        setShowSupplierModal(true); // Use the state for the supplier modal
    };


    const handleSupplierAdded = (newSupplier) => {
        toast.success('Supplier added successfully!');
    
        // Fetch the updated list of suppliers
        axios.get(`${API_BASE_URL}/api/suppliers.php`)
            .then((response) => {
                const updatedSuppliers = response.data.suppliers || [];
    
                setSuppliers(updatedSuppliers); // Update the supplier dropdown
    
                // Find the newly added supplier and auto-select it
                const newlyAddedSupplier = updatedSuppliers.find(supplier => supplier.supplier_name === newSupplier.supplier_name);
    
                if (newlyAddedSupplier) {
                    setInputs((prevInputs) => ({
                        ...prevInputs,
                        supplier_id: newlyAddedSupplier.id,
                    }));
    
                    // Ensure dropdown reflects the change
                    setTimeout(() => {
                        const supplierDropdown = document.querySelector("[name='supplier_id']");
                        if (supplierDropdown) supplierDropdown.value = newlyAddedSupplier.id;
                    }, 200);
                } else {
                    console.warn("❌ New Supplier Not Found in Updated List!");
                }
            })
            .catch((error) => {
                console.error("🔥 Failed to fetch Suppliers:", error);
                toast.error('Failed to fetch suppliers.');
            });
    };
    
    

    return (
        <Modal show={show} onHide={handleClose} className="custom-modal">
            <Modal.Header closeButton>
                <Modal.Title>Add Stock for Product</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form onSubmit={handleSubmit}>
                    <Row>

                        <Col md={6}>
                        
                        <Form.Group className="mb-4">
                                <Form.Label style={{ margin: 0 }}>Product Name</Form.Label>
                                <Form.Control
                                    type="text"
                                    name="name"
                                    value={inputs.product_name || ''} // Ensure it doesn't break if value is undefined
                                    readOnly
                                    key={inputs.product_name} // Force re-render when value changes
                                />
                            </Form.Group>
                            <Form.Group className="mb-4">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Form.Label style={{ margin: 0 }}>SKU</Form.Label>
                                    </div>
                                    <Form.Control
                                        type="text"
                                        name="sku"
                                        onChange={handleChange}
                                        placeholder="Enter SKU"
                                        required
                                    />
                                </Form.Group>
                            
                            <Form.Group className="mb-4">
                                <Form.Label style={{ margin: 0 }}>Price</Form.Label>
                                <Form.Control
                                    type="number"
                                    step="any"
                                    ref={inventoryNameRef} // ✅ Attach ref to input field
                                    name="price"
                                    onChange={handleChange}
                                    placeholder="Enter price"
                                    required
                                    min="0"
                                />
                            </Form.Group>
                            <Form.Group className="mb-4">
                                <Form.Label style={{ margin: 0 }}>Quantity</Form.Label>
                                <Form.Control
                                    type="number"
                                    name="quantity"
                                    onChange={handleChange}
                                    placeholder="Enter stock quantity"
                                    required
                                    min="0"
                                    value={inputs.quantity || ''}
                                    style={{ flex: 1 }}  // Take up full width
                                />
                            </Form.Group>
                            
                        </Col>
                        <Col md={6}>
                            <Form.Group className="mb-4">
                                <Form.Label style={{ margin: 0 }}>Generic Name</Form.Label>
                                <Form.Control
                                    type="text"
                                    name="generic_name"
                                    value={inputs.generic_name}
                                    readOnly
                                    key={inputs.generic_name} // Force re-render when value changes

                                />
                            </Form.Group>
                            <Form.Group className="mb-4">
                                <Form.Label style={{ margin: 0 }}>Barcode</Form.Label>
                                <Form.Control
                                    type="text"
                                    name="barcode"
                                    value={barcode}
                                    onChange={handleChange}
                                    placeholder="Auto-generated barcode"
                                    readOnly // Make the field read-only
                                    required
                                />
                            </Form.Group>
                            <Form.Group className="mb-4">
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Form.Label style={{ margin: 0 }}>Supplier</Form.Label>
                                    <Button 
                                        variant="success" 
                                        onClick={handleAddSupplier} 
                                        className="sticky-button" 
                                        size="sm"
                                    >
                                        <FaPlus />
                                    </Button>
                                </div>
                                <Form.Control
                                    as="select"
                                    name="supplier_id"
                                    onChange={handleChange}
                                    value={inputs.supplier_id || ''}  // Binding the value
                                    required
                                >
                                    <option value="">Select supplier</option>
                                    {suppliers.length > 0 ? (
                                        suppliers.map((supplier) => (
                                            <option key={supplier.id} value={supplier.id}>
                                                {supplier.supplier_name}
                                            </option>
                                        ))
                                    ) : (
                                        <option disabled>No suppliers available</option>
                                    )}
                                </Form.Control>
                            </Form.Group>

                    
                            <Form.Group className="mb-4">
                                <Form.Label style={{ margin: 0 }}>Expiration Date</Form.Label>
                                <Form.Control
                                    type="date"
                                    name="expiration_date"
                                    onChange={handleChange}
                                    min={new Date().toISOString().split("T")[0]}
                                />
                                {existingExpirations.some(item =>
                                    item.barcode === inputs.barcode &&
                                    item.supplier_id === inputs.supplier_id &&
                                    item.expiration_date === inputs.expiration_date
                                ) && <span className="text-danger">This expiration date already exists!</span>}
                            </Form.Group>
                        </Col>
                    </Row>

                    {/* Barcode Display */}
                    {inputs.barcode && (
                        <Row className="mt-3">
                            <Col md={12} className="text-center">
                                <Form.Group className="mb-4">
                                    <Form.Label style={{ margin: 0 }}>Generated Barcode</Form.Label>
                                    <div className="mt-2">
                                        <svg ref={barcodeRef}></svg>
                                    </div>
                                </Form.Group>
                            </Col>
                        </Row>
                    )}
                    <div className="text-center">
                        <Button
                            variant="primary"
                            type="submit"
                            className="button btn-gradient"
                            disabled={isSubmitting}  // Disable button during submission
                        >
                            {isSubmitting ? 'Submitting...' : 'Save'}
                        </Button>
                    </div>
                </Form>
            </Modal.Body>
            {/* Add Supplier Modal */}
            <AddSupplierModal
                show={showSupplierModal}
                handleClose={() => setShowSupplierModal(false)}
                onSuppliersAdded={handleSupplierAdded} // ✅ Pass the function here
            />

        </Modal>

        
    );
};

export default CreateInventoryModal; 
