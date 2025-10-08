import React, { useState, useEffect, useRef } from 'react';
import { Modal, Button, Form, Alert } from 'react-bootstrap';
import '../../assets/add.css';

const EditCategoryModal = ({ show, handleClose, editCategory, handleEditChange, handleEditSubmit, errorMessage }) => {
    const [category, setCategory] = useState(null);
    const [loading, setLoading] = useState(true);
    const brandNameRef = useRef(null);
    
    useEffect(() => {
        if (editCategory && editCategory.id) {
            setCategory(editCategory);
            setLoading(false);
            setTimeout(() => {
                if (brandNameRef.current) {
                    brandNameRef.current.focus();
                }
            }, 100);
        } else {
            setLoading(false);
        }
    }, [editCategory, show]);

    const handleModalClose = () => {
        handleClose(); // Call parent close handler
    };

    return (
        <Modal show={show} onHide={handleModalClose} className="custom-modal">
            <Modal.Header closeButton>
                <Modal.Title>Edit Category</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {loading ? (
                    <div>Loading...</div>
                ) : category ? (
                    <Form onSubmit={handleEditSubmit}>
                        {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}
                        <Form.Group>
                            <Form.Label>Category Name</Form.Label>
                            <Form.Control
                                type="text"
                                name="name"
                                value={category.name || ''}
                                onChange={handleEditChange}
                                autoFocus // Simple auto-focus without ref
                                placeholder="Enter category name"
                            />
                        </Form.Group>
                        <div className="button-container">
                            <Button variant="primary" type="submit" className='button btn-gradient'>
                                Update
                            </Button>
                        </div>
                    </Form>
                ) : (
                    <div>Error: Category not found</div>
                )}
            </Modal.Body>
        </Modal>
    );
};

export default EditCategoryModal;
