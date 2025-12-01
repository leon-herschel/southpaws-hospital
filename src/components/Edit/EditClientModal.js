import React, { useState, useEffect, useRef } from "react";
import { Modal, Button, Form, Row, Col } from "react-bootstrap";
import "../../assets/add.css";

const EditClientModal = ({
  show,
  handleClose,
  editClient,
  handleEditChange,
  handleEditSubmit,
}) => {
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({});
  const brandNameRef = useRef(null);

  useEffect(() => {
    if (editClient && editClient.id) {
      setFormData(editClient); // Initialize form data with editClient values
      setLoading(false);
      setTimeout(() => {
        if (brandNameRef.current) {
          brandNameRef.current.focus();
        }
      }, 100);
    } else {
      setLoading(false);
    }
  }, [editClient, show]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value }); // Update formData state with new values
    handleEditChange(e); // Call handleEditChange from parent component
  };

  const handleSubmit = (e) => {
    e.preventDefault(); // Prevent the default form submission behavior
    handleEditSubmit(formData); // Call handleEditSubmit from parent component with updated formData
    handleClose(); // Close the modal after submission
  };

  return (
    <Modal show={show} onHide={handleClose} className="custom-modal">
      <Modal.Header closeButton>
        <Modal.Title>Edit Client</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {loading ? (
          <div>Loading...</div>
        ) : editClient ? (
          <Form onSubmit={handleSubmit}>
            <Row>
              {/* Left column */}
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Name</Form.Label>
                  <Form.Control
                    type="text"
                    name="name"
                    autoFocus // Simple auto-focus without ref
                    value={formData.name || ""}
                    onChange={handleChange}
                    placeholder="Enter name"
                  />
                </Form.Group>
                <Form.Group>
                  <Form.Label>Address</Form.Label>
                  <Form.Control
                    type="text"
                    name="address"
                    value={formData.address || ""}
                    onChange={handleChange}
                    placeholder="Enter address"
                  />
                </Form.Group>
              </Col>
              {/* Right column */}
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Email</Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    value={formData.email || ""}
                    onChange={handleChange}
                    placeholder="Enter email"
                  />
                </Form.Group>
                <Form.Group>
                  <Form.Label>Mobile Number</Form.Label>
                  <Form.Control
                    type="text"
                    name="cellnumber"
                    value={formData.cellnumber || ""}
                    onChange={handleChange}
                    placeholder="Enter cell number"
                  />
                </Form.Group>
                {/* Add other form fields as needed */}
              </Col>
            </Row>
            <div className="button-container">
              <Button variant="primary" type="submit" className="button">
                Update
              </Button>
            </div>
          </Form>
        ) : (
          <div>Error: Client not found</div>
        )}
      </Modal.Body>
    </Modal>
  );
};

export default EditClientModal;
