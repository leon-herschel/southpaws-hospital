import React, { useState, useEffect, useRef } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import axios from 'axios';
import { toast } from 'react-toastify';

function AddSurgicalFormModal({ show, handleClose, onFormAdded, selectedClient, serviceForForm, selectedPetsData }) {
    const [formData, setFormData] = useState({
        surgery_date: '',
        owner: '',
        pet: [],
        surgical_procedure: '',
        signature: 0, // Default signature value
        date_signed: new Date().toISOString().split('T')[0], // Current date
        created_by: null, // Will be dynamically set

    });
    const [errorMessage, setErrorMessage] = useState('');
    const [owners, setOwners] = useState([]);
    const [pets, setPets] = useState([]);
    const today = new Date().toISOString().split('T')[0]; // Today's date in YYYY-MM-DD format

    const [notes, setNotes] = useState([]); // State to hold immunization notes
    const [surgicalServices, setSurgicalServices] = useState([]);

    // Camera states
    const [capturedImage, setCapturedImage] = useState(null);
    const [capturedBlob, setCapturedBlob] = useState(null);
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [stream, setStream] = useState(null);

    const [isFormDisabled, setIsFormDisabled] = useState(false);


    useEffect(() => {
        if (show) {
            fetchImmunizationNotes();
            fetchSurgicalServices();
            console.log('Selected Pets Data in modal:', selectedPetsData); // Log here
    
            const petsData = Array.isArray(selectedPetsData) && selectedPetsData.length > 0 ? selectedPetsData : [];
    
            setFormData(prev => {
                return {
                    ...prev,
                    created_by: localStorage.getItem('userID') || 1,
                    owner: selectedClient || '',
                    surgical_procedure: serviceForForm ? serviceForForm.id : prev.surgical_procedure, // ✅ Use service ID
                    pet: petsData.map(pet => pet.pet_id), // Pre-fill selected pets
                };
            });
            setIsFormDisabled(Boolean(selectedClient && selectedPetsData.length > 0));

        }
    }, [show, selectedClient, serviceForForm, selectedPetsData]); // ✅ Ensure dependency on `serviceForForm`
    

    // Start Camera
    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            videoRef.current.srcObject = stream;
            setStream(stream);
        } catch (error) {
            console.error("Error accessing the camera: ", error);
        }
    };

    const resetForm = () => {
        setFormData({
            surgery_date: '',
            owner: '',
            pet: [],
            surgical_procedure: '',
            signature: 0, // Default signature value
            date_signed: new Date().toISOString().split('T')[0], // Current date
            created_by: null, // Will be dynamically set
        });
        setCapturedImage(null);
        setCapturedImage(null);
        setErrorMessage('');
    }; 

    // Capture Image
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
    
    
    const fetchImmunizationNotes = async () => {
        try {
            const response = await axios.get('http://localhost:80/api/surgical_notes.php');
            setNotes(response.data); // Assuming the API returns an array of notes
        } catch (error) {
            console.error('Failed to fetch immunization notes:', error);
        }
    };

    const fetchSurgicalServices = async () => {
        try {
            const response = await axios.get('http://localhost:80/api/services.php');
    
            // Handle both possible response formats
            if (Array.isArray(response.data)) {
                setSurgicalServices(response.data);  // If response is directly an array
            } else if (response.data && Array.isArray(response.data.services)) {
                setSurgicalServices(response.data.services);  // If response is wrapped in an object
            } else {
                setSurgicalServices([]); // Ensure it's always an array
                console.error('Unexpected API response format:', response.data);
            }
        } catch (error) {
            console.error('Failed to fetch surgical services:', error);
            setSurgicalServices([]); // Reset to an empty array if fetch fails
        }
    };
    
    const handleModalClose = () => {
        resetForm(); // Reset form when closing the modal
        setErrorMessage(''); // Clear the error message
        setCapturedImage(null);
        setCapturedImage(null);
        setStream(null);
        handleClose(); // Assuming handleClose is passed as a prop or defined elsewhere
    };
    

    useEffect(() => {
        if (show) {
            fetchOwnersAndPets();
        }
    }, [show]);

    const fetchOwnersAndPets = async () => {
        try {
            const response = await axios.get('http://localhost:80/api/clients.php');
            const { clients } = response.data;
    
            if (Array.isArray(clients)) {
                setOwners(clients);
    
                // Ensure each pet has a valid ID and name
                const allPets = clients.flatMap(client =>
                    (client.pets || []).map(pet => ({
                        id: pet.pet_id,      // Ensure `pet_id` exists
                        name: pet.pet_name,  // Ensure `pet_name` exists
                        ownerId: client.id,  // Ensure mapping to owner
                    }))
                );
    
                console.log("Fetched Pets:", allPets); // Debugging step
                setPets(allPets);
            } else {
                console.error('Invalid data format received for clients.');
            }
        } catch (error) {
            console.error('Error fetching owners and pets:', error);
        }
    };
    

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? (checked ? 1 : 0) : value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const formDataToSend = new FormData();
        formDataToSend.append('client_id', formData.owner);
        formDataToSend.append('patient_id', formData.pet);
        formDataToSend.append('surgery_date', formData.surgery_date);
        formDataToSend.append('surgical_procedure', formData.surgical_procedure);
        formDataToSend.append('signature', formData.signature);
        formDataToSend.append('date_signed', formData.date_signed);
        formDataToSend.append('created_by', formData.created_by);

        // Attach captured image
        if (capturedBlob) {
            const file = new File([capturedBlob], "captured_image.jpg", { type: "image/jpeg" });
            formDataToSend.append('pet_image', file);
        }

        try {
            const response = await axios.post('http://localhost:80/api/surgical.php', formDataToSend, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            if (response.data.status === 'success') {
                if (onFormAdded) onFormAdded();
                handleClose();
            } else {
                toast.error(response.data.message || 'Failed to submit form');
            }
        } catch (error) {
            console.error('Failed to submit form:', error);
        }
    };

    return (
        <Modal show={show} onHide={handleModalClose} size="lg" centered>
            <Modal.Header closeButton>
                <Modal.Title>Veterinary Surgical Consent Form</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form onSubmit={handleSubmit}>
                    {/* Owner's Name and Address */}
                    <Form.Group className="mb-3">
                        <Form.Label style={{ margin: 0 }}>Owner's Name:</Form.Label>
                        <Form.Select
                            name="owner"
                            value={formData.owner}
                            onChange={handleChange}
                            required
                            disabled={isFormDisabled} // Disable if data is passed

                        >
                            <option value="">Select Owner</option>
                            {owners.map(owner => (
                                <option key={owner.id} value={owner.id}>
                                    {owner.name}
                                </option>
                            ))}
                        </Form.Select>
                    </Form.Group>

                  {/* Pet Name */}

                  <Form.Group className="mb-3">
    <Form.Label style={{ margin: 0 }}>Pet's Name:</Form.Label>
    <div>
        {/* If selectedPetsData is available, show them */}
        {selectedPetsData && selectedPetsData.length > 0 ? (
            selectedPetsData.map((pet, index) => (
                <div key={pet.id || index}>  
                    <strong>{pet.pet_name}</strong> 
                </div>
            ))
        ) : (
            /* Otherwise, show pets linked to the selected owner */
            pets
                .filter(pet => pet.ownerId === parseInt(formData.owner)) // ✅ Filter pets by selected owner
                .map(pet => (
                    <Form.Check
                        key={pet.id}  
                        type="checkbox"
                        label={pet.name} // ✅ Display pet's name correctly
                        name="pet"
                        value={pet.id}
                        checked={formData.pet.includes(pet.id)}
                        onChange={(e) => {
                            const petId = parseInt(e.target.value);
                            setFormData(prev => ({
                                ...prev,
                                pet: prev.pet.includes(petId)
                                    ? prev.pet.filter(id => id !== petId) // Remove pet if unchecked
                                    : [...prev.pet, petId], // Add pet if checked
                            }));
                        }}
                    />
                ))
        )}
    </div>
</Form.Group>

                    {/* Surgery Date */}
                    <Form.Group className="mb-3">
                        <Form.Label style={{ margin: 0 }}>Surgery Date:</Form.Label>
                        <Form.Control
                            type="date"
                            name="surgery_date"
                            value={formData.surgery_date}
                            onChange={handleChange}
                            required
                            min={today}
                        />
                    </Form.Group>

                    {/* Surgical Procedure */}
                    <Form.Group className="mb-3">
                    <Form.Label style={{ margin: 0 }}>Surgical Procedure:</Form.Label>
                    <Form.Select
                        name="surgical_procedure"
                        value={formData.surgical_procedure} // ✅ Ensure this matches service ID
                        onChange={handleChange}
                        required
                        disabled={isFormDisabled} // Disable if data is passed
                    >
                        <option value="">Select Surgical Procedure</option>
                        {surgicalServices
                            .filter(service => service.consent_form === "Surgical Form" && service.status === "Available")
                            .map(service => (
                                <option key={service.id} value={service.id}>
                                    {service.name}
                                </option>
                            ))}
                    </Form.Select>
                </Form.Group>

                    {/* Camera Capture */}
                    <Form.Group className="mb-3">
                        <Form.Label style={{ margin: 0 }}>
                            Capture Client Image: <span style={{ color: "red" }}>*</span>
                        </Form.Label>

                        {/* Camera Buttons - Positioned Below the Label */}
                        <div className="d-flex gap-2 mb-2">
                            <Button onClick={startCamera} variant="secondary">Open Camera</Button>
                            {stream && <Button onClick={captureImage} variant="success">Capture</Button>}
                        </div>

                        {/* Camera Preview (Video or Image) */}
                        <div>
                            {capturedImage ? (
                                <img 
                                    src={capturedImage} 
                                    alt="Captured" 
                                    className="mb-2" 
                                    style={{ 
                                        maxWidth: "100%", 
                                        height: "auto",       
                                        maxHeight: "400px",  
                                        objectFit: "contain", 
                                        borderRadius: "8px" 
                                    }} 
                                />
                            ) : (
                                 <video ref={videoRef} autoPlay style={{         
                                    maxWidth: "100%",    
                                    maxHeight: "400px",   
                                    objectFit: "contain", 
                                    borderRadius: "8px",
                                    display: stream ? "block" : "none",
                                    }} />
                            )}
                        </div>

                        {/* Retake Button */}
                        {capturedImage && (
                            <Button variant="warning" onClick={() => setCapturedImage(null)}>Retake Photo</Button>
                        )}

                        <canvas ref={canvasRef} style={{ display: "none" }} />
                    </Form.Group>

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
                            label="I give my informed consent for the procedure to be performed on my pet, understanding and accepting the associated risks."
                            checked={!!formData.signature}
                            onChange={handleChange}
                        />
                    </Form.Group>

                    {/* Submit Button */}
                    <div className="button-container mt-3">
                        <Button variant="primary" type="submit" className='button btn-gradient'>Submit</Button>
                    </div>
                </Form>
            </Modal.Body>
        </Modal>
    );
}

export default AddSurgicalFormModal;
