import React, { useState, useEffect, useRef } from 'react';
import { Modal, Button, Form, Alert } from 'react-bootstrap';
import axios from 'axios';
import '../../assets/add.css';

const AddGenericModal = ({ show, handleClose, onGenericAdded }) => {
    const [inputs, setInputs] = useState({ generic_name: '' });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const genericNameRef = useRef(null);
    
    
    useEffect(() => {
        if (show && genericNameRef.current) {
            genericNameRef.current.focus(); // ✅ Auto-focus when modal opens
        }
    }, [show]);    

    // Retrieve user ID from localStorage
    const userId = localStorage.getItem('userID');

    const handleChange = (event) => {
        const { name, value } = event.target;
        setInputs((prevInputs) => ({ ...prevInputs, [name]: value }));
    };

    const handleSubmit = (event) => {
        event.preventDefault();
    
        if (!inputs.generic_name.trim()) {
            setError('Generic name cannot be empty.');
            return;
        }
    
        setIsLoading(true);
    
        const genericData = {
            generic_name: inputs.generic_name,
            created_by: userId ? parseInt(userId) : null,
        };
    
        axios.post('http://localhost:80/api/generic.php', genericData)
            .then((response) => {
    
                if (response.data.status === 0) {
                    setError(response.data.message);
                } else {
                    // ✅ Ensure the API returns the inserted ID
                    const newGeneric = {
                        id: response.data.inserted_id || response.data.id, // ✅ Fallback if API returns a different key
                        generic_name: inputs.generic_name,
                    };
    
    
                    // ✅ Pass the new generic to parent component
                    if (typeof onGenericAdded === 'function') {
                        onGenericAdded(newGeneric);
                    }
    
                    // ✅ Reset form & close modal
                    setInputs({ generic_name: '' });
                    handleClose();
                }
            })
            .catch((error) => {
                setError('Failed to save generic. Please try again.');
            })
            .finally(() => {
                setIsLoading(false);
            });
    };
    
    const handleModalClose = () => {
        setError('');
        setInputs({ generic_name: '' });
        handleClose();
    };

    return (
        <Modal show={show} onHide={handleModalClose} className="custom-modal">
            <Modal.Header closeButton>
                <Modal.Title>Add Generic</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {error && <Alert variant="danger">{error}</Alert>}
                <Form onSubmit={handleSubmit}>
                    <Form.Group>
                        <Form.Label>Generic Name</Form.Label>
                        <Form.Control
                            type="text"
                            name="generic_name"
                            ref={genericNameRef} // ✅ Attach ref to input field
                            value={inputs.generic_name}
                            onChange={handleChange}
                            placeholder="Enter generic name"
                            required
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

export default AddGenericModal;
