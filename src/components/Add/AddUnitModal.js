import React, { useState, useEffect, useRef } from 'react';
import { Modal, Button, Form, Alert } from 'react-bootstrap';
import axios from 'axios';
import '../../assets/add.css';

const AddUnitOfMeasurementModal = ({ show, onClose, onUnitAdded }) => {
    const [inputs, setInputs] = useState({ unit_name: '' });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const brandNameRef = useRef(null);
    
    useEffect(() => {
        if (show && brandNameRef.current) {
            brandNameRef.current.focus(); // ✅ Auto-focus when modal opens
        }
    }, [show]);    

    const handleChange = (event) => {
        const { name, value } = event.target;

        // Allow only letters (a-z, A-Z) for unit_name
        const regex = /^[a-zA-Z\s]*$/; // Accept only letters and spaces
        if (regex.test(value)) {
            setInputs((prevInputs) => ({ ...prevInputs, [name]: value }));
        }
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        
        if (!inputs.unit_name.trim()) {
            setError('Unit of measurement name cannot be empty.');
            return;
        }
    
        setIsLoading(true);
    
        // Get user ID from localStorage
        const userId = localStorage.getItem('userID') || null;
    
        // Prepare payload
        const unitData = {
            unit_name: inputs.unit_name,
            created_by: userId,
        };
    
        axios.post('http://localhost:80/api/units.php', unitData)
            .then((response) => {
                if (response.data.status === 1) {
                    const newUnit = {
                        id: response.data.inserted_id || response.data.id, 
                        unit_name: inputs.unit_name,
                    };
                    if (typeof onUnitAdded === 'function') {
                        onUnitAdded(newUnit);
                    }
                    setInputs({ unit_name: '' });
                    onClose();
                } else {
                    setError(response.data.message);
                }
            })
            .catch(() => {
                setError('Failed to save unit of measurement. Please try again.');
            })
            .finally(() => {
                setIsLoading(false);
            });
    };

    const handleModalClose = () => {
        setError(''); // Clear the error
        setInputs({ unit_name: '' }); // Reset inputs
        onClose(); // Call parent close handler
    };

    return (
        <>
            <Modal show={show} onHide={handleModalClose} className="custom-modal">
                <Modal.Header closeButton>
                    <Modal.Title>Add Unit of Measurement</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {error && <Alert variant="danger">{error}</Alert>}
                    <Form onSubmit={handleSubmit}>
                        <Form.Group>
                            <Form.Label>Unit of Measurement Name</Form.Label>
                            <Form.Control
                                type="text"
                                name="unit_name"
                                ref={brandNameRef} // ✅ Attach ref to input field
                                value={inputs.unit_name}
                                onChange={handleChange}
                                placeholder="Enter unit of measurement name"
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

        </>
    );
};

export default AddUnitOfMeasurementModal;
