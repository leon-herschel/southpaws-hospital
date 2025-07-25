import React, { useState, useEffect } from 'react';
import { Modal, Button, Table } from 'react-bootstrap';
import axios from 'axios';

function ViewImmunizationFormModal({ show, handleClose, formData }) {
    const [notes, setNotes] = useState([]); // Holds immunization notes
    const [petDetails, setPetDetails] = useState([]); // Store multiple pet details

    useEffect(() => {
        if (show && formData) {
            fetchImmunizationNotes();
            processPetData();
        }
    }, [show, formData]);

    // Fetch immunization notes from API
    const fetchImmunizationNotes = async () => {
        try {
            const response = await axios.get('http://localhost:80/api/immunization_notes.php');
            setNotes(response.data); // Assuming API returns an array of notes
        } catch (error) {
            console.error('Failed to fetch immunization notes:', error);
        }
    };

    // Fetch pet details from API
    const processPetData = async () => {
        const petIds = formData.patient_id ? formData.patient_id.split(',') : [];

        if (petIds.length === 1) {
            setPetDetails([{ 
                name: formData.pet_name, 
                age: formData.age, 
                image: formData.pet_image 
            }]);
        } else {
            try {
                const response = await axios.get(`http://localhost:80/api/patients.php?ids=${petIds.join(',')}`);

                if (response.data && Array.isArray(response.data.patients)) {
                    // ✅ Ensure we get only the pets that belong to the selected client
                    const filteredPets = response.data.patients.filter(pet => pet.owner_id === formData.client_id);

                    // ✅ Store all pet details correctly
                    setPetDetails(filteredPets.map(pet => ({
                        name: pet.name || "Unknown Pet",
                        age: pet.age || "Unknown Age",
                        image: pet.image || null,
                    })));
                } else {
                    console.error("Unexpected API response format:", response.data);
                    setPetDetails([]);
                }
            } catch (error) {
                console.error('Failed to fetch pet details:', error);
                setPetDetails([]);
            }
        }
    };

    // Format date function
    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        const options = { year: "numeric", month: "short", day: "numeric" };
        return new Date(dateString).toLocaleDateString("en-US", options);
    };

    return (
        <Modal show={show} onHide={handleClose} size="xl" centered>
            <Modal.Header closeButton>
                <Modal.Title>View Immunization Consent Form</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {formData ? (
                    <div>
                        <h5 className="text-center mb-4">Veterinary Immunization Consent Form</h5>
                        <h6>Client Image:</h6>
                        {formData.pet_image ? (
                            <img 
                                src={formData.pet_image} 
                                alt="Pet" 
                                style={{ maxWidth: '300px', height: 'auto', display: 'block' }} 
                            />
                        ) : (
                            <p>No image available</p>
                        )}
                        {/* Owner Information */}
                        <Table bordered>
                            <tbody>
                                <tr>
                                    <th>Owner's Name</th>
                                    <td>{formData.client_name || 'N/A'}</td>
                                </tr>
                                <tr>
                                    <th>Owner's Address</th>
                                    <td>{formData.address || 'N/A'}</td>
                                </tr>
                                <tr>
                                    <th>Owner's Contact</th>
                                    <td>{formData.cellnumber || 'N/A'}</td>
                                </tr>
                            </tbody>
                        </Table>

                        {/* Multiple Pets Details */}
                        {petDetails.length > 0 ? (
                            <div className="mt-4">
                                <h5 className="text-center">Pet Information</h5>
                                <Table bordered>
                                    <thead>
                                        <tr>
                                            <th>#</th>
                                            <th>Pet's Name</th>
                                            <th>Pet's Age</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {petDetails.map((pet, index) => (
                                            <tr key={index}>
                                                <td>{index + 1}</td>
                                                <td>{pet.name || 'N/A'}</td>
                                                <td>{pet.age || 'N/A'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            </div>
                        ) : (
                            <Table bordered className="mt-4">
                                <tbody>
                                    <tr>
                                        <th>Pet's Name</th>
                                        <td>{formData.pet_name || 'N/A'}</td>
                                    </tr>
                                    <tr>
                                        <th>Pet's Age</th>
                                        <td>{formData.age || 'N/A'}</td>
                                    </tr>
                                </tbody>
                            </Table>
                        )}

                        {/* Immunization Details */}
                        <Table bordered className="mt-4">
                            <tbody>
                                <tr>
                                    <th>Date Signed</th>
                                    <td>{formatDate(formData.created_at)}</td>
                                </tr>
                                <tr>
                                    <th>Signature Status</th>
                                    <td>{formData.signature ? 'Signed' : 'Not Signed'}</td>
                                </tr>
                            </tbody>
                        </Table>

                        {/* Notes Section */}
                        {notes.length > 0 && (
                            <div className="mt-4">
                                <h5 className="text-center">Additional Notes</h5>
                                {notes.map((note, index) => (
                                    <div key={index} className="border p-3 mb-3 bg-light">
                                        <h6 className="text-center">{note.title}</h6>
                                        <p>{note.content}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    <p className="text-center">No data available to display.</p>
                )}
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={handleClose}>Close</Button>
            </Modal.Footer>
        </Modal>
    );
}

export default ViewImmunizationFormModal;