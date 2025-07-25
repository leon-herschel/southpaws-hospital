import React, { useState, useEffect, useRef } from 'react';
import { Modal, Button, Form, Alert } from 'react-bootstrap';
import { useNavigate } from "react-router-dom";
import axios from 'axios';
import '../../assets/add.css';

const AddServicesModal = ({ show, handleClose, onServicesAdded }) => {
    const [inputs, setInputs] = useState({ name: '', price: '', status: 'Available', consent_form: 'None' });
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const brandNameRef = useRef(null);
    
    useEffect(() => {
        if (show && brandNameRef.current) {
            brandNameRef.current.focus(); // ✅ Auto-focus when modal opens
        }
    }, [show]);

    // Reset state when modal is closed or opened
    useEffect(() => {
        if (!show) {
            setInputs({ name: '', price: '', status: 'Available', consent_form: 'None' }); // Reset inputs
            setError(''); // Clear errors
        }
    }, [show]);

    const handleChange = (event) => {
        const { name, value } = event.target;
        setInputs((prevInputs) => ({ ...prevInputs, [name]: value }));
    };

    const handleSubmit = (event) => {
        event.preventDefault();

        // Retrieve userID from local storage
        const userID = localStorage.getItem('userID');

        if (!userID) {
            setError('User not authenticated. Please log in.');
            return;
        }

        // Ensure the consent_form value is valid
        if (inputs.consent_form === 'None') {
            setInputs((prevInputs) => ({ ...prevInputs, consent_form: '' })); // Clear the consent_form if "None"
        }

        // Add created_by field to inputs
        const dataToSubmit = {
            ...inputs,
            created_by: userID
        };

        axios
            .post('http://localhost:80/api/services.php', dataToSubmit)
            .then(function (response) {
                if (response.data.status === 0) {
                    setError('Service name already exists.');
                } else {
                    setInputs({ name: '', price: '', status: 'Available', consent_form: 'None' }); // Reset inputs
                    setError(''); // Clear error
                    handleClose(); // Close modal
                    onServicesAdded(); // Notify parent component
                    navigate('/services'); // Redirect to services page
                }
            })
            .catch(function (error) {
                console.error('Error adding service:', error);
                setError('Failed to save service. Please try again.');
            });
    };

    return (
        <Modal show={show} onHide={handleClose} className="custom-modal">
            <Modal.Header closeButton>
                <Modal.Title>Add Service</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form onSubmit={handleSubmit}>
                    {error && <Alert variant="danger">{error}</Alert>}

                    <Form.Group>
                        <Form.Label>Service Name</Form.Label>
                        <Form.Control
                            type="text"
                            name="name"
                            ref={brandNameRef} // ✅ Attach ref to input field
                            onChange={handleChange}
                            value={inputs.name}
                            placeholder="Enter service name"
                            required
                        />
                    </Form.Group>

                    <Form.Group>
                        <Form.Label>Price</Form.Label>
                        <Form.Control
                            type="number"
                            name="price"
                            onChange={handleChange}
                            value={inputs.price}
                            placeholder="Enter price"
                            required
                        />
                    </Form.Group>

                    <Form.Group>
                        <Form.Label>Status</Form.Label>
                        <Form.Control
                            as="select"
                            name="status"
                            value={inputs.status}
                            onChange={handleChange}
                            required
                        >
                            <option value="Available">Available</option>
                            <option value="Unavailable">Unavailable</option>
                        </Form.Control>
                    </Form.Group>

                    <Form.Group>
                        <Form.Label>Consent Form</Form.Label>
                        <div>
                            <Form.Check
                                inline
                                type="radio"
                                name="consent_form"
                                id="immunization_form"
                                label="Immunization Form"
                                value="Immunization Form"
                                checked={inputs.consent_form === 'Immunization Form'}
                                onChange={handleChange}
                            />
                            <Form.Check
                                inline
                                type="radio"
                                name="consent_form"
                                id="surgical_form"
                                label="Surgical Form"
                                value="Surgical Form"
                                checked={inputs.consent_form === 'Surgical Form'}
                                onChange={handleChange}
                            />
                            <Form.Check
                                inline
                                type="radio"
                                name="consent_form"
                                id="none_form"
                                label="None"
                                value="None"
                                checked={inputs.consent_form === 'None'}
                                onChange={handleChange}
                            />
                        </div>
                    </Form.Group>
                    <Form.Text className="text-muted">
                        Leave as "None" if no consent form is required.
                    </Form.Text>

                    <div className="button-container mt-3">
                        <Button variant="primary" type="submit" className="button">
                            Add
                        </Button>
                    </div>
                    
                </Form>
            </Modal.Body>
        </Modal>
    );
};

export default AddServicesModal;
