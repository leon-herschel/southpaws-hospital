import React, { useState, useEffect, useRef } from 'react';
import { Modal, Button, Form, Alert } from 'react-bootstrap';
import '../../assets/add.css';

const EditGenericModal = ({ show, handleClose, editGeneric, handleEditChange, handleEditSubmit, errorMessage }) => {
    const [generic, setGeneric] = useState(null);
    const [loading, setLoading] = useState(true);
    const brandNameRef = useRef(null);

    useEffect(() => {
        if (editGeneric && editGeneric.id) {
            console.log("Edit modal received:", editGeneric); // Debugging line
            setGeneric({ ...editGeneric }); // ✅ Ensure object reference update
            setLoading(false);
            setTimeout(() => {
                if (brandNameRef.current) {
                    brandNameRef.current.focus();
                }
            }, 100);
        } else {
            setGeneric(null);
            setLoading(false);
        }
    }, [editGeneric, show]);
    

    const handleModalClose = () => {
        handleClose();
    };

    return (
        <Modal show={show} onHide={handleModalClose} className="custom-modal">
            <Modal.Header closeButton>
                <Modal.Title>Edit Generic</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {loading ? (
                    <div>Loading...</div>
                ) : generic !== null && generic !== undefined ? ( // ✅ Ensure `generic` exists
                    <Form onSubmit={handleEditSubmit}>
                        {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}
                        <Form.Group>
                            <Form.Label>Generic Name</Form.Label>
                            <Form.Control
                                type="text"
                                name="generic_name"
                                autoFocus // Simple auto-focus without ref
                                value={generic.generic_name || ''}
                                onChange={handleEditChange}
                                placeholder="Enter generic name"
                            />
                        </Form.Group>
                        <div className="button-container">
                            <Button variant="primary" type="submit" className='button'>
                                Update
                            </Button>
                        </div>
                    </Form>
                ) : (
                    <div style={{ color: 'red' }}>Error: Generic not found</div>
                )}
            </Modal.Body>
        </Modal>
    );
};

export default EditGenericModal;
