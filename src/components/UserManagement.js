import React, { useEffect, useState } from 'react';
import { FaSearch, FaEdit, FaTrash } from 'react-icons/fa';
import { AiOutlineArrowUp, AiOutlineArrowDown } from 'react-icons/ai';
import axios from "axios";
import { Button, Modal, Pagination, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { toast } from 'react-toastify'; 
import 'react-toastify/dist/ReactToastify.css'; // Import the CSS for the toast

import '../assets/table.css';
import AddUserModal from '../components/Add/AddUserModal';
import EditUserModal from '../components/Edit/EditUserModal';

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [originalUsers, setOriginalUsers] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [usersPerPage, setUsersPerPage] = useState(5);
    const [sortBy, setSortBy] = useState({ key: '', order: '' });
    const [showModal, setShowModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [userIdToDelete, setUserIdToDelete] = useState(null);
    const [userManagementIdToEdit, setUserManagementIdToEdit] = useState(null);
    const [editUserManagement, setEditUserManagement] = useState({});
    const [editLoading, setEditLoading] = useState(true);
    const [showEditModal, setShowEditModal] = useState(false);

    const handleClose = () => setShowModal(false);
    const handleShow = () => setShowModal(true);
    const handleCloseEditModal = () => setShowEditModal(false);
    const handleCloseDeleteModal = () => setShowDeleteModal(false);
    
    const handleShowDeleteModal = (userId) => {
        setUserIdToDelete(userId);
        setShowDeleteModal(true);
    };

    useEffect(() => {
        getUsers();
    }, []);

    function getUsers() {
        axios.get('http://localhost:80/api/internal_users.php/')
            .then(function (response) {
                setUsers(response.data);
                setOriginalUsers(response.data); // Store original data
            })
            .catch(function (error) {
                console.error("Error fetching users:", error);
            });
    }

    const deleteUser = (id) => {
        axios.delete(`http://localhost:80/api/internal_users.php/${id}/delete`)
            .then(function (response) {
                getUsers();
                toast.success('User deleted successfully!'); // Show success notification
            })
            .catch((error) => {
                toast.error('Error deleting user!'); // Show error notification
                console.error('Error deleting user:', error);
            });
    };

    function handleFilter(event) {
        const searchText = event.target.value.toLowerCase();
        const newData = originalUsers.filter(row => {
            return (
                String(row.username).toLowerCase().includes(searchText) ||
                String(row.email).toLowerCase().includes(searchText) ||
                String(row.first_name).toLowerCase().includes(searchText) ||
                String(row.last_name).toLowerCase().includes(searchText)
            );
        });
        setUsers(searchText ? newData : originalUsers);
    }

    const mapUserLevelToLabel = (user_role) => {
        const role = Number(user_role); // Ensure it's a number
        switch (role) {
            case 1:
                return 'Veterinarian';
            case 2:
                return 'Receptionist';
            case 3:
                return 'Admin';
            default:
                return 'Unknown';
        }
    };

    // Get current users
    const indexOfLastUser = currentPage * usersPerPage;
    const indexOfFirstUser = indexOfLastUser - usersPerPage;
    const currentUsers = users.slice(indexOfFirstUser, indexOfLastUser);

    // Change page
    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    // Handle changing number of items per page
    const handlePerPageChange = (e) => {
        setCurrentPage(1); // Reset to the first page when changing items per page
        setUsersPerPage(Number(e.target.value));
    };

    // Sort table by column
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

    // Function to determine the icon based on the sorting order
    const getSortIcon = (key) => {
        if (sortBy.key === key) {
            return sortBy.order === 'asc' ? <AiOutlineArrowUp /> : <AiOutlineArrowDown />;
        }
        return null;
    };

    const handleShowEditModal = (userId) => {
        setUserManagementIdToEdit(userId); // Set the userManagementIdToEdit state
        setShowEditModal(true);
    };

    const handleUsersAdded = () => {
        getUsers(); 
        toast.success('User added successfully!'); // Show success notification
    };

    const handleEditChange = (e) => {
        const { name, value } = e.target;
        setEditUserManagement((prevUserManagement) => ({
            ...prevUserManagement,
            [name]: value,
        }));
    };

    const handleEditSubmit = (event) => {
        event.preventDefault();

        axios.put(`http://localhost:80/api/internal_users.php/${userManagementIdToEdit}`, editUserManagement)
            .then(function (response) {
                handleCloseEditModal();
                getUsers();
                toast.success('User updated successfully!'); // Show success notification
            })
            .catch(function (error) {
                toast.error('Error updating user!'); // Show error notification
                console.error('Error updating UserManagement:', error);
            });
    };

    useEffect(() => {
        if (showEditModal && userManagementIdToEdit) { // Check if userManagementIdToEdit is not null
            axios.get(`http://localhost:80/api/internal_users.php/${userManagementIdToEdit}`)
                .then(function (response) {
                    const userData = response.data.user || response.data;
                    if (userData && userManagementIdToEdit) {
                        setEditUserManagement(userData);
                        setEditLoading(false);
                    } else {
                        console.error('Error: User not found');
                        setEditLoading(false);
                    }
                })
                .catch(function (error) {
                    console.error('Error fetching User:', error);
                    setEditLoading(false);
                });
        }
    }, [showEditModal, userManagementIdToEdit]);

    return (
        <div className='container mt-2'>
            <h1 style={{ textAlign: 'left', fontWeight: 'bold' }}>User Management</h1>
            <div className='d-flex justify-content-between align-items-center'>
                <div className="input-group" style={{ width: '25%', marginBottom: '10px' }}>
                    <input type="text" className="form-control" onChange={handleFilter} placeholder="Search" />
                </div>
                <div className='text-end'>
                    <Button onClick={handleShow} className='btn btn-primary w-100'
                        style={{
                            backgroundImage: 'linear-gradient(to right, #006cb6, #31b44b)',
                            color: '#ffffff', // Text color
                            borderColor: '#006cb6', // Border color
                            fontWeight: 'bold'
                        }}
                    >
                        Add User
                    </Button>
                </div>
            </div>
            <div className="table-responsive">
                <table className="table table-striped table-hover custom-table" style={{ width: '100%' }}>
                    <thead>
                        <tr>
                            <th className="col text-center" onClick={() => handleSort('email')}>
                                Email
                                {getSortIcon('email')}
                            </th>
                            <th className="col text-center" onClick={() => handleSort('first_name')}>
                                First Name
                                {getSortIcon('first_name')}
                            </th>
                            <th className="col text-center" onClick={() => handleSort('last_name')}>
                                Last Name
                                {getSortIcon('last_name')}
                            </th>
                            <th className="col text-center" onClick={() => handleSort('user_role')}>
                                Account Type
                                {getSortIcon('user_role')}
                            </th>

                            <th className="col text-center">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentUsers.map((user, key) =>
                            <tr key={key}>
                                <td className="col text-center">{currentUsers[key].email}</td>
                                <td className="col text-center">{currentUsers[key].first_name}</td>
                                <td className="col text-center">{currentUsers[key].last_name}</td>
                                <td className="col text-center">{mapUserLevelToLabel(currentUsers[key].user_role)}</td>
                                <td className="col text-center">
                                    <OverlayTrigger
                                        placement="top"
                                        overlay={<Tooltip id="edit-tooltip">Edit</Tooltip>}
                                    >
                                        <Button onClick={() => handleShowEditModal(currentUsers[key].id)} className="btn btn-primary me-2 col-5">
                                            <FaEdit />
                                        </Button>
                                    </OverlayTrigger>
                                    <OverlayTrigger
                                        placement="top"
                                        overlay={<Tooltip id="delete-tooltip">Delete</Tooltip>}
                                    >
                                        <button onClick={() => handleShowDeleteModal(currentUsers[key].id)} className="btn btn-danger me-2 col-5">
                                            <FaTrash />
                                        </button>
                                    </OverlayTrigger>
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
            <AddUserModal show={showModal} handleClose={handleClose} onUsersAdded={handleUsersAdded} />
            <EditUserModal 
                show={showEditModal} 
                handleClose={handleCloseEditModal} 
                editUser={editUserManagement} 
                editLoading={editLoading} 
                handleEditChange={handleEditChange} 
                handleEditSubmit={handleEditSubmit} 
                userManagementIdToEdit={userManagementIdToEdit} 
            />
            <Modal show={showDeleteModal} onHide={handleCloseDeleteModal} className="custom-modal">
                <Modal.Header closeButton>
                    <Modal.Title>Confirm Delete</Modal.Title>
                </Modal.Header>
                <Modal.Body>Are you sure you want to delete this user?</Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleCloseDeleteModal}>
                        Cancel
                    </Button>
                    <Button variant="danger" onClick={() => {
                        deleteUser(userIdToDelete);
                        handleCloseDeleteModal();
                    }}>
                        Delete
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default UserManagement;
