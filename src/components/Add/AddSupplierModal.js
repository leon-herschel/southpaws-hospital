import React, { useState, useRef, useEffect } from 'react';
import { Modal, Button, Form, Alert } from 'react-bootstrap';
import { useNavigate } from "react-router-dom";
import axios from 'axios';
import '../../assets/add.css';

const AddSupplierModal = ({ show, handleClose, onSuppliersAdded }) => {
    const [inputs, setInputs] = useState({
        supplier_name: '',
        contact_number: '',
        email: '',
        address: '',
        contact_person: ''
    });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const supplierNameRef = useRef(null); // ✅ Create ref for input field

    // Retrieve user ID from localStorage
    const userId = localStorage.getItem('userID');

    useEffect(() => {
        if (show && supplierNameRef.current) {
            supplierNameRef.current.focus(); // ✅ Auto-focus when modal opens
        }
    }, [show]); // Runs every time `show` changes

    const handleChange = (event) => {
        const { name, value } = event.target;
        setInputs((prevInputs) => ({ ...prevInputs, [name]: value }));
        if (name === 'supplier_name') {
            setError(null);
        }
    };

    const handleSubmit = (event) => {
        event.preventDefault();
    
        if (!inputs.supplier_name.trim()) {
            setError('Supplier name cannot be empty.');
            return;
        }
    
        setIsLoading(true);
    
        const supplierData = {
            supplier_name: inputs.supplier_name,
            contact_number: inputs.contact_number,
            email: inputs.email,
            address: inputs.address,
            contact_person: inputs.contact_person,
            created_by: userId ? parseInt(userId) : null 
        };
    
        axios.post('http://localhost:80/api/suppliers.php', supplierData)
            .then((response) => {
                if (response.data.status === 1) {
                    const addedSupplier = {
                        id: response.data.inserted_id || response.data.id,
                        supplier_name: inputs.supplier_name, // ✅ Make sure it's correct
                    };
    
                    if (typeof onSuppliersAdded === 'function') {
                        onSuppliersAdded(addedSupplier); // ✅ Pass the new supplier
                    }
    
                    setInputs({
                        supplier_name: '',
                        contact_number: '',
                        email: '',
                        address: '',
                        contact_person: ''
                    });
    
                    handleClose();
                } else {
                    setError(response.data.message || 'Supplier name already exists.');
                }
            })
            .catch((error) => {
                if (error.response && error.response.status === 409) {
                    setError('Supplier name already exists.');
                } else {
                    setError('Failed to save supplier. Please try again.');
                }
            })
            .finally(() => {
                setIsLoading(false);
            });
    };
    
    

    return (
        <Modal show={show} onHide={handleClose} className="custom-modal">
            <Modal.Header closeButton>
                <Modal.Title>Add Supplier</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {error && <Alert variant="danger">{error}</Alert>}

                <Form onSubmit={handleSubmit}>
                    <div className="row">
                        {/* Left column */}
                        <div className="col-md-6">
                            <Form.Group>
                                <Form.Label>Supplier Name</Form.Label>
                                <Form.Control
                                    type="text"
                                    name="supplier_name"
                                    ref={supplierNameRef} // ✅ Attach ref to input field
                                    value={inputs.supplier_name}
                                    onChange={handleChange}
                                    placeholder="Enter supplier name"
                                    required
                                />
                            </Form.Group>
                            <Form.Group>
                                <Form.Label>Contact Person</Form.Label>
                                <Form.Control
                                    type="text"
                                    name="contact_person"
                                    value={inputs.contact_person}
                                    onChange={handleChange}
                                    placeholder="Enter contact person"
                                    required
                                />
                            </Form.Group>
                            <Form.Group>
                                <Form.Label>Contact Number</Form.Label>
                                <Form.Control
                                    type="text"
                                    name="contact_number"
                                    value={inputs.contact_number}
                                    onChange={handleChange}
                                    placeholder="Enter contact number"
                                    required
                                />
                            </Form.Group>
                        </div>
                        {/* Right column */}
                        <div className="col-md-6">
                            <Form.Group>
                                <Form.Label>Email</Form.Label>
                                <Form.Control
                                    type="email"
                                    name="email"
                                    value={inputs.email}
                                    onChange={handleChange}
                                    placeholder="Enter email"
                                    required
                                />
                            </Form.Group>
                            <Form.Group>
                                <Form.Label>Address</Form.Label>
                                <Form.Control
                                    type="text"
                                    name="address"
                                    value={inputs.address}
                                    onChange={handleChange}
                                    placeholder="Enter address"
                                    required
                                />
                            </Form.Group>
                        </div>
                    </div>
                    <div className="button-container">
                        <Button variant="primary" type="submit" className='button' disabled={isLoading}>
                            {isLoading ? 'Adding...' : 'Add'}
                        </Button>
                    </div>
                </Form>
            </Modal.Body>
        </Modal>
    );
};

export default AddSupplierModal;
