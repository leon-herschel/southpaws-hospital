import React, { useState, useEffect, useRef } from 'react';
import { Modal, Button, Form, Alert } from 'react-bootstrap';
import '../../assets/add.css';

const EditBrandModal = ({ show, handleClose, editUnit, handleEditChange, handleEditSubmit, errorMessage }) => {
    const [unit, setUnit] = useState(null);
    const [loading, setLoading] = useState(true);
    const brandNameRef = useRef(null);
    
    useEffect(() => {
        if (editUnit && editUnit.id) {
            setUnit(editUnit);
            setLoading(false);

            // ✅ Delay focus to allow rendering first
            setTimeout(() => {
                if (brandNameRef.current) {
                    brandNameRef.current.focus();
                }
            }, 100);
        } else {
            setLoading(false);
        }
    }, [editUnit, show]); // ✅ Depend on `editUnit` and `show`

    const handleModalClose = () => {
        handleClose(); // Call parent close handler
    };

    return (
        <Modal show={show} onHide={handleModalClose} className="custom-modal">
            <Modal.Header closeButton>
                <Modal.Title>Edit Brand</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {loading ? (
                    <div>Loading...</div>
                ) : unit ? (
                    <Form onSubmit={handleEditSubmit}>
                        {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}
                        <Form.Group>
                            <Form.Label>Brand Name</Form.Label>
                            <Form.Control
                                type="text"
                                name="name"
                                value={unit.name || ''}
                                onChange={handleEditChange}
                                autoFocus // Simple auto-focus without ref
                                placeholder="Enter unit of measurement"
                            />
                        </Form.Group>
                        <div className="button-container">
                            <Button variant="primary" type="submit" className='button btn-gradient'>
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

export default EditBrandModal;
