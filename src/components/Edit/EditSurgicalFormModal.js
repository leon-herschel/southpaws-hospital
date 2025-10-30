import React, { useState, useEffect } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import axios from 'axios';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';


function EditSurgicalFormModal({ show, handleClose, onFormUpdated, formData }) {
    const [formState, setFormState] = useState({
        surgery_date: '',
        owner: '',
        pet: '',
        surgical_procedure: '',
        signature: 0, // Default signature value
        date_signed: '', // Date signed
    });

    const [surgicalServices, setSurgicalServices] = useState([]);

    const [owners, setOwners] = useState([]);
    const [pets, setPets] = useState([]);
    const today = new Date().toISOString().split('T')[0]; // Today's date in YYYY-MM-DD format
    const [notes, setNotes] = useState([]); // State to hold immunization notes
    const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

    useEffect(() => {
        if (show) {
            fetchImmunizationNotes();
        }
    }, [show]);

    useEffect(() => {
        const fetchSurgicalServices = async () => {
            try {
                const response = await axios.get(`${API_BASE_URL}/api/services.php`);
    
                if (Array.isArray(response.data)) {
                    setSurgicalServices(response.data);
                } else if (response.data && Array.isArray(response.data.services)) {
                    setSurgicalServices(response.data.services);
                } else {
                    setSurgicalServices([]);
                    console.error('Unexpected API response format:', response.data);
                }
            } catch (error) {
                console.error('Failed to fetch surgical services:', error);
            }
        };
    
        fetchSurgicalServices();
    }, []);
    

const fetchImmunizationNotes = async () => {
    try {
        const response = await axios.get(`${API_BASE_URL}/api/surgical_notes.php`);
        setNotes(response.data); // Assuming the API returns an array of notes
    } catch (error) {
        console.error('Failed to fetch immunization notes:', error);
    }
};

useEffect(() => {
    if (show && formData) {
        setFormState({
            surgery_date: formData.surgery_date || '',
            owner: formData.client_id || '',
            pet: formData.patient_id ? formData.patient_id.split(',').map(id => id.trim()) : [], // ✅ Convert CSV string to array
            surgical_procedure: formData.surgical_procedure || '',
            signature: formData.signature || 0,
            date_signed: formData.date_signed || new Date().toISOString().split('T')[0],
        });

        fetchOwnersAndPets();
    }
}, [show, formData]);


    const fetchOwnersAndPets = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/api/clients.php`);
            const { clients } = response.data;
            setOwners(clients);

            const allPets = clients.flatMap(client =>
                client.pets.map(pet => ({
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

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormState(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? (checked ? 1 : 0) : value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
    
        const payload = {
            id: formData.id,
            client_id: formState.owner,
            patient_id: formState.pet.join(','),  // ✅ Convert array to string
            surgery_date: formState.surgery_date,
            surgical_procedure: formState.surgical_procedure,
            signature: formState.signature,
            date_signed: formState.date_signed,
        };
    
        try {
            const response = await axios.put(`${API_BASE_URL}/api/surgical.php`, payload);
            if (response.data.status === 'success') {
                toast.success('Form updated successfully!');  // ✅ Success toast
    
                if (onFormUpdated) onFormUpdated();
                handleClose();
            } else {
                alert(response.data.message || 'Failed to update form');
            }
        } catch (error) {
            console.error('Failed to update form:', error);
        }
    };
    

    return (
        <Modal show={show} onHide={handleClose} size="lg" centered>
            <Modal.Header closeButton>
                <Modal.Title>Edit Veterinary Surgical Consent Form</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form onSubmit={handleSubmit}>
                    {/* Owner's Name */}
                    <Form.Group className="mb-3">
                        <Form.Label style={{ margin: 0 }}>Owner's Name:</Form.Label>
                        <Form.Select
                            name="owner"
                            value={formState.owner}
                            autoFocus // Simple auto-focus without ref
                            onChange={handleChange}
                            required
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
        {pets
            .filter(pet => pet.ownerId === parseInt(formState.owner))
            .map(pet => (
                <Form.Check
                    key={pet.id}
                    type="checkbox"
                    label={pet.name}
                    name="pet"
                    value={pet.id}
                    checked={formState.pet.includes(pet.id.toString())}  // ✅ Convert pet ID to string for comparison
                    onChange={(e) => {
                        const petId = e.target.value;
                        setFormState(prev => ({
                            ...prev,
                            pet: prev.pet.includes(petId)
                                ? prev.pet.filter(id => id !== petId) // ✅ Remove pet if unchecked
                                : [...prev.pet, petId], // ✅ Add pet if checked
                        }));
                    }}
                />
            ))}
    </div>
</Form.Group>



                    {/* Surgery Date */}
                    <Form.Group className="mb-3">
                        <Form.Label style={{ margin: 0 }}>Surgery Date:</Form.Label>
                        <Form.Control
                            type="date"
                            name="surgery_date"
                            value={formState.surgery_date}
                            onChange={handleChange}
                            min={today}
                            required
                        />
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label style={{ margin: 0 }}>Surgical Procedure:</Form.Label>
                        <Form.Select
                            name="surgical_procedure"
                            value={formState.surgical_procedure}
                            onChange={handleChange}
                            required
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
                            checked={!!formState.signature}
                            onChange={handleChange}
                        />
                    </Form.Group>

                    {/* Submit Button */}
                    <div className="button-container mt-3">
                        <Button variant="primary" type="submit" className='button btn-gradient'>Update</Button>
                    </div>
                </Form>
            </Modal.Body>
        </Modal>
    );
}

export default EditSurgicalFormModal;
