import React, { useEffect, useState } from 'react';
import { FaEdit, FaTrash } from 'react-icons/fa';
import { AiOutlineArrowUp, AiOutlineArrowDown } from 'react-icons/ai';
import axios from "axios";
import { Pagination, Button, Modal, Tooltip, OverlayTrigger } from 'react-bootstrap';
import { ToastContainer, toast } from 'react-toastify'; 
import 'react-toastify/dist/ReactToastify.css';
import '../assets/table.css'; 
import AddGenericModal from '../components/Add/AddGenericModal';
import EditGenericModal from '../components/Edit/EditGenericModal';

const Generic = () => {
    const [generics, setGenerics] = useState([]);
    const [originalGenerics, setOriginalGenerics] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [genericsPerPage, setGenericsPerPage] = useState(5); 
    const [sortBy, setSortBy] = useState({ key: 'id', order: 'asc' });
    const [showAddModal, setShowAddModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [genericIdToDelete, setGenericIdToDelete] = useState(null);
    const [editGeneric, setEditGeneric] = useState({});
    const [editLoading, setEditLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState('');
    const [userRole, setUserRole] = useState(null); 
    const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

    const filteredGenerics = generics.filter((generic) =>
    generic.generic_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const indexOfLast = currentPage * genericsPerPage;
    const indexOfFirst = indexOfLast - genericsPerPage;
    const currentGenerics = filteredGenerics.slice(indexOfFirst, indexOfLast);

    useEffect(() => {
        const role = parseInt(localStorage.getItem('userRole'), 10);
        setUserRole(role);
        getGenerics();
    }, []);

    const handleCloseAddModal = () => setShowAddModal(false);
    const handleShowAddModal = () => setShowAddModal(true);

    const handleCloseDeleteModal = () => setShowDeleteModal(false);
    const handleShowDeleteModal = (genericId) => {
        setGenericIdToDelete(genericId);
        setShowDeleteModal(true);
    };

    const handleCloseEditModal = () => setShowEditModal(false);

    const handleShowEditModal = (genericId) => {
        setErrorMessage(''); 
        setEditLoading(true);
    
        axios.get(`${API_BASE_URL}/api/generic.php/${genericId}`)
            .then(response => {
                console.log('API Response:', response.data); 
                if (response.data && response.data.record) {
                    setEditGeneric(response.data.record);
                    setEditLoading(false);
                    setShowEditModal(true); 
                } else {
                    console.error('Error: Generic not found');
                    setEditLoading(false);
                    toast.error('Error: Generic not found');
                }
            })
            .catch(error => {
                console.error('Error fetching generic:', error);
                setEditLoading(false);
                toast.error('Error fetching generic');
            });
    };
    

    const getGenerics = () => {
        axios.get(`${API_BASE_URL}/api/generic.php/`)
            .then(response => {
                if (Array.isArray(response.data.records)) {
                    const fetchedGenerics = response.data.records;
                    const sortedGenerics = sortGenerics(fetchedGenerics, 'id', 'asc'); // ✅ sort asc
                    setGenerics(sortedGenerics);
                    setOriginalGenerics(fetchedGenerics);
                    setSortBy({ key: 'id', order: 'asc' }); // ✅ so arrow shows
                } else {
                    console.error('Unexpected response structure: records is not an array');
                }
            })
            .catch(error => {
                console.error('Error fetching generics:', error);
            });
    };

    const sortGenerics = (data, key, order) => {
        return [...data].sort((a, b) => {
            if (key === 'id') {
                return order === 'asc' ? a.id - b.id : b.id - a.id;
            }
            const valueA = typeof a[key] === 'string' ? a[key].toLowerCase() : a[key];
            const valueB = typeof b[key] === 'string' ? b[key].toLowerCase() : b[key];

            return order === 'asc' ? (valueA < valueB ? -1 : 1) : (valueA > valueB ? -1 : 1);
        });
    };

    /** ✅ Fix: Define `handleSort` */
    const handleSort = (key) => {
        const order = sortBy.key === key && sortBy.order === 'asc' ? 'desc' : 'asc';
        setSortBy({ key, order });
        setGenerics(sortGenerics(generics, key, order));
    };

    const handleGenericAdded = () => {
        getGenerics(); 
        setShowAddModal(false); 
        toast.success('Generic added successfully!'); 
    };

    const deleteGeneric = () => {
        axios.delete(`${API_BASE_URL}/api/generic.php/${genericIdToDelete}`)
            .then(() => {
                getGenerics();
                handleCloseDeleteModal();
                toast.success('Generic deleted successfully!');
            })
            .catch(() => {
                toast.error('Failed to delete generic');
            });
    };

    const handleEditSubmit = (event) => {
        event.preventDefault();
    
        if (!editGeneric.generic_name.trim()) {
            setErrorMessage("Generic name cannot be empty.");
            return;
        }
    
        setEditLoading(true);
        setErrorMessage("");
    
        axios.put(`${API_BASE_URL}/api/generic.php/${editGeneric.id}`, editGeneric)
            .then((response) => {
                if (response.data.status === 1) {
                    setShowEditModal(false);
                    getGenerics(); // ✅ Refresh the list after update
                    toast.success("Generic updated successfully!");
                } else {
                    setErrorMessage(response.data.message || "Failed to update generic.");
                }
            })
            .catch((error) => {
                console.error("Error updating generic:", error);
                setErrorMessage("Failed to update generic. Please try again.");
            })
            .finally(() => {
                setEditLoading(false);
            });
    };

    const IconButtonWithTooltip = ({ tooltip, children, ...props }) => (
        <OverlayTrigger placement="top" overlay={<Tooltip>{tooltip}</Tooltip>}>
            <Button {...props}>{children}</Button>
        </OverlayTrigger>
    );
    
    return (
        <div className='container mt-2'>
            <h1 style={{ textAlign: 'left', fontWeight: 'bold' }}>Generic CMS</h1>
            <div className='d-flex justify-content-between align-items-center'>
                <div className="input-group" style={{ width: '25%' }}>
                    <input 
                        type="text" 
                        className="form-control shadow-sm" 
                        placeholder="Search" 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                {userRole !== 1 && (
                    <Button onClick={handleShowAddModal} className='btn btn-primary btn-gradient'
                    style={{
                                backgroundImage: 'linear-gradient(to right, #006cb6, #31b44b)',
                                color: '#ffffff',
                                borderColor: '#006cb6',
                                fontWeight: 'bold',
                                marginBottom: '-10px',
                            }}>
                        Add Generic
                    </Button>
                )}
            </div>

            <div className="table-responsive">
                <table className="table table-striped table-hover custom-table align-middle shadow-sm">
                    <thead className="table-light">
                        <tr>
                            <th className="text-center" onClick={() => handleSort('id')}>
                                # {sortBy.key === 'id' ? (sortBy.order === 'asc' ? <AiOutlineArrowUp /> : <AiOutlineArrowDown />) : null}
                            </th>
                            <th className="text-center" onClick={() => handleSort('generic_name')}>
                                Generic Name {sortBy.key === 'generic_name' ? (sortBy.order === 'asc' ? <AiOutlineArrowUp /> : <AiOutlineArrowDown />) : null}
                            </th>
                            {userRole !== 1 && <th className="text-center">Action</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {currentGenerics.map((generic, index) => (
                            <tr key={generic.id}>
                                <td className="text-center">{index + indexOfFirst + 1}</td>
                                <td className="text-center">{generic.generic_name}</td>
                                {userRole !== 1 && (
                                    <td className="text-center">
                                        <IconButtonWithTooltip
                                            tooltip="Edit"
                                            onClick={() => handleShowEditModal(generic.id)}
                                            className="btn btn-primary me-2"
                                        >
                                            <FaEdit />
                                        </IconButtonWithTooltip>

                                        <IconButtonWithTooltip
                                            tooltip="Delete"
                                            onClick={() => handleShowDeleteModal(generic.id)}
                                            className="btn btn-danger"
                                        >
                                            <FaTrash />
                                        </IconButtonWithTooltip>
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
                <div className="d-flex justify-content-between align-items-center">
                    {/* Per page dropdown */}
                    <div className="d-flex align-items-center">
                        <label className="me-2 fw-bold">Items per page:</label>
                        <select
                        value={genericsPerPage}
                        onChange={(e) => {
                            setGenericsPerPage(Number(e.target.value));
                            setCurrentPage(1); // reset to first page
                        }}
                        className="form-select form-select-sm"
                        style={{ width: "80px" }}
                        >
                        <option value="5">5</option>
                        <option value="10">10</option>
                        <option value="15">15</option>
                        <option value="20">20</option>
                        </select>
                    </div>

                    {/* Pagination buttons */}
                    <ul className="pagination mb-0">
                        {Array.from(
                        { length: Math.ceil(filteredGenerics.length / genericsPerPage) },
                        (_, index) => (
                            <li
                            key={index}
                            className={`page-item ${currentPage === index + 1 ? "active" : ""}`}
                            style={{ cursor: "pointer" }}
                            onClick={() => setCurrentPage(index + 1)}
                            >
                            <span className="page-link">{index + 1}</span>
                            </li>
                        )
                        )}
                    </ul>
                </div>
            </div>
            
            <AddGenericModal show={showAddModal} handleClose={handleCloseAddModal} onGenericAdded={handleGenericAdded} />
            
            <EditGenericModal
                show={showEditModal} 
                handleClose={handleCloseEditModal} 
                editGeneric={editGeneric} 
                handleEditChange={(e) => setEditGeneric({ ...editGeneric, [e.target.name]: e.target.value })}
                handleEditSubmit={handleEditSubmit} // ✅ Now passing handleEditSubmit
                errorMessage={errorMessage} 
            />

            <Modal show={showDeleteModal} onHide={handleCloseDeleteModal}>
                <Modal.Header closeButton><Modal.Title>Confirm Delete</Modal.Title></Modal.Header>
                <Modal.Body>Are you sure you want to delete this generic?</Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleCloseDeleteModal}>Cancel</Button>
                    <Button variant="danger" onClick={deleteGeneric}>Delete</Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default Generic;
