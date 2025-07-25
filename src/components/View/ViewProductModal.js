import React from 'react';
import { Modal, Button, Row, Col, Form } from 'react-bootstrap';

const ViewProductModal = ({ show, handleClose, viewProduct }) => {
    if (!viewProduct) return null; // Ensures that there's product data before rendering

    return (
        <Modal show={show} onHide={handleClose} className="custom-modal">
            <Modal.Header closeButton>
                <Modal.Title>View Product Details</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form>
                    <Row>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Product Name</Form.Label>
                                <Form.Control type="text" readOnly defaultValue={viewProduct.product_name} />
                            </Form.Group>
                            <Form.Group className="mb-3">
                                <Form.Label>Generic Name</Form.Label>
                                <Form.Control type="text" readOnly defaultValue={viewProduct.generic_name} />
                            </Form.Group>
                            <Form.Group className="mb-3">
                                <Form.Label>Brand</Form.Label>
                                <Form.Control type="text" readOnly defaultValue={viewProduct.brand_name} />
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Unit of Measurement</Form.Label>
                                <Form.Control type="text" readOnly defaultValue={viewProduct.unit_name} />
                            </Form.Group>
                            <Form.Group className="mb-3">
                                <Form.Label>Category</Form.Label>
                                <Form.Control type="text" readOnly defaultValue={viewProduct.category_name} />
                            </Form.Group>

                        </Col>
                    </Row>
                </Form>
            </Modal.Body>
            <Modal.Footer className="justify-content-center">
    <Button variant="primary" className="button" onClick={handleClose}>Close</Button>
</Modal.Footer>

        </Modal>
    );
};

export default ViewProductModal;
