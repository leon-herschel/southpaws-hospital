import React, { useState, useEffect } from 'react';
import { FaEdit, FaTrash, FaEye } from 'react-icons/fa';
import { AiOutlineArrowUp, AiOutlineArrowDown } from 'react-icons/ai';
import axios from "axios";
import { Pagination, Button, Modal, OverlayTrigger, Tooltip } from 'react-bootstrap';
import ViewSurgicalFormModal from '../components/View/ViewSurgicalFormModal'; // Import the View modal
import AddSurgicalFormModal from '../components/Add/AddSurgicalFormModal';
import EditSurgicalFormModal from '../components/Edit/EditSurgicalFormModal';
import AddSurgicalNotesModal from '../components/Add/AddSurgicalNotesModal'; // Import the new Add Note modal
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const SurgicalForm = () => {
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
        surgery_date: '',
        signature: 0,
    });
    const [editLoading, setEditLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState('');
    const [showViewModal, setShowViewModal] = useState(false); // State for view modal
    const [viewForm, setViewForm] = useState({}); // State to store form data for viewing
    const [owners, setOwners] = useState([]);
    const [pets, setPets] = useState([]);
    const [showAddNoteModal, setShowAddNoteModal] = useState(false);
    const [notes, setNotes] = useState([]); // 
    const [noteToEdit, setNoteToEdit] = useState(null); // Note to be edited or null for adding

    const userRole = parseInt(localStorage.getItem('userRole'), 10);
    const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

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

    const formatDate = (dateString) => {
        if (!dateString) return "N/A";

        const options = { year: "numeric", month: "short", day: "numeric" };
        return new Date(dateString).toLocaleDateString("en-US", options);
    };

    const fetchNotes = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/api/surgical_notes.php`);
            setNotes(response.data); // Assuming the API returns an array of notes
        } catch (error) {
            console.error('Error fetching surgical notes:', error);
        }
    };

    const handleCloseViewModal = () => setShowViewModal(false);
    const handleShowViewModal = (form) => {
        console.log("Viewing form data:", form);  // Log the form data to the console

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
        setEditForm({
            ...formToEdit, // Include all existing data
            client_name: formToEdit.client_name || `Client ID: ${formToEdit.client_id}`, // Fallback to ID if name not available
            pet_name: formToEdit.pet_name || `Pet ID: ${formToEdit.patients_id}`, // Fallback to ID if name not available
        });
        setShowEditModal(true);
    };

    useEffect(() => {
        fetchOwnersAndPets();
        getForms();
    }, []);

    function fetchOwnersAndPets() {
        axios.get(`${API_BASE_URL}/api/clients.php`)
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

    function getForms() {
        axios.get(`${API_BASE_URL}/api/surgical.php/`)
            .then(response => {
                const { data } = response.data; // Extract `data` from the response

                if (Array.isArray(data)) {
                    const processedForms = data.map(form => ({
                        ...form,
                        client_name: form.client_name || `Client ID: ${form.client_id}`,
                        pet_name: form.pet_name || `Pet ID: ${form.patient_id}`,
                        signature_status: form.signature === 1 ? "Signed" : "Not Signed",
                    }));
                    setForms(processedForms);
                    setOriginalForms(processedForms);
                } else {
                    console.error('Expected an array but got:', data);
                    setForms([]); // Reset to an empty array
                    setOriginalForms([]);
                }
            })
            .catch(error => {
                console.error('Error fetching surgical forms:', error);
                setForms([]);
                setOriginalForms([]);
            });
    }

    const deleteForm = (id) => {
        axios.delete(`${API_BASE_URL}/api/surgical.php/${id}/delete`)
            .then(() => {
                toast.success("Surgical form deleted successfully!");
                getForms();
            })
            .catch(error => {
                console.error('Error deleting surgical form:', error);
            });
    };

    function handleFilter(event) {
        const searchText = event.target.value.toLowerCase();
        const filteredForms = originalForms.filter(form => {
            return (
                form.client_name.toLowerCase().includes(searchText) ||
                form.pet_name.toLowerCase().includes(searchText) ||
                form.signature_status.toLowerCase().includes(searchText) ||
                form.surgery_date.toLowerCase().includes(searchText)
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
        toast.success("Surgical form added successfully!");
        getForms();
    };

    const handleEditChange = (event) => {
        const { name, value } = event.target;
        setEditForm(prev => ({ ...prev, [name]: value }));
    };

    const handleEditSubmit = (event) => {
        event.preventDefault();
        setErrorMessage('');
        axios.put(`${API_BASE_URL}/api/surgical.php/${formIdToEdit}`, editForm)
            .then(() => {
                toast.success("Surgical form updated successfully!");
                handleCloseEditModal();
                getForms();
            })
            .catch(error => {
                console.error('Error updating surgical form:', error);
                setErrorMessage('Failed to update surgical form. Please try again.');
            });
    };

    const IconButtonWithTooltip = ({ tooltip, children, ...props }) => (
            <OverlayTrigger placement="top" overlay={<Tooltip>{tooltip}</Tooltip>}>
                <Button {...props}>{children}</Button>
            </OverlayTrigger>
    );

    return (
        <div className='container mt-2'>
            <h1 style={{ textAlign: 'left', fontWeight: 'bold' }}>Surgical Forms</h1>
            <div className='d-flex justify-content-between align-items-center'>
                <input type="text" className="form-control w-25 shadow-sm" onChange={handleFilter} placeholder="Search" />
                {userRole !== 1 && (
                    <div className="d-flex gap-2">
                        <Button variant="primary" onClick={handleShowAddNoteModal} className="btn-gradient"
                        style={{
                                background: '#006cb6',
                                color: '#ffffff',
                                borderColor: '#006cb6',
                                fontWeight: 'bold',
                                marginBottom: '-10px'
                            }}>
                            Add/Edit CMS
                        </Button>
                        <Button onClick={handleShowAddModal} className='btn btn-primary btn-gradient' style={{marginBottom: '-10px'}}>Add Surgical Form</Button>
                    </div>
                )}
            </div>
            <div className="table-responsive">
                <table className="table table-striped text-center align-middle shadow-sm">
                    <thead className="table-light">
                        <tr>
                            <th onClick={() => handleSort('id')}># {getSortIcon('id')}</th>
                            <th onClick={() => handleSort('client_name')}>Client Name {getSortIcon('client_name')}</th>
                            <th onClick={() => handleSort('pet_name')}>Pet Name {getSortIcon('pet_name')}</th>
                            <th onClick={() => handleSort('signature_status')}>Signature {getSortIcon('signature_status')}</th>
                            <th onClick={() => handleSort('surgery_date')}>Surgery Date {getSortIcon('surgery_date')}</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentForms.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="text-center text-muted">
                                    No forms available.
                                </td>
                            </tr>
                        ) : (
                            currentForms.map((form, index) => (
                                <tr key={index}>
                                    <td>{(currentPage - 1) * formsPerPage + index + 1}</td>
                                    <td>{form.client_name}</td>
                                    <td>
                                        {form.patient_id
                                            ? form.patient_id.split(',').map((petId, idx) => {
                                                const pet = pets.find(p => p.id.toString() === petId.trim());
                                                return pet ? (
                                                    <span key={idx}>
                                                        {pet.name}
                                                        {idx < form.patient_id.split(',').length - 1 && ', '}
                                                    </span>
                                                ) : null;
                                            })
                                            : "No Pets"}
                                    </td>
                                    <td>{form.signature_status}</td>
                                    <td>{formatDate(form.surgery_date)}</td>
                                    <td>
                                        <IconButtonWithTooltip
                                            tooltip="View"
                                            onClick={() => handleShowViewModal(form)}
                                            className="btn btn-success me-2"
                                        >
                                            <FaEye />
                                        </IconButtonWithTooltip>

                                        {userRole !== 1 && (
                                            <>
                                                <IconButtonWithTooltip
                                                    tooltip="Edit"
                                                    onClick={() => handleShowEditModal(form.id)}
                                                    className="btn btn-primary me-2"
                                                >
                                                    <FaEdit />
                                                </IconButtonWithTooltip>
                                                <IconButtonWithTooltip
                                                    tooltip="Delete"
                                                    onClick={() => handleShowDeleteModal(form.id)}
                                                    className="btn btn-danger"
                                                >
                                                    <FaTrash />
                                                </IconButtonWithTooltip>
                                            </>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
            <div className="d-flex justify-content-between align-items-center">
                {/* Items per page selector (left) */}
                <div className="d-flex align-items-center">
                    <label htmlFor="itemsPerPage" className="form-label me-2 fw-bold">Items per page:</label>
                    <select 
                    style={{ width: '80px' }} 
                    id="itemsPerPage" 
                    className="form-select form-select-sm shadow-sm" 
                    value={formsPerPage} 
                    onChange={handlePerPageChange}
                    >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                    </select>
                </div>

                {/* Pagination (right) */}
                <Pagination className="mb-0">
                    {/* Prev button */}
                    <Pagination.Prev
                    onClick={() => currentPage > 1 && paginate(currentPage - 1)}
                    disabled={currentPage === 1}
                    />

                    {Array.from({ length: Math.ceil(forms.length / formsPerPage) }, (_, index) => index + 1)
                    .filter(page =>
                        page === 1 ||
                        page === Math.ceil(forms.length / formsPerPage) ||
                        (page >= currentPage - 2 && page <= currentPage + 2) // show range around current page
                    )
                    .map((page, i, arr) => (
                        <React.Fragment key={page}>
                        {/* Add ellipsis when gap */}
                        {i > 0 && arr[i] !== arr[i - 1] + 1 && <Pagination.Ellipsis disabled />}
                        <Pagination.Item
                            active={page === currentPage}
                            onClick={() => paginate(page)}
                        >
                            {page}
                        </Pagination.Item>
                        </React.Fragment>
                    ))}

                    {/* Next button */}
                    <Pagination.Next
                    onClick={() =>
                        currentPage < Math.ceil(forms.length / formsPerPage) &&
                        paginate(currentPage + 1)
                    }
                    disabled={currentPage === Math.ceil(forms.length / formsPerPage)}
                    />
                </Pagination>
            </div>
            <AddSurgicalNotesModal
                show={showAddNoteModal}
                handleClose={handleCloseAddNoteModal}
                onNoteUpdated={fetchNotes} // Refresh notes after add/edit/delete
                existingNote={noteToEdit} // Pass the note to edit or null
            />
            <AddSurgicalFormModal show={showAddModal} handleClose={handleCloseAddModal} onFormAdded={handleFormAdded} />
            <EditSurgicalFormModal
                show={showEditModal}
                handleClose={handleCloseEditModal}
                onFormUpdated={getForms}  // Assuming `getForms` is the method to refresh the list
                formData={editForm}  // Ensure `editForm` is the current form data to be edited
            />

            <ViewSurgicalFormModal
                show={showViewModal}
                handleClose={handleCloseViewModal}
                formData={viewForm}
            />
            <Modal show={showDeleteModal} onHide={handleCloseDeleteModal}>
                <Modal.Header closeButton>
                    <Modal.Title>Confirm Delete</Modal.Title>
                </Modal.Header>
                <Modal.Body>Are you sure you want to delete this surgical form?</Modal.Body>
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

export default SurgicalForm;