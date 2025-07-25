import React, { useEffect, useState } from 'react';
import { FaTrashRestore, FaTrash, FaSearch } from 'react-icons/fa';
import { AiOutlineArrowUp, AiOutlineArrowDown } from 'react-icons/ai';
import axios from 'axios';
import { Table, Button, Form, Modal, Pagination, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useNavigate } from 'react-router-dom';

const ArchivedInventoryManagement = () => {
    const [archivedInventory, setArchivedInventory] = useState([]);
    const [originalArchivedInventory, setOriginalArchivedInventory] = useState([]);
    const [selectedInventory, setSelectedInventory] = useState([]);
    const [sortBy, setSortBy] = useState({ key: '', order: '' });
    const [currentPage, setCurrentPage] = useState(1);
    const [inventoryPerPage, setInventoryPerPage] = useState(5);  
    const [inventoryIdToDelete, setInventoryIdToDelete] = useState(null);
    const [showRestoreModal, setShowRestoreModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [inventoryIdToRestore, setInventoryIdToRestore] = useState(null);
    const [selectAll, setSelectAll] = useState(false);

    const navigate = useNavigate();

    useEffect(() => {
        fetchArchivedInventory();
    }, []);

    const fetchArchivedInventory = () => {
        axios.get('http://localhost:80/api/inventory.php?archived=1')
            .then((response) => {
                const inventoryData = response.data.inventory || [];
                setArchivedInventory(inventoryData);
                setOriginalArchivedInventory(inventoryData);
            })
            .catch((error) => {
                console.error('Error fetching archived inventory:', error);
            });
    };

    const restoreInventory = () => {
        axios.put(`http://localhost:80/api/inventory.php/${inventoryIdToRestore}`, { 
            id: inventoryIdToRestore, 
            archived: 0 
        })
        .then(response => {
            if (response.data.status === 1) {
                fetchArchivedInventory();  
                setShowRestoreModal(false);
                toast.success('Inventory item restored successfully!');
            } else {
                toast.error(response.data.message || 'Failed to restore inventory item');
            }
        })
        .catch((error) => {
            console.error('Error restoring inventory item:', error);
            toast.error('Failed to restore inventory item');
        });
    };

    const deleteInventory = () => {
        axios.delete(`http://localhost:80/api/inventory.php/${inventoryIdToDelete}`)
            .then(() => {
                fetchArchivedInventory();
                setShowDeleteModal(false);
                toast.success('Inventory item deleted successfully!');
            })
            .catch(error => {
                console.error('Error deleting inventory item:', error);
                toast.error('Failed to delete inventory item');
            });
    };

    const handleSelectInventory = (id) => {
        setSelectedInventory(prev =>
            prev.includes(id) ? prev.filter(invId => invId !== id) : [...prev, id]
        );
    };

    const handleSelectAll = () => {
        if (!selectAll) {
            setSelectedInventory(archivedInventory.map(inv => inv.id));
        } else {
            setSelectedInventory([]);
        }
        setSelectAll(!selectAll);
    };

    const handleFilter = (event) => {
        const searchText = event.target.value.toLowerCase();
        const filteredData = originalArchivedInventory.filter(row =>
            row.barcode.toLowerCase().includes(searchText)
        );
        setArchivedInventory(searchText ? filteredData : originalArchivedInventory);
    };

    const handleSort = (key) => {
        let order = 'asc';
        if (sortBy.key === key && sortBy.order === 'asc') {
            order = 'desc';
        }
        setSortBy({ key, order });
        const sortedInventory = [...archivedInventory].sort((a, b) => {
            const valueA = typeof a[key] === 'string' ? a[key].toLowerCase() : a[key];
            const valueB = typeof b[key] === 'string' ? b[key].toLowerCase() : b[key];
            return order === 'asc' ? (valueA > valueB ? 1 : -1) : (valueA < valueB ? 1 : -1);
        });
        setArchivedInventory(sortedInventory);
    };

    const getSortIcon = (key) => {
        if (sortBy.key === key) {
            return sortBy.order === 'asc' ? <AiOutlineArrowUp /> : <AiOutlineArrowDown />;
        }
        return null;
    };

    const indexOfLastInventory = currentPage * inventoryPerPage;
    const indexOfFirstInventory = indexOfLastInventory - inventoryPerPage;
    const currentInventory = archivedInventory.slice(indexOfFirstInventory, indexOfLastInventory);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    return (
        <div className="container mt-4">
            <h1 className="mb-4">Archived Inventory</h1>

            <div className='d-flex justify-content-between align-items-center mb-3'>
                <div className="input-group" style={{ width: '25%' }}>
                    <input type="text" className="form-control" onChange={handleFilter} placeholder="Search Inventory" />
                </div>
                <Button 
                    variant="primary" 
                    onClick={() => navigate('/inventory')}
                    style={{ fontWeight: 'bold' }}
                >
                    Back to Inventory
                </Button>
            </div>

            {/* Table for displaying archived inventory */}
            <Table className="table-responsive">
                <thead>
                    <tr>
                        <th className="text-center">
                            <Form.Check type="checkbox" checked={selectAll} onChange={handleSelectAll} />
                        </th>
                        <th className="text-center" onClick={() => handleSort('barcode')}>
                            Barcode {getSortIcon('barcode')}
                        </th>
                        <th className="text-center" onClick={() => handleSort('quantity')}>
                            Quantity {getSortIcon('quantity')}
                        </th>
                        <th className="text-center" onClick={() => handleSort('price')}>
                            Price {getSortIcon('price')}
                        </th>
                        <th className="text-center">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {currentInventory.map((inventory) => (
                        <tr key={inventory.id}>
                            <td className="text-center">
                                <Form.Check
                                    type="checkbox"
                                    checked={selectedInventory.includes(inventory.id)}
                                    onChange={() => handleSelectInventory(inventory.id)}
                                />
                            </td>
                            <td className="text-center">{inventory.barcode}</td>
                            <td className="text-center">{inventory.quantity}</td>
                            <td className="text-center">{inventory.price}</td>
                            <td className="text-center">
                                <Button variant="success" onClick={() => {
                                    setInventoryIdToRestore(inventory.id);
                                    setShowRestoreModal(true);
                                }}>
                                    <FaTrashRestore />
                                </Button>
                                <Button variant="danger" onClick={() => {
                                    setInventoryIdToDelete(inventory.id);
                                    setShowDeleteModal(true);
                                }}>
                                    <FaTrash />
                                </Button>
                            </td>
                        </tr>
                    ))}
                    {currentInventory.length === 0 && (
                        <tr>
                            <td colSpan="5" className="text-center">No archived inventory found.</td>
                        </tr>
                    )}
                </tbody>
            </Table>

            <Pagination>
                {Array.from({ length: Math.ceil(archivedInventory.length / inventoryPerPage) }, (_, index) => (
                    <Pagination.Item key={index} active={index + 1 === currentPage} onClick={() => paginate(index + 1)}>
                        {index + 1}
                    </Pagination.Item>
                ))}
            </Pagination>

            {/* Restore and Delete Modals */}
            <Modal show={showRestoreModal} onHide={() => setShowRestoreModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Restore Inventory Item</Modal.Title>
                </Modal.Header>
                <Modal.Body>Are you sure you want to restore this inventory item?</Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowRestoreModal(false)}>Cancel</Button>
                    <Button variant="success" onClick={restoreInventory}>Restore</Button>
                </Modal.Footer>
            </Modal>

            <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Delete Inventory Item</Modal.Title>
                </Modal.Header>
                <Modal.Body>Are you sure you want to delete permanently this inventory item?</Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
                    <Button variant="danger" onClick={deleteInventory}>Delete</Button>
                </Modal.Footer>
            </Modal>

        </div>
    );
};

export default ArchivedInventoryManagement;
