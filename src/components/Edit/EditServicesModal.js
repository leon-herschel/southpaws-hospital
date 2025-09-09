import React, { useState, useEffect, useRef } from 'react';
import { Modal, Button, Form, Alert } from 'react-bootstrap';
import axios from 'axios';
import '../../assets/add.css';

const EditServicesModal = ({ show, handleClose, editService, handleEditChange, handleEditSubmit }) => {
    const [localEditService, setLocalEditService] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(''); // State to hold error message
    const brandNameRef = useRef(null);

    // Sync local state with parent `editService` when the modal opens
    useEffect(() => {
        if (show && editService) {
            const [hours, mins] = (editService.duration || "00:30:00").split(":").map(Number);
            setLocalEditService({
                ...editService,
                duration: (hours * 60 + mins).toString()
            });
            setError('');
            setLoading(false);
            setTimeout(() => {
                if (brandNameRef.current) brandNameRef.current.focus();
            }, 100);
        } else {
            setLocalEditService({});
            setError('');
            setLoading(true);
        }
    }, [show, editService]);

    const handleLocalChange = (event) => {
        const { name, value } = event.target;
        setLocalEditService((prevState) => ({ ...prevState, [name]: value }));
        handleEditChange(event); // Call parent change handler
    };

    const handleSubmit = (event) => {
        event.preventDefault(); // Prevent default form submission
        setError(''); // Clear any previous errors

        const minutes = parseInt(localEditService.duration) || 30;
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        const durationTime = `${hours.toString().padStart(2,'0')}:${mins.toString().padStart(2,'0')}:00`;

        const updatedService = {
            ...localEditService,
            duration: durationTime
        };

        axios.put(`http://localhost:80/api/services.php/${localEditService.id}`, updatedService)
            .then((response) => {
                if (response.data.status === 0) {
                    setError('Service name already exists.');
                } else {
                    handleEditSubmit(event); // Notify parent of the successful submission
                    handleClose(); // Close the modal
                }
            })
            .catch((error) => {
                console.error('Error updating service:', error);
                setError('An error occurred while updating the service. Please try again.');
            });
    };

    return (
        <Modal show={show} onHide={handleClose} className="custom-modal">
            <Modal.Header closeButton>
                <Modal.Title>Edit Service</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {loading ? (
                    <div>Loading...</div>
                ) : localEditService && localEditService.id ? (
                    <Form onSubmit={handleSubmit}>
                        {error && <Alert variant="danger">{error}</Alert>}

                        <Form.Group>
                            <Form.Label>Service Name</Form.Label>
                            <Form.Control
                                type="text"
                                name="name"
                                autoFocus
                                value={localEditService.name || ''}
                                onChange={handleLocalChange}
                                placeholder="Enter service name"
                                required
                            />
                        </Form.Group>

                        <Form.Group>
                            <Form.Label>Price</Form.Label>
                            <Form.Control
                                type="number"
                                name="price"
                                value={localEditService.price || ''}
                                onChange={handleLocalChange}
                                placeholder="Enter price"
                                required
                            />
                        </Form.Group>

                        <Form.Group>
                            <Form.Label>Duration (minutes)</Form.Label>
                            <Form.Control
                                type="number"
                                min="1"
                                name="duration"
                                value={localEditService.duration || ""}
                                placeholder="Enter duration in minutes"
                                required
                                onChange={(e) => {
                                const val = e.target.value;
                                if (/^\d*$/.test(val)) {
                                    setLocalEditService((prev) => ({ ...prev, duration: val }));

                                    const minutes = parseInt(val) || 0;
                                    const hours = Math.floor(minutes / 60);
                                    const mins = minutes % 60;
                                    const durationTime = `${hours.toString().padStart(2, "0")}:${mins
                                    .toString()
                                    .padStart(2, "0")}:00`;

                                    handleEditChange({ target: { name: "duration", value: durationTime } });
                                }
                                }}
                            />
                        </Form.Group>

                        <Form.Group>
                            <Form.Label>Status</Form.Label>
                            <Form.Control
                                as="select"
                                name="status"
                                value={localEditService.status || 'Available'}
                                onChange={handleLocalChange}
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
                                    checked={localEditService.consent_form === 'Immunization Form'}
                                    onChange={handleLocalChange}
                                />
                                <Form.Check
                                    inline
                                    type="radio"
                                    name="consent_form"
                                    id="surgical_form"
                                    label="Surgical Form"
                                    value="Surgical Form"
                                    checked={localEditService.consent_form === 'Surgical Form'}
                                    onChange={handleLocalChange}
                                />
                                <Form.Check
                                    inline
                                    type="radio"
                                    name="consent_form"
                                    id="none_form"
                                    label="None"
                                    value=""
                                    checked={localEditService.consent_form === ''}
                                    onChange={handleLocalChange}
                                />
                            </div>
                        </Form.Group>

                        <Form.Text className="text-muted">
                            Leave as "None" if no consent form is required.
                        </Form.Text>

                        <div className="button-container mt-3">
                            <Button variant="primary" type="submit" className="button">
                                Update
                            </Button>
                        </div>
                    </Form>
                ) : (
                    <div>Error: Service not found</div>
                )}
            </Modal.Body>
        </Modal>
    );
};

export default EditServicesModal;
