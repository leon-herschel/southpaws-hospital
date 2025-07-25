import React, { useEffect, useState } from 'react';
import { FaEdit, FaTrash } from 'react-icons/fa';
import { AiOutlineArrowUp, AiOutlineArrowDown } from 'react-icons/ai';
import axios from "axios";
import { Pagination, Button, Modal, Tooltip, OverlayTrigger } from 'react-bootstrap';
import { toast } from 'react-toastify';
import '../assets/table.css'; 
import AddUnitModal from '../components/Add/AddUnitModal';
import EditUnitModal from '../components/Edit/EditUnitModal';

const UnitOfMeasurement = () => {
    const [units, setUnits] = useState([]);
    const [originalUnits, setOriginalUnits] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [unitsPerPage, setUnitsPerPage] = useState(5);
    const [sortBy, setSortBy] = useState({ key: 'id', order: 'desc' }); // Default to descending by ID
    const [showAddModal, setShowAddModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [unitIdToDelete, setUnitIdToDelete] = useState(null);
    const [editUnit, setEditUnit] = useState({});
    const [editLoading, setEditLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState('');
    const [userRole, setUserRole] = useState(null);

    useEffect(() => {
        const role = parseInt(localStorage.getItem('userRole'), 10);
        setUserRole(role);
        getUnits();
    }, []);

    const handleCloseAddModal = () => setShowAddModal(false);
    const handleShowAddModal = () => setShowAddModal(true);

    const handleCloseDeleteModal = () => setShowDeleteModal(false);
// When the user clicks on the "Delete" button, pass the unit ID
const handleShowDeleteModal = (unitId) => {
    setUnitIdToDelete(unitId);
    setShowDeleteModal(true);
};


    const handleCloseEditModal = () => setShowEditModal(false);

    const handleShowEditModal = (unitId) => {    
        setErrorMessage('');
        setEditLoading(true);
        axios.get(`http://localhost:80/api/units.php/${unitId}`)
            .then(response => {
                // Adjusted to match the API response structure
                if (response.data.unit && response.data.unit.id) {
                    setEditUnit(response.data.unit);  // Corrected response structure here
                    setEditLoading(false);
                    setShowEditModal(true);
                } else {
                    console.error('Error: Unit not found', response.data);
                    setEditLoading(false);
                }
            })
            .catch(error => {
                console.error('Error fetching unit:', error);
                setEditLoading(false);
            });
    };
    
    

    const getUnits = () => {
        axios.get('http://localhost:80/api/units.php?archived=0') // Fetch only active units
        .then(response => {
            if (Array.isArray(response.data.units)) {
                const fetchedUnits = response.data.units;
                const sortedUnits = sortUnits(fetchedUnits, 'id', 'desc');
                setUnits(sortedUnits);
                setOriginalUnits(fetchedUnits);
            } else {
                console.error('Unexpected response structure: units is not an array');
                setUnits([]);
                setOriginalUnits([]);
            }
        });
        
    };
    
    
    const sortUnits = (units, key, order) => {
        return [...units].sort((a, b) => {
            if (key === 'id') {
                return order === 'asc' ? a.id - b.id : b.id - a.id;
            }

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
    };

    const deleteUnit = () => {
        axios.delete(`http://localhost:80/api/units.php/${unitIdToDelete}`)
            .then(() => {
                getUnits();
                handleCloseDeleteModal();
                toast.success('Unit deleted successfully!');
            })
            .catch(error => {
                toast.error('Failed to delete unit');
            });
    };

    const handleFilter = (event) => {
        const searchText = event.target.value.toLowerCase();
        const newData = originalUnits.filter(row => 
            String(row.unit_name).toLowerCase().includes(searchText) ||
            String(row.created_by).toLowerCase().includes(searchText)
        );
        setUnits(searchText ? newData : originalUnits);
    };

    const indexOfLastUnit = currentPage * unitsPerPage;
    const indexOfFirstUnit = indexOfLastUnit - unitsPerPage;
    const currentUnits = units.slice(indexOfFirstUnit, indexOfLastUnit);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    const handlePerPageChange = (e) => {
        setCurrentPage(1);
        setUnitsPerPage(Number(e.target.value));
    };

    const handleSort = (key) => {
        let order = 'asc';
        if (sortBy.key === key && sortBy.order === 'asc') {
            order = 'desc';
        }
        setSortBy({ key: key, order: order });
        const sortedUnits = sortUnits(units, key, order);
        setUnits(sortedUnits);
    };

    const getSortIcon = (key) => {
        if (sortBy.key === key) {
            return sortBy.order === 'asc' ? <AiOutlineArrowUp /> : <AiOutlineArrowDown />;
        }
        return null;
    };

    const handleUnitAdded = () => {                    
        toast.success('Unit of Measurement added successfully!');
        getUnits(); // Only refetch units after unit is added, no need for a toast here
    };
    
    const handleEditChange = (event) => {
        const { name, value } = event.target;
        setEditUnit((prevUnit) => ({ ...prevUnit, [name]: value })); // Fix this line
    };
    
    const handleEditSubmit = (event) => {
        event.preventDefault();
   
        // Log the current state of editUnit to debug
        console.log("Submitting update for unit:", editUnit);
        
        if (!editUnit.unit_name.trim()) {
            setErrorMessage('Unit name cannot be empty.');
            toast.error('Unit name cannot be empty!');
            return;
        }
   
        // Get user ID from localStorage
        const userId = localStorage.getItem('userID') || null;
   
        // Prepare updated data with `updated_by`
        const updatedUnit = {
            ...editUnit,
            updated_by: userId, // Added `updated_by`
        };
   
        // Send PUT request for updating unit name
        axios.put(`http://localhost:80/api/units.php/${editUnit.id}`, updatedUnit)
            .then((response) => {
                console.log("API response:", response);  // Log API response for debugging
                if (response.data.status === 1) {
                    handleCloseEditModal();
                    getUnits();  // This triggers the re-fetch, so we avoid calling toast here again
                    toast.success('Unit updated successfully!');
                } else {
                    console.error("Update Failed:", response.data);
                    setErrorMessage(response.data.message || 'Failed to update unit');
                    toast.error(response.data.message || 'Failed to update unit! 🚨');
                }
            })
            .catch((error) => {
                console.error("Error updating unit:", error);
                setErrorMessage('Failed to update unit. Please try again.');
                toast.error('Error updating unit! 🚨');
            });
    };
   

    const archiveUnit = (unitId) => {
        if (!unitId) {
            toast.error('Invalid unit ID.'); // Prevent sending an invalid request
            return;
        }
    
        // Ensure you're only sending the relevant data (id and archived)
        console.log("Archiving unit with ID:", unitId);  // Debugging: Check unitId value
    
        axios.put(`http://localhost:80/api/units.php/${unitId}`, { 
            id: unitId, 
            archived: 1  // Ensure archived is correctly set to 1
        })
        .then((response) => {
            console.log("API response:", response);  // Log API response for debugging
            if (response.data.status === 1) {
                getUnits(); // Refresh the list after archiving
                handleCloseDeleteModal();
                toast.success('Unit archived successfully!');
            } else {
                toast.warning(response.data.message || 'No changes made.');
            }
        })
        .catch((error) => {
            console.error('Error archiving unit:', error);
            toast.error('Failed to archive unit.');
        });
    };
    
    
    
    
    

    return (
        <div className='container mt-4'>
            <h1 style={{ textAlign: 'left', fontWeight: 'bold' }}>Unit of Measurement</h1>
            <div className='d-flex justify-content-between align-items-center'>
                <div className="input-group" style={{ width: '25%', marginBottom: '10px' }}>
                    <input type="text" className="form-control" onChange={handleFilter} placeholder="Search" />
                </div>
                {userRole !== 1 && (
                    <div className='text-end'>
                        <Button onClick={handleShowAddModal} className='btn btn-primary w-100'
                        style={{
                            backgroundImage: 'linear-gradient(to right, #006cb6, #31b44b)',
                            color: '#ffffff',
                            borderColor: '#006cb6',
                            fontWeight: 'bold'
                        }}>
                            Add Unit
                        </Button>
                    </div>
                )}
            </div>

            <div className="table-responsive">
                <table className="table table-striped table-hover custom-table" style={{ width: '100%' }}>
                    <thead>
                        <tr>
                            <th className="text-center" onClick={() => handleSort('id')}>
                                #
                                {getSortIcon('id')}
                            </th>
                            <th className="text-center" onClick={() => handleSort('unit_name')}>
                                Unit Name
                                {getSortIcon('unit_name')}
                            </th>
                            {userRole !== 1 && (
                                <th className="text-center">Action</th>
                            )}
                        </tr>
                    </thead>
                    <tbody>
                        {currentUnits.map((unit, index) => {
                            const recentIndex = index + 1; 
                            return (
                                <tr key={unit.id}>
                                    <td className="text-center">{recentIndex}</td>
                                    <td className="text-center">{unit.unit_name}</td>
                                    {userRole !== 1 && (
                                        <td className="text-center">
                                            <OverlayTrigger placement="top" overlay={<Tooltip>Edit</Tooltip>}>
                                                <Button 
                                                    onClick={() => handleShowEditModal(unit.id)}
                                                    className="btn btn-primary me-2 col-4" 
                                                    style={{ padding: '5px 7px', height: '30px' }}
                                                >
                                                    <FaEdit />
                                                </Button>
                                            </OverlayTrigger>
                                            <OverlayTrigger placement="top" overlay={<Tooltip>Delete</Tooltip>}>
                                                <Button 
                                                    onClick={() => handleShowDeleteModal(unit.id)}
                                                    className="btn btn-danger col-4"
                                                    style={{ padding: '5px 7px', height: '30px' }}
                                                >
                                                    <FaTrash />
                                                </Button>
                                            </OverlayTrigger>
                                        </td>
                                    )}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            <div className="row">
                <div className="col-md-6 d-flex align-items-center justify-content-start">
                    <label className="form-label me-2">Show entries:</label>
                    <select value={unitsPerPage} onChange={handlePerPageChange} className="form-select" style={{ width: '50px' }}>
                        {[5, 10, 25].map(value => (
                            <option key={value} value={value}>{value}</option>
                        ))}
                    </select>
                </div>
                <div className="col-md-6">
                    <Pagination className="justify-content-end">
                        {Array.from({ length: Math.ceil(units.length / unitsPerPage) }, (_, index) => index + 1).map((pageNumber) => (
                            <Pagination.Item
                                key={pageNumber}
                                active={pageNumber === currentPage}
                                onClick={() => paginate(pageNumber)}
                            >
                                {pageNumber}
                            </Pagination.Item>
                        ))}
                    </Pagination>
                </div>
            </div>

            <AddUnitModal
                show={showAddModal}
                onClose={handleCloseAddModal}
                onUnitAdded={handleUnitAdded}
            />

            <EditUnitModal
                show={showEditModal}
                handleClose={handleCloseEditModal}
                editUnit={editUnit}
                loading={editLoading}
                handleEditChange={handleEditChange} 
                handleEditSubmit={handleEditSubmit}
                errorMessage={errorMessage}
            />

        <Modal show={showDeleteModal} onHide={handleCloseDeleteModal}>
            <Modal.Header closeButton>
                <Modal.Title>Archive Unit</Modal.Title>
            </Modal.Header>
            <Modal.Body>Are you sure you want to archive this unit?</Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={handleCloseDeleteModal}>
                    Cancel
                </Button>
                <Button 
                    variant="danger" 
                    onClick={() => archiveUnit(unitIdToDelete)} // Pass the unitId here
                >
                    Archive
                </Button>
            </Modal.Footer>
        </Modal>
        </div>
    );
};

export default UnitOfMeasurement;
