import React, { useState, useEffect, useRef } from 'react';
import { Modal, Button, Form, Alert } from 'react-bootstrap';
import '../../assets/add.css';

const EditUnitOfMeasurementModal = ({ show, handleClose, editUnit, handleEditChange, handleEditSubmit, errorMessage }) => {
    const [unit, setUnit] = useState({ unit_name: '' });
    const [loading, setLoading] = useState(true);
    const brandNameRef = useRef(null);

    // Update the local state only when `editUnit` changes
    useEffect(() => {
        if (editUnit && editUnit.id) {
            setUnit({ ...editUnit, archived: 0}); // Copy the `editUnit` values into the state
            setLoading(false);
            setTimeout(() => {
                if (brandNameRef.current) {
                    brandNameRef.current.focus();
                }
            }, 100);
        } else {
            setLoading(false);
        }
    }, [editUnit, show]); // Dependency array will only trigger when `editUnit` changes

    const handleInputChange = (event) => {
        const { name, value } = event.target;

        // Allow only letters (A-Z, a-z) and prevent numbers/symbols
        if (/^[A-Za-z\s]*$/.test(value)) {
            setUnit((prevUnit) => ({ ...prevUnit, [name]: value }));
            handleEditChange(event); // Pass the valid input to parent function
        }
    };

    const handleModalClose = () => {
        handleClose(); // Call parent close handler
    };

    return (
        <Modal show={show} onHide={handleModalClose} className="custom-modal">
            <Modal.Header closeButton>
                <Modal.Title>Edit Unit of Measurement</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {loading ? (
                    <div>Loading...</div>
                ) : unit ? (
                    <Form onSubmit={handleEditSubmit}>
                        {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}
                        <Form.Group>
                            <Form.Label>Unit Name</Form.Label>
                            <Form.Control
                                type="text"
                                name="unit_name"
                                autoFocus // Simple auto-focus without ref
                                value={unit.unit_name || ''} // Ensure unit_name is set to empty if undefined
                                onChange={handleInputChange}
                                placeholder="Enter unit of measurement"
                            />
                        </Form.Group>
                        <div className="button-container">
                            <Button variant="primary" type="submit" className="button btn-gradient">
                                Update
                            </Button>
                        </div>
                    </Form>
                ) : (
                    <div>Error: Unit not found</div>
                )}
            </Modal.Body>
        </Modal>
    );
};

export default EditUnitOfMeasurementModal;
