import React, { useState, useEffect, useRef } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import axios from 'axios';
import { toast } from 'react-toastify';

function AddImmunizationFormModal({ show, handleClose, onFormAdded, selectedClient, selectedPetsData }) {
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0], // Local date in yyyy-mm-dd format
        owner: '',
        pet: [],
        signature: 0, // Default signature value
        created_by: null, // Will be dynamically set
    });

    const [owners, setOwners] = useState([]);
    const [pets, setPets] = useState([]);
    const [notes, setNotes] = useState([]); // State to hold immunization notes
    const [immunizations, setImmunizations] = useState([]); // State for existing immunizations
    const [errorMessage, setErrorMessage] = useState('');
    const [petImage, setPetImage] = useState(null);
    const [selectedPets, setSelectedPets] = useState([]); // Track selected pets
    const today = new Date().toISOString().split('T')[0];

    // Camera States
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [stream, setStream] = useState(null);
    const [capturedImage, setCapturedImage] = useState(null);


    const resetForm = () => {
        setFormData({
            date: new Date().toISOString().split('T')[0],
            owner: '',
            pet: [],
            signature: 0,
            created_by: null,
        });
        setPetImage(null);
        setCapturedImage(null);
        setErrorMessage('');
    }; 

    useEffect(() => {
        if (show) {
            fetchOwnersAndPets();
            fetchImmunizationNotes();
            fetchImmunizations(); // Fetch immunization data
            
            console.log('Selected Pets Data in modal:', selectedPetsData); // Log here
    
            // Ensure `selectedPetsData` is an array before calling `.map()`
            const petsData = Array.isArray(selectedPetsData) && selectedPetsData.length > 0 ? selectedPetsData : [];
    
            setFormData((prev) => ({
                ...prev,
                created_by: localStorage.getItem('userID') || 1,
                owner: selectedClient || '',
                pet: petsData.map(pet => pet.pet_id), // Pre-fill selected pets
            }));
        }
    }, [show, selectedClient, selectedPetsData]);  // Ensure selectedPetsData is included in the dependency list
    
    
    
    const fetchImmunizations = async () => {
        try {
            const response = await axios.get('http://localhost:80/api/immunization.php');
    
            if (response.data && Array.isArray(response.data.immunizations)) {
                const formattedData = response.data.immunizations.map(immunization => ({
                    ...immunization,
                    created_at: new Date(immunization.created_at).toISOString().split('T')[0] // Format consistency
                }));
                setImmunizations(formattedData);
            } else {
                console.error('Unexpected API response: Immunizations data missing or incorrect format', response.data);
                setImmunizations([]); // Fallback to an empty array to prevent `.map()` error
            }
        } catch (error) {
            console.error('Failed to fetch immunizations:', error);
            setImmunizations([]); // Ensure the state is at least an empty array
        }
    };
    
    
    

    const fetchOwnersAndPets = async () => {
        try {
            const response = await axios.get('http://localhost:80/api/clients.php');
            const { clients } = response.data;
            setOwners(clients);

            const allPets = clients.flatMap((client) =>
                    client.pets.map((pet) => ({
                    id: pet.pet_id,
                    name: pet.pet_name,
                    ownerId: client.id,
                }))
            );
            setPets(allPets);
        } catch (error) {
            console.error('Failed to fetch owners and pets:', error);
        }
    };

    const fetchImmunizationNotes = async () => {
        try {
            const response = await axios.get('http://localhost:80/api/immunization_notes.php');
            setNotes(response.data); // Assuming the API returns an array of notes
        } catch (error) {
            console.error('Failed to fetch immunization notes:', error);
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        const newValue = type === 'checkbox' ? (checked ? 1 : 0) : value;
        setFormData((prev) => ({
            ...prev,
            [name]: newValue,
        }));
    };

    const handlePetSelectionChange = (petId) => {
        setFormData((prevData) => {
            const newPets = prevData.pet.includes(petId)
                ? prevData.pet.filter(id => id !== petId)
                : [...prevData.pet, petId];
            return {
                ...prevData,
                pet: newPets,
            };
        });
    };

    
    
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.owner || !formData.pet.length || formData.signature === 0) {
            toast.error('Please make sure all fields are filled and consent is given.');
            return;
        }

        const payload = new FormData();
        payload.append('client_id', formData.owner);
        payload.append('patient_id', formData.pet);
        payload.append('signature', formData.signature);
        payload.append('created_by', formData.created_by);
        payload.append('created_at', formData.date);
        if (petImage) payload.append('pet_image', petImage);

        try {
            const response = await axios.post('http://localhost:80/api/immunization.php', payload, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            if (response.data.status === 1) {
                if (onFormAdded) onFormAdded();
                handleClose();
                resetForm();
            } else {
                setErrorMessage(response.data.message || 'Failed to submit form');
            }
        } catch (error) {
            console.error('Failed to submit form:', error);
        }
    };

    const handleModalClose = () => {
        resetForm(); // Reset form when closing the modal
        setErrorMessage(''); // Clear the error message
        setPetImage(null);
        setCapturedImage(null);
        setStream(null);
        handleClose(); // Assuming handleClose is passed as a prop or defined elsewhere
    };
    

    // Camera Functions
    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
            videoRef.current.srcObject = stream;
            setStream(stream);
        } catch (error) {
            console.error("Error accessing the camera: ", error);
        }
    };
    const captureImage = () => {
        const canvas = canvasRef.current;
        const video = videoRef.current;
        const context = canvas.getContext("2d");
    
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
        canvas.toBlob((blob) => {
            const file = new File([blob], "captured_image.jpg", { type: "image/jpeg" });
            setPetImage(file);
            setCapturedImage(URL.createObjectURL(blob));
        }, "image/jpeg");
    
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
    };
    
    

    return (
        <Modal show={show} onHide={handleModalClose} size="lg" centered>
            <Modal.Header closeButton>
                <Modal.Title>Immunization Information and Consent</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                
                <Form onSubmit={handleSubmit}>
                    <Form.Group className="mb-3">
                        <Form.Label style={{ margin: 0 }}>Date:</Form.Label>
                        <Form.Control
                            type="date"
                            name="date"
                            value={formData.date}
                            onChange={handleChange}
                            min={today}
                        />
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label style={{ margin: 0 }}>Owner:</Form.Label>
                        <Form.Select
                            name="owner"
                            value={formData.owner}
                            onChange={handleChange}
                            required
                            disabled={!!selectedClient} // Disable the dropdown if selectedClient exists
                        >
                            <option value="">Select Owner</option>
                            {owners.map((owner) => (
                                <option key={owner.id} value={owner.id}>
                                    {owner.name}
                                </option>
                            ))}
                        </Form.Select>
                    </Form.Group>

                    <Form.Group className="mb-3">
    <Form.Label style={{ margin: 0 }}>Pet's Name:</Form.Label>
    <div>
        {selectedPetsData && selectedPetsData.length > 0 ? (
            // Display pre-selected pets if `selectedPetsData` is provided
            selectedPetsData.map((pet, index) => (
                <div key={pet.pet_id || index}>
                    <strong>{pet.pet_name}</strong>
                </div>
            ))
        ) : (
            // Render checkboxes for all pets if no pre-selected pets
            pets
                .filter((pet) => parseInt(pet.ownerId) === parseInt(formData.owner))
                .map((pet, index) => (
                    <Form.Check
                        key={pet.id || index}
                        type="checkbox"
                        label={pet.name}
                        name="pet"
                        value={pet.id}
                        checked={formData.pet.includes(pet.id)}
                        onChange={() => handlePetSelectionChange(pet.id)}
                    />
                ))
        )}
    </div>
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
                                    
                                }}  />
                            )}
                        </div>

                        {/* Retake Button */}
                        {capturedImage && (
                            <Button variant="warning" onClick={() => setCapturedImage(null)}>Retake Photo</Button>
                        )}

                        <canvas ref={canvasRef} style={{ display: "none" }} />
                    </Form.Group>

                    {notes.map((note, index) => (
                        <div key={index} className="border p-3 mb-3 bg-light">
                            <h5 className="text-center">{note.title}</h5>
                            <p>{note.content}</p>
                        </div>
                    ))}

<Form.Group className="form-check mb-3">
    <Form.Check
        type="checkbox"
        name="signature"
        id="signatureCheck"
        label="I have read and fully understand the above information. I understand the risks and give my consent for having my pet vaccinated."
        checked={!!formData.signature}
        onChange={handleChange}
        required
    />
</Form.Group>
        {errorMessage && <div style={{ color: 'red' }}>{errorMessage}</div>}  

                    <div className="button-container mt-3">
                        <Button variant="primary" type="submit" className='button btn-gradient'>
                            Submit
                        </Button>
                    </div>
                </Form>
            </Modal.Body>
        </Modal>
    );
}

export default AddImmunizationFormModal;
