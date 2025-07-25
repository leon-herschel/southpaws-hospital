import React, { useState, useEffect, useRef } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import axios from 'axios';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const EditImmunizationFormModal = ({
    show,
    handleClose,
    onFormUpdated,
    formData,
    owners = [],
    pets = [],
}) => {
    // Form state
    const [formState, setFormState] = useState({
        client_id: '',
        patient_id: [],
        signature: 0,
        created_at: '',
    });

    // Additional states
    const [notes, setNotes] = useState([]); // Holds immunization notes
    const [capturedImage, setCapturedImage] = useState(null);
    const [capturedBlob, setCapturedBlob] = useState(null); // Holds the captured image blob

    // Camera states
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [stream, setStream] = useState(null);

    // Fetch immunization notes when the modal is shown
    useEffect(() => {
        if (show) {
            fetchImmunizationNotes();
            setCapturedImage(formData.pet_image);

            // Initialize form state with formData
            setFormState({
                client_id: formData.client_id || '',
                patient_id: Array.isArray(formData.patient_id)
                    ? formData.patient_id.map(id => parseInt(id, 10)) // Convert to numbers
                    : [],
                signature: formData.signature || 0,
                created_at: formData.created_at || '',
            });
        }
    }, [show, formData]);

    // Fetch immunization notes
    const fetchImmunizationNotes = async () => {
        try {
            const response = await axios.get('http://localhost:80/api/immunization_notes.php');
            setNotes(response.data); // Assuming the API returns an array of notes
        } catch (error) {
            console.error('Failed to fetch immunization notes:', error);
        }
    };

    // Handle form input changes
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormState(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? (checked ? 1 : 0) : value,
        }));
    };

    // Handle pet selection changes
    const handlePetSelectionChange = (petId) => {
    
        const updatedPets = formState.patient_id.includes(petId)
            ? formState.patient_id.filter(id => id !== petId) // Remove pet if already selected
            : [...formState.patient_id, petId]; // Add pet if not selected
    
    
        setFormState(prev => ({
            ...prev,
            patient_id: updatedPets,
        }));
    };
    // Start camera
    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
            videoRef.current.srcObject = stream;
            setStream(stream);
        } catch (error) {
            console.error("Error accessing the camera: ", error);
        }
    };

    // Capture image
    const captureImage = () => {
        const canvas = canvasRef.current;
        const video = videoRef.current;
        const context = canvas.getContext("2d");

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        canvas.toBlob((blob) => {
            setCapturedBlob(blob);
            setCapturedImage(URL.createObjectURL(blob)); // Show preview
        }, "image/jpeg");

        // Stop camera stream
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
    
        // Log the payload being sent to the API
        const payload = {
            id: formData.id,
            client_id: parseInt(formState.client_id, 10),
            patient_id: formState.patient_id.join(', '), // Convert array to comma-separated string
            signature: formState.signature,
        };
    
        try {
            const response = await axios.put(
                `http://localhost:80/api/immunization.php/${formData.id}`,
                payload,
                {
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }
            );
    
            // Log the API response
    
            if (response.data.status === 'success') {
                toast.success("Immunization form updated successfully!");
                if (onFormUpdated) onFormUpdated();
                handleClose();
            } else {
                toast.error(response.data.message || "Failed to update the form.");
            }
        } catch (error) {
            // Log the error
            console.error('Error updating immunization form:', error);
            toast.error('Failed to update immunization form. Please try again.');
        }
    };

    return (
        <Modal show={show} onHide={handleClose} size="xl" centered>
            <Modal.Header closeButton>
                <Modal.Title>Edit Immunization Form</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form onSubmit={handleSubmit}>
                    {/* Date Signed */}
                    <Form.Group className="mb-3">
                        <Form.Label>Date Signed:</Form.Label>
                        <Form.Control
                            type="text"
                            value={new Date(formState.created_at).toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                            })}
                            readOnly
                        />
                    </Form.Group>

                    {/* Owner Selection */}
                    <Form.Group className="mb-3">
                        <Form.Label>Owner:</Form.Label>
                        <Form.Select
                            name="client_id"
                            value={formState.client_id}
                            onChange={handleChange}
                            required
                        >
                            <option value="">Select Owner</option>
                            {owners.map(owner => (
                                <option key={owner.id} value={owner.id}>
                                    {owner.name} {owner.id === parseInt(formState.client_id) ? '(Current)' : ''}
                                </option>
                            ))}
                        </Form.Select>
                    </Form.Group>

                    {/* Pet Selection */}
                    <Form.Group className="mb-3">
    <Form.Label>Pet:</Form.Label>
    <div>
        {pets
            .filter(pet => pet.ownerId === parseInt(formState.client_id, 10)) // Filter pets by owner
            .map(pet => (
                <Form.Check
                    key={pet.id}
                    type="checkbox"
                    label={pet.name}
                    name="patient_id"
                    value={pet.id}
                    checked={formState.patient_id.includes(pet.id)} // Check if pet is selected
                    onChange={() => handlePetSelectionChange(pet.id)} // Handle selection change
                />
            ))}
    </div>
</Form.Group>

                    {/* Camera Capture */}
                    {/*<Form.Group className="mb-3">
                        <Form.Label>Capture Client Image:</Form.Label>
                        <div>
                            {capturedImage ? (
                                <img src={capturedImage} alt="Captured" className="mb-2" style={{ width: "100%", maxHeight: "300px", objectFit: "cover", borderRadius: "8px" }} />
                            ) : (
                                <video ref={videoRef} autoPlay style={{ width: "100%", display: stream ? "block" : "none" }} />
                            )}
                        </div>

                        {!capturedImage ? (
                            <>
                                <Button onClick={startCamera} variant="secondary">Open Camera</Button>
                                {stream && <Button onClick={captureImage} variant="success" className="ms-2">Capture</Button>}
                            </>
                        ) : (
                            <Button variant="warning" onClick={() => setCapturedImage(null)}>Retake Photo</Button>
                        )}

                        <canvas ref={canvasRef} style={{ display: "none" }} />
                    </Form.Group>*/}

                    {/* Notes Section */}
                    {notes.map((note, index) => (
                        <div key={index} className="border p-3 mb-3 bg-light">
                            <h5 className="text-center">{note.title}</h5>
                            <p>{note.content}</p>
                        </div>
                    ))}

                    {/* Signature Checkbox */}
                    <Form.Group className="form-check mb-3">
                        <Form.Check
                            type="checkbox"
                            name="signature"
                            id="signatureCheck"
                            label="I have read and fully understand the above information. I understand the risks and give my consent for having my pet vaccinated."
                            checked={!!formState.signature}
                            onChange={handleChange}
                        />
                    </Form.Group>

                    {/* Submit Button */}
                    <div className="text-center mt-4">
                        <Button variant="primary" type="submit">Save Changes</Button>
                    </div>
                </Form>
            </Modal.Body>
        </Modal>
    );
};

export default EditImmunizationFormModal;