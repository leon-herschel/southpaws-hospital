import React, { useState, useEffect, useRef } from 'react';
import { Modal, Button, Form, Row, Col, Alert } from 'react-bootstrap';
import axios from 'axios';
import '../../assets/add.css';

const EditProductModal = ({ show, handleClose, editProduct, handleEditSubmit, errorMessage }) => {
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [categories, setCategories] = useState([]);
    const [brands, setBrands] = useState([]);
    const [generic, setGeneric] = useState([]);
    const [unitsOfMeasurement, setUnitsOfMeasurement] = useState([]);
    const brandNameRef = useRef(null);

    useEffect(() => {
        if (editProduct) {
            fetchCategories();
            fetchBrands();
            fetchGeneric();
            fetchUnits();
            setProduct({ 
                ...editProduct, // Ensure the ID is preserved
            });         
            setLoading(false);
            setTimeout(() => {
                if (brandNameRef.current) {
                    brandNameRef.current.focus();
                }
            }, 100);
        } else {
            setLoading(false);
            setProduct(null); // Reset product to null if editProduct is invalid
        }
    }, [editProduct, show]);

    const fetchCategories = () => {
        axios.get('http://localhost:80/api/category.php?archived=0')
            .then(response => setCategories(response.data.categories || []))
            .catch(error => console.error('Error fetching categories:', error));
    };

    const fetchBrands = () => {
        axios.get('http://localhost:80/api/brands.php?archived=0')
            .then(response => setBrands(response.data.brands || []))
            .catch(error => console.error('Error fetching brands:', error));
    };

    const fetchGeneric = () => {
        axios.get('http://localhost:80/api/generic.php?archived=0')
            .then(response => {
                setGeneric(response.data.records || []); // ✅ Ensure correct key is used
            })
            .catch(error => {
                console.error('Error fetching generic names:', error);
                setGeneric([]); // Handle failure gracefully
            });
    };
    
    const fetchUnits = () => {
        // Ensure the 'archived' query parameter is passed as expected (e.g., 0 for active units)
        axios.get('http://localhost:80/api/units.php?archived=0') // Fetch only active units
            .then(response => {
                // Check if response.data and response.data.units exist and are an array
                if (response.data && Array.isArray(response.data.units)) {
                    setUnitsOfMeasurement(response.data.units); // Set the units correctly
                } else {
                    // Log error and set empty array if no valid data
                    console.error('No valid unit data received:', response.data);
                    setUnitsOfMeasurement([]); // Reset units
                }
            })
            .catch(error => {
                // Handle error during fetch
                console.error('Error fetching units:', error);
                setUnitsOfMeasurement([]); // Reset units on error
            });
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setProduct(prevProduct => ({
            ...prevProduct,
            [name]: value,
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
    
        if (!product || !product.product_name || !product.id) {
            console.error('Product name and ID are required');
            return;
        }
    
        // Log the product data being submitted
    
        // Get user ID from localStorage
        const userId = localStorage.getItem('userID');
    
        if (!userId) {
            console.error('User ID is missing. Please log in.');
            return;
        }
    
        // Include `updated_by` in the request payload
        const updatedProduct = {
            ...product,
            updated_by: userId // ✅ Add updated_by field
        };
    
    
        axios.put('http://localhost:80/api/products.php', updatedProduct)
            .then(response => {
                // Log the response from the server
                handleEditSubmit(); // Trigger the parent method for state update
            })
            .catch(error => {
                // Log the error if there was an issue with the update
                console.error('Error updating product:', error);
            });
    };
    

    return (
        <Modal show={show} onHide={handleClose} className="custom-modal">
            <Modal.Header closeButton>
                <Modal.Title>Edit Product</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {loading ? (
                    <div>Loading...</div>
                ) : product ? (
                    <Form onSubmit={handleSubmit}>
                        {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}
                        <Row>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Product Name</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="product_name"
                                        ref={brandNameRef} // ✅ Attach ref to input field
                                        value={product.product_name || ''}
                                        onChange={handleInputChange}
                                        required    
                                   />
                                </Form.Group>
                                <Form.Group>
                                    <Form.Label>Generic</Form.Label>
                                    <Form.Control
                                        as="select"
                                        name="generic_id"
                                        value={product.generic_id || ''} 
                                        onChange={handleInputChange}
                                        required
                                    >
                                        <option value="">Select Generic Name</option>
                                        {generic.map(generic => (
                                            <option key={generic.id} value={generic.id}>{generic.generic_name}</option>
                                        ))}
                                    </Form.Control>
                                </Form.Group>
                                <Form.Group>
                                    <Form.Label>Brand</Form.Label>
                                    <Form.Control
                                        as="select"
                                        name="brand_id"
                                        value={product.brand_id || ''}
                                        onChange={handleInputChange}
                                        required
                                    >
                                        <option value="">Select Brand</option>
                                        {brands.map(brand => (
                                            <option key={brand.id} value={brand.id}>{brand.name}</option>
                                        ))}
                                    </Form.Control>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Unit of Measurement</Form.Label>
                                    <Form.Control
                                        as="select"
                                        name="unit_id"
                                        value={product.unit_id || ''}
                                        onChange={handleInputChange}
                                        required
                                    >
                                        <option value="">Select Unit</option>
                                        {unitsOfMeasurement.map(unit => (
                                            <option key={unit.id} value={unit.id}>{unit.unit_name}</option>
                                        ))}
                                    </Form.Control>
                                </Form.Group>
                                <Form.Group>
                                    <Form.Label>Category</Form.Label>
                                    <Form.Control
                                        as="select"
                                        name="category_id"
                                        value={product.category_id || ''}
                                        onChange={handleInputChange}
                                        required
                                    >
                                        <option value="">Select Category</option>
                                        {categories.map(category => (
                                            <option key={category.id} value={category.id}>{category.name}</option>
                                        ))}
                                    </Form.Control>
                                </Form.Group>

                            </Col>
                        </Row>
                        <div className="text-center mt-4">
                            <Button variant="primary" type="submit" className="button">
                                Update
                            </Button>
                        </div>
                    </Form>
                ) : (
                    <div>Error: Product not found</div>
                )}
            </Modal.Body>
        </Modal>
    );
};

export default EditProductModal;
