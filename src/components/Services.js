import React, { useState, useEffect } from 'react';
import { FaSearch, FaEdit, FaTrash } from 'react-icons/fa';
import { AiOutlineArrowUp, AiOutlineArrowDown } from 'react-icons/ai';
import axios from "axios";
import { Pagination, Button, Modal, Tooltip, OverlayTrigger } from 'react-bootstrap';
import '../assets/table.css';
import AddServicesModal from '../components/Add/AddServicesModal';
import EditServicesModal from '../components/Edit/EditServicesModal';
import { toast } from 'react-toastify'; 
import 'react-toastify/dist/ReactToastify.css'; 

const Services = () => {
    const [services, setServices] = useState([]);
    const [originalServices, setOriginalServices] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [servicesPerPage, setServicesPerPage] = useState(5);
    const [sortBy, setSortBy] = useState({ key: '', order: '' });
    const [showAddModal, setShowAddModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [serviceIdToDelete, setServiceIdToDelete] = useState(null);
    const [serviceIdToEdit, setServiceIdToEdit] = useState(null);
    const [editService, setEditService] = useState({});
    const [editLoading, setEditLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState(''); // Add error message state
    

    // Get user role from localStorage
    const userRole = localStorage.getItem('userRole'); // Assuming 'user_role' is stored in localStorage

    const handleCloseAddModal = () => setShowAddModal(false);
    const handleShowAddModal = () => setShowAddModal(true);

    const handleCloseDeleteModal = () => setShowDeleteModal(false);
    const handleShowDeleteModal = (serviceId) => {
        setServiceIdToDelete(serviceId);
        setShowDeleteModal(true);
    };

    const handleCloseEditModal = () => {
        setShowEditModal(false);
        setErrorMessage(''); // Clear any error messages
        setEditLoading(true); // Reset loading state
    };
        const handleShowEditModal = (serviceId) => {
        setServiceIdToEdit(serviceId);
        setShowEditModal(true);
    };

    useEffect(() => {
        getServices();
    }, []);

    function getServices() {
        axios.get('http://localhost:80/api/services.php?archived=0')
        .then(function (response) {
            const updatedServices = response.data.map(service => ({
                ...service,
                consentForm: service.consent_form || "None", // Ensure it is mapped correctly
            }));
            setServices(updatedServices);
            setOriginalServices(updatedServices);
        });
    }

    const deleteService = (id) => {
        axios.delete(`http://localhost:80/api/services.php/${id}/delete`)
            .then(function (response) {
                toast.success("Service deleted successfully!"); 
                getServices();
            });
    }

    function handleFilter(event) {
        const searchText = event.target.value.toLowerCase();
        const newData = originalServices.filter(row => {
            return (
                String(row.name).toLowerCase().includes(searchText) ||
                String(row.status).toLowerCase().includes(searchText) ||  // Search by status
                String(row.id).toLowerCase().includes(searchText) ||
                String(row.created_by).toLowerCase().includes(searchText)
            );
        });
        setServices(searchText ? newData : originalServices);
    }

    // Get current services
    const indexOfLastService = currentPage * servicesPerPage;
    const indexOfFirstService = indexOfLastService - servicesPerPage;
    const currentServices = services.slice(indexOfFirstService, indexOfLastService);

    // Change page
    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    // Handle changing number of items per page
    const handlePerPageChange = (e) => {
        setCurrentPage(1); // Reset to the first page when changing items per page
        setServicesPerPage(Number(e.target.value));
    }

    // Sort table by column
    const handleSort = (key) => {
        let order = 'asc';
        if (sortBy.key === key && sortBy.order === 'asc') {
            order = 'desc';
        }
        setSortBy({ key: key, order: order });
        const sortedServices = [...services].sort((a, b) => {
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
        setServices(sortedServices);
    }

    // Function to determine the icon based on the sorting order
    const getSortIcon = (key) => {
        if (sortBy.key === key) {
            return sortBy.order === 'asc' ? <AiOutlineArrowUp /> : <AiOutlineArrowDown />;
        }
        return null;
    }

    const handleServicesAdded = () => {
        toast.success("Service added successfully!"); // Success toast for delete
        getServices(); // Refresh service list after adding a new service
    }

    const handleEditChange = (event) => {
        const { name, value } = event.target;
        setEditService((prevService) => ({ ...prevService, [name]: value }));
    };

    const handleEditSubmit = (event) => {
        event.preventDefault(); // Prevent form submission reload
        setErrorMessage(''); // Clear the error message
        axios.put(`http://localhost:80/api/services.php/${serviceIdToEdit}`, editService)
            .then(function (response) {
                toast.success("Service updated successfully!");
                handleCloseEditModal();
                getServices(); // Refresh services list
            })
            .catch(function (error) {
                console.error('Error updating services:', error);
                setErrorMessage('Failed to update service. Please try again.');
            });
    };
    

    useEffect(() => {
        if (showEditModal && serviceIdToEdit) {
            axios.get(`http://localhost:80/api/services.php/${serviceIdToEdit}`)
                .then(function (response) {
                    const servicesData = response.data.services || response.data;
                    if (servicesData && servicesData.id) {
                        setEditService(servicesData);
                        setEditLoading(false);
                    } else {
                        console.error('Error: services not found');
                        setEditLoading(false);
                    }
                })
                .catch(function (error) {
                    console.error('Error fetching services:', error);
                    setEditLoading(false);
                });
        }
    }, [showEditModal, serviceIdToEdit]);

    return (
        <div className='container mt-2'>
            <h1 style={{ textAlign: 'left', fontWeight: 'bold' }}>Services</h1>
            <div className='d-flex justify-content-between align-items-center'>
                <div className="input-group-prepend" style={{ width: '25%' }}>
                    <input type="text" className="form-control" onChange={handleFilter} placeholder="Search by name or status" />
                </div>
                <div className='text-end'>
                    {/* Show "Add Service" button only for non-admin users */}
                    {userRole !== '1' && (
                        <Button onClick={handleShowAddModal} className='btn btn-primary w-100'
                            style={{
                                backgroundImage: 'linear-gradient(to right, #006cb6, #31b44b)',
                                color: '#ffffff', // Text color
                                borderColor: '#006cb6', // Border color
                                fontWeight: 'bold'
                            }}
                        >
                            Add Service
                        </Button>
                    )}
                </div>
            </div>
            <div className="table-responsive">
                <table className="table table-striped table-hover custom-table" style={{ width: '100%' }}>
                    <thead>
                        <tr>
                            <th className="col text-center" onClick={() => handleSort('name')}>
                                Name
                                {getSortIcon('name')}
                            </th>
                            <th className="col text-center" onClick={() => handleSort('price')}>
                                Price
                                {getSortIcon('price')}
                            </th>
                            <th className="col text-center" onClick={() => handleSort('consent_form')}>
                                Consent Form
                                {getSortIcon('consent_form')}
                            </th>
                            <th className="col text-center" onClick={() => handleSort('status')}>
                                Status
                                {getSortIcon('status')}
                            </th>
                            {userRole !== '1' && (
                            <th className="col text-center">Action</th>
                            )}
                        </tr>
                    </thead>
                    <tbody>
                        {currentServices.map((service, key) => (
                            <tr key={key}>
                                <td className="col text-center">{service.name}</td>
                                <td className="col text-center">{service.price}</td>
                                <td className="col text-center">{service.consentForm}</td>
                                <td className="col text-center">{service.status}</td>
                                {userRole !== '1' && (
                                <td className="col text-center">
                                    <OverlayTrigger
                                        placement="top"
                                        overlay={<Tooltip id={`edit-tooltip-${service.id}`}>Edit</Tooltip>}
                                    >
                                        <Button onClick={() => handleShowEditModal(service.id)} className="btn btn-primary me-2 col-5">
                                            <FaEdit />
                                        </Button>
                                    </OverlayTrigger>
                                    <OverlayTrigger
                                        placement="top"
                                        overlay={<Tooltip id={`delete-tooltip-${service.id}`}>Delete</Tooltip>}
                                    >
                                        <button onClick={() => handleShowDeleteModal(service.id)} className="btn btn-danger me-2 col-5">
                                            <FaTrash />
                                        </button>
                                    </OverlayTrigger>
                                </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="d-flex justify-content-between mb-3">
                <div className="d-flex align-items-center">
                    <div className="col-md-auto">
                        <label htmlFor="itemsPerPage" className="form-label me-2">Items per page:</label>
                    </div>
                    <div className="col-md-5">
                        <select id="itemsPerPage" className="form-select" value={servicesPerPage} onChange={handlePerPageChange}>
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
                    {Array.from({ length: Math.ceil(services.length / servicesPerPage) }, (_, index) => (
                        <Pagination.Item key={index} active={index + 1 === currentPage} onClick={() => paginate(index + 1)}>
                            {index + 1}
                        </Pagination.Item>
                    ))}
                </Pagination>
            </div>
            <AddServicesModal show={showAddModal} handleClose={handleCloseAddModal} onServicesAdded={handleServicesAdded} />
            <EditServicesModal 
    show={showEditModal} 
    handleClose={handleCloseEditModal} 
    editService={editService} 
    editLoading={editLoading} 
    handleEditChange={handleEditChange} 
    handleEditSubmit={handleEditSubmit} // Pass the correct function
    serviceIdToEdit={serviceIdToEdit} 
    errorMessage={errorMessage}  // Pass the error message state
/>

            <Modal show={showDeleteModal} onHide={handleCloseDeleteModal} className="custom-modal">
                <Modal.Header closeButton>
                    <Modal.Title>Confirm Delete</Modal.Title>
                </Modal.Header>
                <Modal.Body>Are you sure you want to delete this service?</Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleCloseDeleteModal}>
                        Cancel
                    </Button>
                    <Button variant="danger" onClick={() => {
                        deleteService(serviceIdToDelete);
                        handleCloseDeleteModal();
                    }}>
                        Delete
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
}

export default Services;
