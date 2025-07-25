import React, { useEffect, useState } from 'react';
import { FaSearch, FaEdit, FaTrash, FaList } from 'react-icons/fa';
import { AiOutlineArrowUp, AiOutlineArrowDown } from 'react-icons/ai';
import axios from 'axios';
import { Pagination, Button, Modal, Tooltip, OverlayTrigger } from 'react-bootstrap'; // Import Tooltip and OverlayTrigger
import { toast } from 'react-toastify'; // Import ToastContainer and toast
import 'react-toastify/dist/ReactToastify.css'; // Import CSS for Toastify
import AddClientAndPatientModal from './Add/AddClientsModal'; // Use only the new modal
import EditClientsModal from '../components/Edit/EditClientModal';
import ViewClientModal from '../components/View/ViewClientModal';

const ListClients = () => {
    const [users, setUsers] = useState([]);
    const [originalUsers, setOriginalUsers] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [usersPerPage, setUsersPerPage] = useState(5);
    const [sortBy, setSortBy] = useState({ key: '', order: '' });
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editUserId, setEditUserId] = useState(null);
    const [editFormData, setEditFormData] = useState({});
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [clientIdToDelete, setClientIdToDelete] = useState(null);
    const [showViewModal, setShowViewModal] = useState(false);
    const [viewClientId, setViewClientId] = useState(null);
    const [viewClientPatients, setViewClientPatients] = useState([]);

    useEffect(() => {
        getUsers();
    }, []);

    const handleCategoryAdded = () => {
        getUsers();
        toast.success('Client and Pet added successfully!');
    };

    function getUsers() {
        axios.get('http://localhost:80/api/clients.php?archived=0')
            .then(response => {
                if (Array.isArray(response.data.clients)) {
                    setUsers(response.data.clients.map(user => ({
                        ...user,
                        created_at: user.created_at,
                        created_by: user.created_by
                    })));
                    setOriginalUsers(response.data.clients);
                } else {
                    console.error('Unexpected response structure: clients is not an array');
                }
            });
    }

    const handleCloseDeleteModal = () => setShowDeleteModal(false);
    const handleCloseViewModal = () => setShowViewModal(false);

    const handleShowDeleteModal = (id) => {
        setClientIdToDelete(id);
        setShowDeleteModal(true);
    };

    const deleteUser = (id) => {
        axios.delete(`http://localhost:80/api/clients.php/${id}/delete`)
            .then(response => {
                console.log(response.data);
                getUsers();
                handleCloseDeleteModal();
                toast.success('Client deleted successfully!');
            })
            .catch(error => {
                console.error('Error deleting client:', error);
                toast.error('Error deleting client.');
            });
    };

    const handleView = (clientId) => {
        setViewClientId(clientId);
        axios.get(`http://localhost:80/api/clients.php/clients/${clientId}/patients`)
            .then(response => {
                setViewClientPatients(response.data.patients || []);
                setShowViewModal(true);
            })
            .catch(error => {
                console.error('Error fetching patients:', error);
                toast.error('Error fetching patients.');
            });
    };

    function handleFilter(event) {
        const searchText = event.target.value.toLowerCase();
        const newData = originalUsers.filter(row => {
            return (
                String(row.name).toLowerCase().includes(searchText) ||
                String(row.email).toLowerCase().includes(searchText) ||
                String(row.cellnumber).toLowerCase().includes(searchText)
            );
        });
        setUsers(searchText ? newData : originalUsers);
    }

    const indexOfLastUser = currentPage * usersPerPage;
    const indexOfFirstUser = indexOfLastUser - usersPerPage;
    const currentUsers = users.slice(indexOfFirstUser, indexOfLastUser);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    const handlePerPageChange = (e) => {
        setCurrentPage(1);
        setUsersPerPage(Number(e.target.value));
    };

    const handleSort = (key) => {
        let order = 'asc';
        if (sortBy.key === key && sortBy.order === 'asc') {
            order = 'desc';
        }
        setSortBy({ key: key, order: order });
        const sortedUsers = [...users].sort((a, b) => {
            const valueA = typeof a[key] === 'string' ? a[key].toLowerCase() : a[key];
            const valueB = typeof b[key] === 'string' ? b[key].toLowerCase() : b[key];
            if (valueA < valueB) {
                return order === 'asc' ? -1 : 1;
            }
            if (valueA > valueB) {
                return order === 'asc' ? 1 : -1;
            }
            return 0;
        });
        setUsers(sortedUsers);
    };

    const getSortIcon = (key) => {
        if (sortBy.key === key) {
            return sortBy.order === 'asc' ? <AiOutlineArrowUp /> : <AiOutlineArrowDown />;
        }
        return null;
    };

    const handleEdit = (userId) => {
        setEditUserId(userId);
        setShowEditModal(true);
    };

    const handleEditInputChange = (e) => {
        const { name, value } = e.target;
        setEditFormData({ ...editFormData, [name]: value });
    };

    const handleEditSubmit = (formData) => {
        axios.put(`http://localhost:80/api/clients.php/${formData.id}`, formData)
            .then(response => {
                console.log('Record updated successfully.');
                getUsers();
                toast.success('Client updated successfully!');
            })
            .catch(error => {
                console.error('Failed to update record:', error);
                toast.error('Error updating client.');
            });
        setShowEditModal(false);
    };

    return (
        <div className='container mt-4'>
            <h1 style={{ textAlign: 'left', fontWeight: 'bold' }}>Clients</h1>
            <div className='d-flex justify-content-between align-items-center'>
                <div className="input-group-prepend" style={{ width: '25%' }}>
                    <input type="text" className="form-control" onChange={handleFilter} placeholder="Search" />
                </div>
                <div className='text-end'>
                    <Button onClick={() => setShowAddModal(true)} className='btn btn-primary w-100'
                        style={{
                            backgroundImage: 'linear-gradient(to right, #006cb6, #31b44b)',
                            color: '#ffffff',
                            borderColor: '#006cb6',
                            fontWeight: 'bold'
                        }}
                    >
                        Add Client and Pet
                    </Button>
                </div>
            </div>
            <div className="table-responsive">
                <table className="table table-striped table-hover custom-table" style={{ width: '100%' }}>
                    <thead>
                        <tr>
                            <th className="col text-center" onClick={() => handleSort('name')}>
                                Name {getSortIcon('name')}
                            </th>
                            <th className="col text-center" onClick={() => handleSort('address')}>
                                Address {getSortIcon('address')}
                            </th>
                            <th className="col text-center" onClick={() => handleSort('cellnumber')}>
                                Cell Number {getSortIcon('cellnumber')}
                            </th>
                            <th className="col text-center" onClick={() => handleSort('email')}>
                                Email {getSortIcon('email')}
                            </th>
                            <th className="col text-center">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentUsers.map((user, key) =>
                            <tr key={key}>
                                <td className="col text-center">{user.name}</td>
                                <td className="col text-center">{user.address}</td>
                                <td className="col text-center">{user.cellnumber}</td>
                                <td className="col text-center">{user.email}</td>
                                <td className="col text-center">
                                    <div className="d-flex justify-content-center">
                                        <OverlayTrigger
                                            placement="top"
                                            overlay={<Tooltip>View</Tooltip>}
                                        >
                                            <button onClick={() => handleView(user.id)} className="btn btn-success me-2 col-4"><FaList /></button>
                                        </OverlayTrigger>
                                        <OverlayTrigger
                                            placement="top"
                                            overlay={<Tooltip>Edit</Tooltip>}
                                        >
                                            <button onClick={() => handleEdit(user.id)} className="btn btn-primary me-2 col-4"><FaEdit /></button>
                                        </OverlayTrigger>
                                        <OverlayTrigger
                                            placement="top"
                                            overlay={<Tooltip>Delete</Tooltip>}
                                        >
                                            <button onClick={() => handleShowDeleteModal(user.id)} className="btn btn-danger me-2 col-4"><FaTrash /></button>
                                        </OverlayTrigger>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            <div className="d-flex justify-content-between mb-3">
                <div className="d-flex align-items-center">
                    <div className="col-md-auto">
                        <label htmlFor="itemsPerPage" className="form-label me-2">Items per page:</label>
                    </div>
                    <div className="col-md-5">
                        <select id="itemsPerPage" className="form-select" value={usersPerPage} onChange={handlePerPageChange}>
                            <option value="5">5</option>
                            <option value="10">10</option>
                            <option value="15">15</option>
                            <option value="20">20</option>
                            <option value="30">30</option>
                            <option value="50">50</option>
                        </select>
                    </div>
                </div>
                <Pagination>
                    {Array.from({ length: Math.ceil(users.length / usersPerPage) }, (_, index) => (
                        <Pagination.Item key={index} active={index + 1 === currentPage} onClick={() => paginate(index + 1)}>
                            {index + 1}
                        </Pagination.Item>
                    ))}
                </Pagination>
            </div>
            <AddClientAndPatientModal 
                show={showAddModal} 
                handleClose={() => setShowAddModal(false)} 
                onCategoryAdded={handleCategoryAdded} 
            />
            <EditClientsModal 
                show={showEditModal} 
                handleClose={() => setShowEditModal(false)} 
                editClient={users.find(user => user.id === editUserId)} 
                handleEditChange={handleEditInputChange}
                handleEditSubmit={handleEditSubmit}
            />
            <ViewClientModal 
                show={showViewModal} 
                handleClose={handleCloseViewModal} 
                client={users.find(user => user.id === viewClientId)}
                patients={viewClientPatients} 
            />
            <Modal show={showDeleteModal} onHide={handleCloseDeleteModal} className="custom-modal">
                <Modal.Header closeButton>
                    <Modal.Title>Confirm Delete</Modal.Title>
                </Modal.Header>
                <Modal.Body>Are you sure you want to delete this client?</Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleCloseDeleteModal}>
                        Cancel
                    </Button>
                    <Button variant="danger" onClick={() => deleteUser(clientIdToDelete)}>
                        Delete
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
}

export default ListClients;
