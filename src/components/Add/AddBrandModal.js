import React, { useState, useEffect, useRef } from 'react';
import { Modal, Button, Form, Alert } from 'react-bootstrap';
import axios from 'axios';
import '../../assets/add.css';

const AddBrandModal = ({ show, handleClose, onBrandAdded }) => {
    const [inputs, setInputs] = useState({ name: '' });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
    
    const userId = localStorage.getItem('userID');

    const brandNameRef = useRef(null);
    
    useEffect(() => {
        if (show && brandNameRef.current) {
            brandNameRef.current.focus(); // ✅ Auto-focus when modal opens
        }
    }, [show]);

    const handleChange = (event) => {
        const { name, value } = event.target;
        setInputs((prevInputs) => ({ ...prevInputs, [name]: value }));
    };

    const handleSubmit = (event) => {
        event.preventDefault();
    
        if (!inputs.name.trim()) {
            setError('Brand name cannot be empty.');
            return;
        }
    
        setIsLoading(true);
    
        // Prepare payload
        const brandData = {
            name: inputs.name,
            created_by: localStorage.getItem('userID') || null, 
        };
    
        axios.post(`${API_BASE_URL}/api/brands.php`, brandData)
            .then((response) => {
                if (response.data.status === 1) {
                    const addedBrand = {
                        id: response.data.inserted_id || response.data.id,
                        name: inputs.name,
                    };
        
                    if (typeof onBrandAdded === 'function') {
                        onBrandAdded(addedBrand);
                    }
                    setInputs({ name: '' });
                    handleClose();
                } else {
                    setError(response.data.message);
                }
            })
            .catch(() => {
                setError('Failed to save brand. Please try again.');
            })
            .finally(() => {
                setIsLoading(false);
            });
    };
    

    const handleModalClose = () => {
        setError(''); // Clear the error
        setInputs({ name: '' }); // Reset inputs
        handleClose(); // Call parent close handler
    };

    return (
        <Modal show={show} onHide={handleModalClose} className="custom-modal">
            <Modal.Header closeButton>
                <Modal.Title>Add Brand</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {error && <Alert variant="danger">{error}</Alert>}
                <Form onSubmit={handleSubmit}>
                    <Form.Group>
                        <Form.Label>Brand Name</Form.Label>
                        <Form.Control
                            type="text"
                            name="name"
                            ref={brandNameRef} // ✅ Attach ref to input field
                            value={inputs.name}
                            onChange={handleChange}
                            placeholder="Enter brand name"
                        />
                    </Form.Group>
                    <div className="button-container">
                        <Button 
                            variant="primary" 
                            type="submit" 
                            className="button btn-gradient" 
                            disabled={isLoading}
                        >
                            {isLoading ? 'Adding...' : 'Add'}
                        </Button>
                    </div>
                </Form>
            </Modal.Body>
        </Modal>
    );
};

export default AddBrandModal;
