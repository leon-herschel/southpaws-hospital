import React, { useState, useEffect } from 'react';
import { FaEdit, FaTrash, FaEye, FaPlus } from 'react-icons/fa';
import { AiOutlineArrowUp, AiOutlineArrowDown } from 'react-icons/ai';
import axios from "axios";
import { Pagination, Button, Modal, Tooltip, OverlayTrigger } from 'react-bootstrap';
import ViewImmunizationFormModal from '../components/View/ViewImmunizationFormModal'; // Import the View modal
import AddImmunizationFormModal from '../components/Add/AddImmunizationFormModal';
import EditImmunizationFormModal from '../components/Edit/EditImmunizationFormModal';
import AddImmunizationNotesModal from '../components/Add/AddImmunizationNotesModal'; // Import the new Add Note modal
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const ImmunizationForm = () => {
    const [forms, setForms] = useState([]);
    const [originalForms, setOriginalForms] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [formsPerPage, setFormsPerPage] = useState(5);
    const [sortBy, setSortBy] = useState({ key: '', order: '' });
    const [showAddModal, setShowAddModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [formIdToDelete, setFormIdToDelete] = useState(null);
    const [formIdToEdit, setFormIdToEdit] = useState(null);
    const [editForm, setEditForm] = useState({
        id: '',
        client_name: '',
        client_id: '',
        pet_name: '',
        patients_id: '',
        created_at: '',
        signature: 0,
    });
    const [editLoading, setEditLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState('');
    const [showViewModal, setShowViewModal] = useState(false); // State for view modal
    const [viewForm, setViewForm] = useState({}); // State to store form data for viewing
    const [owners, setOwners] = useState([]);
    const [pets, setPets] = useState([]);
    const [showAddNoteModal, setShowAddNoteModal] = useState(false);
    const [notes, setNotes] = useState([]); // Holds the list of immunization notes
    const [noteToEdit, setNoteToEdit] = useState(null); // Note to be edited or null for adding

    const userRole = parseInt(localStorage.getItem('userRole'), 10); // Retrieve user role from localStorage

    useEffect(() => {
        fetchNotes();
    }, []);

    const handleShowAddNoteModal = () => {
        if (notes.length > 0) {
            setNoteToEdit(notes[0]); // Pass the first note for editing
        } else {
            setNoteToEdit(null); // Pass null for adding a new note
        }
        setShowAddNoteModal(true);
    };

    const handleCloseAddNoteModal = () => {
        setShowAddNoteModal(false); // Close the modal
        setNoteToEdit(null); // Reset the note to edit
    };

    const fetchNotes = async () => {
        try {
            const response = await axios.get('http://localhost:80/api/immunization_notes.php');
            setNotes(response.data); // Assuming the API returns an array of notes
        } catch (error) {
            console.error('Error fetching immunization notes:', error);
        }
    };

    const handleCloseViewModal = () => setShowViewModal(false);
    const handleShowViewModal = (form) => {
        setViewForm(form); // Set the form data for viewing
        setShowViewModal(true);
    };

    const handleCloseAddModal = () => setShowAddModal(false);
    const handleShowAddModal = () => setShowAddModal(true);

    const handleCloseDeleteModal = () => setShowDeleteModal(false);
    const handleShowDeleteModal = (formId) => {
        setFormIdToDelete(formId);
        setShowDeleteModal(true);
    };

    const handleCloseEditModal = () => {
        setShowEditModal(false);
        setErrorMessage('');
        setEditLoading(true);
    };

    const handleShowEditModal = (formId) => {
        const formToEdit = forms.find(form => form.id === formId); // Find the form data by ID
    
        // Ensure patient_id is always an array of integers
        let patientIds = [];
        if (formToEdit.patient_id) {
            if (Array.isArray(formToEdit.patient_id)) {
                // If it's already an array, map to integers
                patientIds = formToEdit.patient_id.map(id => parseInt(id, 10));
            } else if (typeof formToEdit.patient_id === 'string') {
                // If it's a string (e.g., comma-separated), split and map to integers
                patientIds = formToEdit.patient_id.split(',').map(id => parseInt(id.trim(), 10));
            } else {
                // If it's a single value, convert to an array
                patientIds = [parseInt(formToEdit.patient_id, 10)];
            }
        }
    
        // Set the form data for editing
        setEditForm({
            ...formToEdit, // Include all existing data
            client_name: formToEdit.client_name || `Client ID: ${formToEdit.client_id}`, // Fallback to ID if name not available
            pet_name: formToEdit.pet_name || `Pet ID: ${formToEdit.patient_id}`, // Fallback to ID if name not available
            patient_id: patientIds, // Ensure patient_id is always an array of integers
        });
    
        setShowEditModal(true); // Show the edit modal
    };

    useEffect(() => {
        fetchOwnersAndPets();
        getForms();
    }, []);

    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short', // Abbreviated month name (e.g., 'Feb')
            day: 'numeric', // Numeric day of the month
            year: 'numeric' // Four digit year
        });
    }

    function fetchOwnersAndPets() {
        axios.get('http://localhost:80/api/clients.php')
            .then(response => {
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
            })
            .catch(error => {
                console.error('Error fetching owners and pets:', error);
            });
    }

    const getForms = () => {
        axios.get("http://localhost:80/api/immunization.php/")
            .then(response => {
                if (response.data && Array.isArray(response.data.immunizations)) {
                    // Process the forms and add additional fields
                    const processedForms = response.data.immunizations.map(form => ({
                        ...form,
                        client_name: form.client_name || `Client ID: ${form.client_id}`,
                        pet_name: form.pet_name || `Pet ID: ${form.patient_id}`,
                        signature_status: form.signature === 1 ? "Signed" : "Not Signed",
                    }));
    
                    // Sort the forms by ID in descending order (higher ID first)
                    const sortedForms = processedForms.sort((a, b) => b.id - a.id);
    
                    // Update state with the sorted forms
                    setForms(sortedForms);
                    setOriginalForms(sortedForms);
                } else {
                    console.error("Invalid API response:", response.data);
                    throw new Error("Invalid API response: Expected immunizations array");
                }
            })
            .catch(error => {
                console.error("Error fetching immunization forms:", error);
                toast.error("Failed to fetch immunization forms.");
            });
    };

    const deleteForm = (id) => {
        axios.delete(`http://localhost:80/api/immunization.php/${id}/delete`)
            .then(() => {
                toast.success("Immunization form deleted successfully!");
                getForms();
            })
            .catch(error => {
                console.error('Error deleting immunization form:', error);
            });
    };

    function handleFilter(event) {
        const searchText = event.target.value.toLowerCase();
        const filteredForms = originalForms.filter(form => {
            return (
                form.client_name.toLowerCase().includes(searchText) ||
                form.pet_name.toLowerCase().includes(searchText) ||
                form.signature_status.toLowerCase().includes(searchText) ||
                form.created_at.toLowerCase().includes(searchText)
            );
        });
        setForms(searchText ? filteredForms : originalForms);
    }

    const indexOfLastForm = currentPage * formsPerPage;
    const indexOfFirstForm = indexOfLastForm - formsPerPage;
    const currentForms = forms.slice(indexOfFirstForm, indexOfLastForm);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    const handlePerPageChange = (e) => {
        setCurrentPage(1);
        setFormsPerPage(Number(e.target.value));
    };

    const handleSort = (key) => {
        let order = 'asc';
        if (sortBy.key === key && sortBy.order === 'asc') {
            order = 'desc';
        }
        setSortBy({ key, order });
        const sortedForms = [...forms].sort((a, b) => {
            const valueA = typeof a[key] === 'string' ? a[key].toLowerCase() : a[key];
            const valueB = typeof b[key] === 'string' ? b[key].toLowerCase() : b[key];
            if (valueA < valueB) return order === 'asc' ? -1 : 1;
            if (valueA > valueB) return order === 'asc' ? 1 : -1;
            return 0;
        });
        setForms(sortedForms);
    };

    const getSortIcon = (key) => {
        if (sortBy.key === key) {
            return sortBy.order === 'asc' ? <AiOutlineArrowUp /> : <AiOutlineArrowDown />;
        }
        return null;
    };

    const handleFormAdded = () => {
        toast.success("Immunization form added successfully!");
        getForms();
    };

    const handleEditChange = (event) => {
        const { name, value } = event.target;
        setEditForm(prev => ({ ...prev, [name]: value }));
    };

    return (
        <div className='container mt-2'>
            <h1 style={{ textAlign: 'left', fontWeight: 'bold' }}>Immunization Forms</h1>
            <div className='d-flex justify-content-between align-items-center'>
                <input type="text" className="form-control w-25" onChange={handleFilter} placeholder="Search" />
                {userRole !== 1 && (
                    <>
                        <Button variant="primary" onClick={handleShowAddNoteModal}>
                            <FaPlus className="me-2" /> Add/Edit Note
                        </Button>
                        <Button onClick={handleShowAddModal} className='btn btn-primary'
                            style={{
                                backgroundImage: 'linear-gradient(to right, #006cb6, #31b44b)',
                                color: '#ffffff', // Text color
                                borderColor: '#006cb6', // Border color
                                fontWeight: 'bold'
                            }}>Add Immunization Form
                        </Button>
                    </>
                )}
            </div>
            <div className="table-responsive">
                <table className="table table-striped">
                    <thead>
                        <tr>
                            <th onClick={() => handleSort('id')}># {getSortIcon('id')}</th>
                            <th onClick={() => handleSort('client_name')}>Client Name {getSortIcon('client_name')}</th>
                            <th onClick={() => handleSort('pet_name')}>Pet Name {getSortIcon('pet_name')}</th>
                            <th onClick={() => handleSort('signature_status')}>Signature {getSortIcon('signature_status')}</th>
                            <th onClick={() => handleSort('created_at')}>Date {getSortIcon('created_at')}</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
    {currentForms.map((form, index) => {
        const globalIndex = (currentPage - 1) * formsPerPage + index + 1;

        const petNames = form.patient_id
            ? form.patient_id
                  .split(',')
                  .map((petId) => {
                      const pet = pets.find((p) => p.id.toString() === petId.trim());
                      return pet ? pet.name : null;
                  })
                  .filter((name) => name !== null) // Remove null values
                  .join(', ') // Join pet names with a comma
            : "No Pets";

        return (
            <tr key={form.id}>
                <td className="text-center">{globalIndex}</td>
                <td>{form.client_name}</td>
                <td>{petNames}</td>
                <td>{form.signature_status}</td>
                <td>{formatDate(form.created_at)}</td>
                <td>
                    {/* View Button */}
                    <Button
                        onClick={() => handleShowViewModal(form)}
                        className="btn btn-secondary me-2"
                    >
                        <FaEye />
                    </Button>

                    {userRole !== 1 && (
                        <>
                            <Button
                                onClick={() => handleShowEditModal(form.id)}
                                className="btn btn-primary me-2"
                            >
                                <FaEdit />
                            </Button>
                            <Button
                                onClick={() => handleShowDeleteModal(form.id)}
                                className="btn btn-danger"
                            >
                                <FaTrash />
                            </Button>
                        </>
                    )}
                </td>
            </tr>
        );
    })}
</tbody>
                </table>
            </div>
            <Pagination>
                {Array.from({ length: Math.ceil(forms.length / formsPerPage) }, (_, index) => (
                    <Pagination.Item key={index} active={index + 1 === currentPage} onClick={() => paginate(index + 1)}>
                        {index + 1}
                    </Pagination.Item>
                ))}
            </Pagination>
            <AddImmunizationNotesModal
                show={showAddNoteModal}
                handleClose={handleCloseAddNoteModal}
                onNoteUpdated={fetchNotes} // Refresh notes after add/edit/delete
                existingNote={noteToEdit} // Pass the note to edit or null
            />

            <AddImmunizationFormModal show={showAddModal} handleClose={handleCloseAddModal} onFormAdded={handleFormAdded} />
            <EditImmunizationFormModal
                show={showEditModal}
                handleClose={handleCloseEditModal}
                formData={editForm}
                onFormUpdated={getForms}
                editLoading={editLoading}
                handleEditChange={handleEditChange}
                errorMessage={errorMessage}
                owners={owners}
                pets={pets}
            />
            <ViewImmunizationFormModal
                show={showViewModal}
                handleClose={handleCloseViewModal}
                formData={viewForm}
            />
            <Modal show={showDeleteModal} onHide={handleCloseDeleteModal}>
                <Modal.Header closeButton>
                    <Modal.Title>Confirm Delete</Modal.Title>
                </Modal.Header>
                <Modal.Body>Are you sure you want to delete this immunization form?</Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleCloseDeleteModal}>Cancel</Button>
                    <Button variant="danger" onClick={() => {
                        deleteForm(formIdToDelete);
                        handleCloseDeleteModal();
                    }}>Delete</Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default ImmunizationForm;