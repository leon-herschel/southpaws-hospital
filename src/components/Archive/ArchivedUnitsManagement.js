import React, { useEffect, useState } from 'react';
import { FaTrashRestore, FaTrash } from 'react-icons/fa';
import { AiOutlineArrowUp, AiOutlineArrowDown } from 'react-icons/ai';
import axios from 'axios';
import { Table, Button, Form, Modal, Pagination, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useNavigate } from 'react-router-dom';

const ArchivedUnitsManagement = () => {
    const [archivedUnits, setArchivedUnits] = useState([]);
    const [originalArchivedUnits, setOriginalArchivedUnits] = useState([]);
    const [selectedUnits, setSelectedUnits] = useState([]);
    const [sortBy, setSortBy] = useState({ key: '', order: '' });
    const [currentPage, setCurrentPage] = useState(1);
    const [unitsPerPage, setUnitsPerPage] = useState(5);  
    const [unitIdToDelete, setUnitIdToDelete] = useState(null);
    const [showRestoreModal, setShowRestoreModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [unitIdToRestore, setUnitIdToRestore] = useState(null); 
    const [selectAll, setSelectAll] = useState(false);
    const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
    const navigate = useNavigate();

    useEffect(() => {
        fetchArchivedUnits();
    }, []);

    const fetchArchivedUnits = () => {
        axios.get(`${API_BASE_URL}/api/units.php?archived=1`)
            .then((response) => {
                const unitsData = response.data.units || [];
                setArchivedUnits(unitsData);
                setOriginalArchivedUnits(unitsData);
            })
            .catch((error) => {
                console.error('Error fetching archived units:', error);
            });
    };

    const restoreUnit = () => {
        axios.put(`${API_BASE_URL}/api/units.php`, {
            id: unitIdToRestore, 
            archived: 0
        })
        .then(response => {
            if (response.data.status === 1) {
                fetchArchivedUnits();
                setShowRestoreModal(false);
                toast.success('Unit restored successfully!');
            } else {
                toast.error(response.data.message || 'Failed to restore unit');
            }
        })
        .catch((error) => {
            console.error('Error restoring unit:', error);
            toast.error('Failed to restore unit');
        });
    };

    const deleteUnit = () => {
        axios.delete(`${API_BASE_URL}/api/units.php/${unitIdToDelete}`)
            .then(() => {
                fetchArchivedUnits();
                setShowDeleteModal(false);
                toast.success('Unit deleted successfully!');
            })
            .catch(error => {
                console.error('Error deleting unit:', error);
                toast.error('Failed to delete unit');
            });
    };

    const handleSelectUnit = (id) => {
        setSelectedUnits(prev =>
            prev.includes(id) ? prev.filter(uid => uid !== id) : [...prev, id]
        );
    };

    const handleSelectAll = () => {
        if (!selectAll) {
            setSelectedUnits(archivedUnits.map(u => u.id));
        } else {
            setSelectedUnits([]);
        }
        setSelectAll(!selectAll);
    };

    const handleFilter = (event) => {
        const searchText = event.target.value.toLowerCase();
        const filteredData = originalArchivedUnits.filter(row =>
            row.unit_name.toLowerCase().includes(searchText)
        );
        setArchivedUnits(searchText ? filteredData : originalArchivedUnits);
    };

    const handleSort = (key) => {
        let order = 'asc';
        if (sortBy.key === key && sortBy.order === 'asc') {
            order = 'desc';
        }
        setSortBy({ key, order });
        const sortedUnits = [...archivedUnits].sort((a, b) => {
            const valueA = typeof a[key] === 'string' ? a[key].toLowerCase() : a[key];
            const valueB = typeof b[key] === 'string' ? b[key].toLowerCase() : b[key];
            return order === 'asc' ? (valueA > valueB ? 1 : -1) : (valueA < valueB ? 1 : -1);
        });
        setArchivedUnits(sortedUnits);
    };

    const getSortIcon = (key) => {
        if (sortBy.key === key) {
            return sortBy.order === 'asc' ? <AiOutlineArrowUp /> : <AiOutlineArrowDown />;
        }
        return null;
    };

    const indexOfLastUnit = currentPage * unitsPerPage;
    const indexOfFirstUnit = indexOfLastUnit - unitsPerPage;
    const currentUnits = archivedUnits.slice(indexOfFirstUnit, indexOfLastUnit);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    return (
        <div className="container mt-4">
            <h1 className="mb-4">Archived Units</h1>

            <div className='d-flex justify-content-between align-items-center mb-3'>
                <div className="input-group" style={{ width: '25%' }}>
                    <input type="text" className="form-control" onChange={handleFilter} placeholder="Search Units" />
                </div>
                <Button 
                    variant="primary" 
                    onClick={() => navigate('/units')}
                    style={{ fontWeight: 'bold' }}
                >
                    Back to Units
                </Button>
            </div>

            <Table className="table-responsive">
                <thead>
                    <tr>
                        <th className="text-center">
                            <Form.Check type="checkbox" checked={selectAll} onChange={handleSelectAll} />
                        </th>
                        <th className="text-center" onClick={() => handleSort('unit_name')}>
                            Unit Name {getSortIcon('unit_name')}
                        </th>
                        <th className="text-center">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {currentUnits.map((unit) => (
                        <tr key={unit.id}>
                            <td className="text-center">
                                <Form.Check
                                    type="checkbox"
                                    checked={selectedUnits.includes(unit.id)}
                                    onChange={() => handleSelectUnit(unit.id)}
                                />
                            </td>
                            <td className="text-center">{unit.unit_name}</td>
                            <td className="text-center">
                                <Button variant="success" onClick={() => {
                                    setUnitIdToRestore(unit.id);
                                    setShowRestoreModal(true);
                                }}>
                                    <FaTrashRestore />
                                </Button>
                                <Button variant="danger" onClick={() => {
                                    setUnitIdToDelete(unit.id);
                                    setShowDeleteModal(true);
                                }}>
                                    <FaTrash />
                                </Button>
                            </td>
                        </tr>
                    ))}
                    {currentUnits.length === 0 && (
                        <tr>
                            <td colSpan="3" className="text-center">No archived units found.</td>
                        </tr>
                    )}
                </tbody>
            </Table>

            <Pagination>
                {Array.from({ length: Math.ceil(archivedUnits.length / unitsPerPage) }, (_, index) => (
                    <Pagination.Item key={index} active={index + 1 === currentPage} onClick={() => paginate(index + 1)}>
                        {index + 1}
                    </Pagination.Item>
                ))}
            </Pagination>

            {/* Restore and Delete Modals */}
            <Modal show={showRestoreModal} onHide={() => setShowRestoreModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Restore Unit</Modal.Title>
                </Modal.Header>
                <Modal.Body>Are you sure you want to restore this unit?</Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowRestoreModal(false)}>Cancel</Button>
                    <Button variant="success" onClick={restoreUnit}>Restore</Button>
                </Modal.Footer>
            </Modal>

            <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Delete Unit</Modal.Title>
                </Modal.Header>
                <Modal.Body>Are you sure you want to permanently delete this unit?</Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
                    <Button variant="danger" onClick={deleteUnit}>Delete Permanently</Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default ArchivedUnitsManagement;
