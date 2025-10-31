import React, { useState, useEffect } from 'react';
import { Modal, Button, ListGroup, Row, Col } from 'react-bootstrap';
import { FaList, FaEdit, FaTrash } from 'react-icons/fa'; // Import icons
import axios from 'axios'; // Import axios for API calls
import AddPatientsModal from '../Add/AddPatientsModal'; // Import the AddPatientsModal component
import ViewPetModal from './ViewPetModal'; // Import the ViewPetModal component
import EditPetModal from '../Edit/EditPetModal'; // Import the EditPetModal component
import { toast } from 'react-toastify'; // Import Toastify

const ViewClientModal = ({ show, handleClose, client = {} }) => {
    const [showAddModal, setShowAddModal] = useState(false);
    const [showPetDetailsModal, setShowPetDetailsModal] = useState(false);
    const [showEditPetModal, setShowEditPetModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedPet, setSelectedPet] = useState(null);
    const [petList, setPetList] = useState([]);
    const [petIdToDelete, setPetIdToDelete] = useState(null);
    const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

    useEffect(() => {
        if (client?.id && show) {
            fetchPets();
        }
    }, [client, show]);

    const fetchPets = () => {
        if (client?.id) {
            axios.get(`${API_BASE_URL}/api/clients.php/${client.id}`)
                .then(response => {
                    const petsData = response.data.clients[0]?.pets;
                    if (petsData) {
                        setPetList(petsData);
                    } else {
                        setPetList([]);
                    }
                })
                .catch(error => {
                    console.error('API fetch error:', error);
                });
        }
    };

    const handleAddModalClose = () => {
        setShowAddModal(false);
        fetchPets(); // Refresh pet data after adding a pet
    };

    const handleAddModalOpen = () => setShowAddModal(true);

    const handlePetDetailsModalClose = () => setShowPetDetailsModal(false);

    const handlePetDetailsModalOpen = (pet) => {
        setSelectedPet(pet);
        setShowPetDetailsModal(true);
    };
    

    const handleEditPetModalClose = () => {
        setShowEditPetModal(false);
        fetchPets(); // Refresh pet data after editing a pet
    };

    const handleEditPetModalOpen = (pet) => {
        setSelectedPet(pet);
        setShowEditPetModal(true);
    };

    const handleDeleteModalOpen = (petId) => {
        setPetIdToDelete(petId);
        setShowDeleteModal(true);
    };

    const handleDeleteModalClose = () => setShowDeleteModal(false);

    const deletePet = (petId) => {
        axios.delete(`${API_BASE_URL}/api/patients.php/${petId}/delete`)
            .then(response => {
                fetchPets(); // Refresh pet data after deletion
                handleDeleteModalClose(); // Close the modal after deletion
                toast.success("Pet Deleted Successfully");
            })
            .catch(error => {
                console.error('Error deleting pet:', error);
            });
    };

    const handleEditChange = (e) => {
        const { name, value } = e.target;
        setSelectedPet({ ...selectedPet, [name]: value });
    };

    const handleEditSubmit = (updatedPet) => {
        axios.put(`${API_BASE_URL}/api/patients.php/${updatedPet.pet_id}/update`, updatedPet)
            .then(response => {
                fetchPets(); // Refresh pet data after submitting the update
                toast.success("Pet Updated Successfully");
            })
            .catch(error => {
                console.error('Error updating pet:', error.response.data);
            });
    };

    return (
        <>
            <Modal show={show} onHide={handleClose} centered size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>Client Details</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Row>
                        <Col md={6}>
                            <p><strong>Name:</strong> {client?.name || 'N/A'}</p>
                            <p><strong>Address:</strong> {client?.address || 'N/A'}</p>
                        </Col>
                        <Col md={6}>
                            <p><strong>Gender:</strong> {client?.gender || 'N/A'}</p>
                            <p><strong>Email:</strong> {client?.email || 'N/A'}</p>

                        </Col>
                    </Row>
                    <Row>
                        <Col md={6}>
                            <p><strong>Cell Number:</strong> {client?.cellnumber || 'N/A'}</p>
                        </Col>

                    </Row>
                    <hr />
                    <p><strong>Pets:</strong></p>
                    {petList.length > 0 ? (
                        <ListGroup>
                            {petList.map((pet, index) => (
                                <div key={index} className="d-flex justify-content-between align-items-center mb-2">
                                    <span>{pet.pet_name}</span> {/* Use pet_name instead of name */}
                                    <div className="d-flex justify-content-center align-items-center">
                                        <Button
                                            onClick={() => handlePetDetailsModalOpen(pet)}
                                            className="btn btn-success me-2 col-4"
                                            style={{ fontSize: ".9rem" }}
                                        >
                                            <FaList />
                                        </Button>
                                        <Button
                                            onClick={() => handleEditPetModalOpen(pet)}
                                            className="btn btn-primary me-2 col-4"
                                            style={{ fontSize: ".9rem" }}
                                        >
                                            <FaEdit />
                                        </Button>
                                        <Button
                                            onClick={() => handleDeleteModalOpen(pet.pet_id)} // Use pet_id for deletion
                                            className="btn btn-danger col-4"
                                            style={{ fontSize: ".9rem" }}
                                        >
                                            <FaTrash />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </ListGroup>
                    ) : (
                        <p>No pets available</p>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleClose}>
                        Close
                    </Button>
                    <Button variant="primary" onClick={handleAddModalOpen}>
                        Add Pet
                    </Button>
                </Modal.Footer>
            </Modal>

            <AddPatientsModal
                show={showAddModal}
                handleClose={handleAddModalClose}
                client={client} // Pass client details directly to AddPatientsModal
            />

            <ViewPetModal
                show={showPetDetailsModal}
                handleClose={handlePetDetailsModalClose}
                pet={selectedPet} // Pass the selected pet to the ViewPetModal
            />

            <EditPetModal
                show={showEditPetModal}
                handleClose={handleEditPetModalClose}
                editPatient={selectedPet} // Pass the selected pet for editing
                handleEditChange={handleEditChange} // Handle input changes
                handleEditSubmit={handleEditSubmit} // Handle form submission
            />

            <Modal show={showDeleteModal} onHide={handleDeleteModalClose} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Confirm Delete</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    Are you sure you want to delete this pet?
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleDeleteModalClose}>
                        Cancel
                    </Button>
                    <Button variant="danger" onClick={() => deletePet(petIdToDelete)}>
                        Delete
                    </Button>
                </Modal.Footer>
            </Modal>

        </>
    );
};

export default ViewClientModal;
