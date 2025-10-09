import React, { useState, useEffect } from 'react';
import { Modal, Button, Table } from 'react-bootstrap';
import axios from 'axios';

function ViewSurgicalFormModal({ show, handleClose, formData }) {
    const [notes, setNotes] = useState([]); // Holds surgical notes
    const [petDetails, setPetDetails] = useState([]); // Store multiple pet details

    useEffect(() => {
        if (show && formData) {
            fetchSurgicalNotes();
            processPetData();
        }
    }, [show, formData]);

    // Fetch surgical notes from API
    const fetchSurgicalNotes = async () => {
        try {
            const response = await axios.get('http://localhost:80/api/surgical_notes.php');
            setNotes(response.data); // Assuming API returns an array of notes
        } catch (error) {
            console.error('Failed to fetch surgical notes:', error);
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
        <Modal show={show} onHide={handleClose} size="lg" centered>
            <Modal.Header closeButton>
                <Modal.Title>View Surgical Consent Form</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {formData ? (
                    <div>
                        <h5 className="text-center mb-4">Veterinary Surgical Consent Form</h5>

                        {/* Client Info */}
                        <div className="mb-4 p-3 border rounded bg-light">
                            <h6 className="mb-3">Client Information</h6>
                            <div className="row">
                                <div className="col-md-3 text-center">
                                    {formData.pet_image ? (
                                        <img
                                            src={formData.pet_image}
                                            alt="Client"
                                            className="img-fluid rounded mb-2"
                                            style={{ maxHeight: "150px", objectFit: "cover" }}
                                        />
                                    ) : (
                                        <div className="text-muted">No Image Available</div>
                                    )}
                                </div>
                                <div className="col-md-9">
                                    <p><strong>Name:</strong> {formData.client_name || 'N/A'}</p>
                                    <p><strong>Address:</strong> {formData.address || 'N/A'}</p>
                                    <p><strong>Contact:</strong> {formData.cellnumber || 'N/A'}</p>
                                </div>
                            </div>
                        </div>

                        {/* Pet Info */}
                        <div className="mb-4 p-3 border rounded bg-light">
                            <h6 className="mb-3">Pet Information</h6>
                            {petDetails.length > 0 ? (
                                <Table size="sm" className="table table-hover custom-table align-middle">
                                    <thead className="table-light">
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
                            ) : (
                                <p>
                                    <strong>Name:</strong> {formData.pet_name || 'N/A'} <br />
                                    <strong>Age:</strong> {formData.age || 'N/A'}
                                </p>
                            )}
                        </div>

                        {/* Surgery Details */}
                        <div className="mb-4 p-3 border rounded bg-light">
                            <h6 className="mb-3">Surgery Details</h6>
                            <p><strong>Surgery Date:</strong> {formatDate(formData.surgery_date)}</p>
                            <p><strong>Procedure:</strong> {formData.procedure_name || 'N/A'}</p>
                            <p>
                                <strong>Signature Status:</strong>{" "}
                                <span className={formData.signature ? "text-success" : "text-danger"}>
                                    {formData.signature ? "Signed" : "Not Signed"}
                                </span>
                            </p>
                            <p><strong>Date Signed:</strong> {formatDate(formData.date_signed)}</p>
                        </div>

                        {/* Notes Section */}
                        {notes.length > 0 && (
                            <div className="mb-4">
                                <h6 className="mb-3 text-center">Additional Notes</h6>
                                {notes.map((note, index) => (
                                    <div key={index} className="border p-3 mb-3 bg-white rounded shadow-sm">
                                        <h6 className="text-center">{note.title}</h6>
                                        <p className="mb-0">{note.content}</p>
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

export default ViewSurgicalFormModal;
