import React, { useState, useEffect, useRef } from 'react';
import { Modal, Button, Form, Row, Col } from 'react-bootstrap';
import '../../assets/add.css';

const EditUserModal = ({ show, handleClose, editUser, handleEditChange, handleEditSubmit }) => {
    const [user, setUser] = useState(editUser || null);
    const brandNameRef = useRef(null);

    // Update local state when modal opens
    useEffect(() => {
        if (show && editUser) {
            setUser(editUser); // Set only when modal is opened
        }
    }, [show, editUser]);

    // Focus on the first name input when the modal opens
    useEffect(() => {
        if (show && brandNameRef.current) {
            brandNameRef.current.focus();
        }
    }, [show]);

    // Handle input changes and update local state
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setUser((prevUser) => ({ ...prevUser, [name]: value }));
        handleEditChange(e); // Call parent handler
    };

    return (
        <Modal show={show} onHide={handleClose} className="custom-modal">
            <Modal.Header closeButton>
                <Modal.Title>Edit User</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {!user ? (
                    <div>Error: User not found</div>
                ) : (
                    <Form onSubmit={handleEditSubmit}>
                        <Row>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>First Name</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="first_name"
                                        autoFocus // Simple auto-focus without ref
                                        value={user.first_name}
                                        onChange={handleInputChange}
                                        placeholder="Enter first name"
                                    />
                                </Form.Group>
                                <Form.Group>
                                    <Form.Label>Last Name</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="last_name"
                                        value={user.last_name}
                                        onChange={handleInputChange}
                                        placeholder="Enter last name"
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Email</Form.Label>
                                    <Form.Control
                                        type="email"
                                        name="email"
                                        value={user.email}
                                        onChange={handleInputChange}
                                        placeholder="Enter email"
                                    />
                                </Form.Group>
                                <Form.Group>
                                    <Form.Label>Account Type</Form.Label>
                                    <Form.Control
                                        as="select"
                                        name="user_role"
                                        value={user.user_role}
                                        onChange={handleInputChange}
                                    >
                                        <option value={1}>Veterinarian</option>
                                        <option value={2}>Receptionist</option>
                                        <option value={3}>Admin</option>
                                    </Form.Control>
                                </Form.Group>
                            </Col>
                        </Row>
                        <div className="button-container">
                            <Button variant="primary" type="submit" className="button">
                                Update
                            </Button>
                        </div>
                    </Form>
                )}
            </Modal.Body>
        </Modal>
    );
};

export default EditUserModal;
