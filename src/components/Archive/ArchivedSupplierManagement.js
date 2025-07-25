import React, { useEffect, useState } from 'react';
import { FaTrashRestore, FaTrash, FaSearch } from 'react-icons/fa';
import { AiOutlineArrowUp, AiOutlineArrowDown } from 'react-icons/ai';
import axios from 'axios';
import { Table, Button, Form, Modal, Pagination, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useNavigate } from 'react-router-dom';

const ArchivedSupplierManagement = () => {
    const [archivedSuppliers, setArchivedSuppliers] = useState([]);
    const [originalArchivedSuppliers, setOriginalArchivedSuppliers] = useState([]);
    const [selectedSuppliers, setSelectedSuppliers] = useState([]);
    const [sortBy, setSortBy] = useState({ key: '', order: '' });
    const [currentPage, setCurrentPage] = useState(1);
    const [suppliersPerPage, setSuppliersPerPage] = useState(5);  
    const [supplierIdToDelete, setSupplierIdToDelete] = useState(null);
    const [showRestoreModal, setShowRestoreModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [supplierId, setSupplierId] = useState(null);
    const [selectAll, setSelectAll] = useState(false);
    const [supplierIdToRestore, setSupplierIdToRestore] = useState(null); // Track supplier to restore
    
    const navigate = useNavigate();

    useEffect(() => {
        fetchArchivedSuppliers();
    }, []);

    const fetchArchivedSuppliers = () => {
        axios.get('http://localhost:80/api/suppliers.php?archived=1')
            .then((response) => {
                const suppliersData = response.data.suppliers || [];
                setArchivedSuppliers(suppliersData);
                setOriginalArchivedSuppliers(suppliersData);
            })
            .catch((error) => {
                console.error('Error fetching archived suppliers:', error);
            });
    };


    const restoreSupplier = () => {
        const dataToSend = { archived: 0 }; // Data being sent to the server
    
        // Ensure the correct URL format
        const url = `http://localhost:80/api/suppliers.php/${supplierIdToRestore}`;
    
        axios.put(url, dataToSend) // PUT request to correct URL with ID in the URL path
            .then((response) => {
                fetchArchivedSuppliers();
                setShowRestoreModal(false);
                toast.success('Supplier restored successfully!');
            })
            .catch((error) => {
                // Log the full error response for debugging
                console.error('Error during restore request:', error.response || error);
                toast.error('Failed to restore supplier');
            });
    };



    const deleteSupplier = () => {
        axios.delete(`http://localhost:80/api/suppliers.php/${supplierIdToDelete}`)
            .then(() => {
                fetchArchivedSuppliers();
                setShowDeleteModal();
                toast.success('Supplier deleted successfully!'); // Show success notification
            })
            .catch(error => {
                toast.error('Failed to delete supplier'); // Show error notification
            });
    };

    const handleSelectSupplier = (id) => {
        setSelectedSuppliers(prev =>
            prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]
        );
    };

    const handleSelectAll = () => {
        if (!selectAll) {
            setSelectedSuppliers(archivedSuppliers.map(s => s.id));
        } else {
            setSelectedSuppliers([]);
        }
        setSelectAll(!selectAll);
    };

    const handleFilter = (event) => {
        const searchText = event.target.value.toLowerCase();
        const filteredData = originalArchivedSuppliers.filter(row =>
            row.supplier_name.toLowerCase().includes(searchText) ||
            row.contact_person.toLowerCase().includes(searchText) ||
            row.contact_number.toLowerCase().includes(searchText) ||
            row.email.toLowerCase().includes(searchText) ||
            row.address.toLowerCase().includes(searchText)
        );
        setArchivedSuppliers(searchText ? filteredData : originalArchivedSuppliers);
    };

    const handleSort = (key) => {
        let order = 'asc';
        if (sortBy.key === key && sortBy.order === 'asc') {
            order = 'desc';
        }
        setSortBy({ key, order });
        const sortedSuppliers = [...archivedSuppliers].sort((a, b) => {
            const valueA = typeof a[key] === 'string' ? a[key].toLowerCase() : a[key];
            const valueB = typeof b[key] === 'string' ? b[key].toLowerCase() : b[key];
            return order === 'asc' ? (valueA > valueB ? 1 : -1) : (valueA < valueB ? 1 : -1);
        });
        setArchivedSuppliers(sortedSuppliers);
    };

    const getSortIcon = (key) => {
        if (sortBy.key === key) {
            return sortBy.order === 'asc' ? <AiOutlineArrowUp /> : <AiOutlineArrowDown />;
        }
        return null;
    };

    const indexOfLastSupplier = currentPage * suppliersPerPage;
    const indexOfFirstSupplier = indexOfLastSupplier - suppliersPerPage;
    const currentSuppliers = archivedSuppliers.slice(indexOfFirstSupplier, indexOfLastSupplier);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    return (
        <div className="container mt-4">
            <h1 className="mb-4">Archived Suppliers</h1>

            <div className='d-flex justify-content-between align-items-center mb-3'>
                <div className="input-group" style={{ width: '25%' }}>
                    <input type="text" className="form-control" onChange={handleFilter} placeholder="Search Suppliers" />
                </div>
                <Button 
                    variant="primary" 
                    onClick={() => navigate('/suppliers')}
                    style={{ fontWeight: 'bold' }}
                >
                    Back to Suppliers
                </Button>
            </div>

            <div className="table-responsive">
            <table className="table table-striped table-hover custom-table" style={{ width: '100%' }}>
            <thead>
                        <tr>
                            <th className="text-center">
                                <Form.Check type="checkbox" checked={selectAll} onChange={handleSelectAll} />
                            </th>
                            <th className="text-center" onClick={() => handleSort('supplier_name')}>
                                Supplier Name {getSortIcon('supplier_name')}
                            </th>
                            <th className="text-center" onClick={() => handleSort('contact_person')}>
                                Contact Person {getSortIcon('contact_person')}
                            </th>
                            <th className="text-center" onClick={() => handleSort('contact_number')}>
                                Contact Number {getSortIcon('contact_number')}
                            </th>
                            <th className="text-center" onClick={() => handleSort('email')}>
                                Email {getSortIcon('email')}
                            </th>
                            <th className="text-center" onClick={() => handleSort('address')}>
                                Address {getSortIcon('address')}
                            </th>
                            <th className="text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentSuppliers.length > 0 ? currentSuppliers.map((supplier) => (
                            <tr key={supplier.id}>
                                <td className="text-center">
                                    <Form.Check
                                        type="checkbox"
                                        checked={selectedSuppliers.includes(supplier.id)}
                                        onChange={() => handleSelectSupplier(supplier.id)}
                                    />
                                </td>
                                <td className="text-center">{supplier.supplier_name}</td>
                                <td className="text-center">{supplier.contact_person}</td>
                                <td className="text-center">{supplier.contact_number}</td>
                                <td className="text-center">{supplier.email}</td>
                                <td className="text-center">{supplier.address}</td>
                                {/* Restore & Delete Buttons in Table */}
                                <td className="text-center">
                                    <OverlayTrigger placement="top" overlay={<Tooltip>Restore</Tooltip>}>
                                        <Button 
                                            variant="success" 
                                            className="me-2" 
                                            onClick={() => { 
                                                setSupplierIdToRestore(supplier.id); // Correctly set supplier ID for restore
                                                setShowRestoreModal(true); 
                                            }}
                                        >
                                            <FaTrashRestore />
                                        </Button>
                                    </OverlayTrigger>
                                    <OverlayTrigger placement="top" overlay={<Tooltip>Delete</Tooltip>}>
                                        <Button 
                                            variant="danger" 
                                            onClick={() => { 
                                                setSupplierIdToDelete(supplier.id); // Correctly set supplier ID
                                                setShowDeleteModal(true); 
                                            }}
                                        >
                                            <FaTrash />
                                        </Button>
                                    </OverlayTrigger>
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan="7" className="text-center">No archived suppliers found.</td>
                            </tr>
                        )}
                    </tbody>
                    </table>
                    </div>

            <Pagination>
                {Array.from({ length: Math.ceil(archivedSuppliers.length / suppliersPerPage) }, (_, index) => (
                    <Pagination.Item key={index} active={index + 1 === currentPage} onClick={() => paginate(index + 1)}>
                        {index + 1}
                    </Pagination.Item>
                ))}
            </Pagination>

{/* Restore Modal */}
<Modal show={showRestoreModal} onHide={() => setShowRestoreModal(false)}>
    <Modal.Header closeButton>
        <Modal.Title>Restore Supplier</Modal.Title>
    </Modal.Header>
    <Modal.Body>Are you sure you want to restore this supplier?</Modal.Body>
    <Modal.Footer>
        <Button variant="secondary" onClick={() => setShowRestoreModal(false)}>
            Cancel
        </Button>
        <Button 
            variant="success" 
            onClick={() => {
                restoreSupplier(); // Use correct function
                setShowRestoreModal(false);
            }}
        >
            Restore
        </Button>
    </Modal.Footer>
</Modal>

{/* Delete Modal */}
<Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
    <Modal.Header closeButton>
        <Modal.Title>Delete Supplier</Modal.Title>
    </Modal.Header>
    <Modal.Body>Are you sure you want to permanently delete this supplier?</Modal.Body>
    <Modal.Footer>
        <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
        </Button>
        <Button 
            variant="danger" 
            onClick={() => {
                deleteSupplier(); // Use correct function
                setShowDeleteModal(false);
            }}
        >
            Delete Permanently
        </Button>
    </Modal.Footer>
</Modal>

        </div>
        
    );
};

export default ArchivedSupplierManagement;
