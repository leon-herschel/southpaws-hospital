import React, { useEffect, useState } from 'react';
import { FaTrashRestore, FaTrash, FaSearch } from 'react-icons/fa';
import { AiOutlineArrowUp, AiOutlineArrowDown } from 'react-icons/ai';
import axios from 'axios';
import { Table, Button, Form, Modal, Pagination, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useNavigate } from 'react-router-dom';

const ArchivedBrandManagement = () => {
    const [archivedBrands, setArchivedBrands] = useState([]);
    const [originalArchivedBrands, setOriginalArchivedBrands] = useState([]);
    const [selectedBrands, setSelectedBrands] = useState([]);
    const [sortBy, setSortBy] = useState({ key: '', order: '' });
    const [currentPage, setCurrentPage] = useState(1);
    const [brandsPerPage, setBrandsPerPage] = useState(5);  
    const [brandIdToDelete, setBrandIdToDelete] = useState(null);
    const [showRestoreModal, setShowRestoreModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [brandId, setBrandId] = useState(null);
    const [selectAll, setSelectAll] = useState(false);
    const [brandIdToRestore, setBrandIdToRestore] = useState(null); // Track brand to restore
    
    const navigate = useNavigate();

    useEffect(() => {
        fetchArchivedBrands();
    }, []);

    const fetchArchivedBrands = () => {
        axios.get('http://localhost:80/api/brands.php?archived=1')
            .then((response) => {
                const brandsData = response.data.brands || [];
                setArchivedBrands(brandsData);
                setOriginalArchivedBrands(brandsData);
            })
            .catch((error) => {
                console.error('Error fetching archived brands:', error);
            });
    };

    const restoreBrand = () => {
        // The URL does not include the brand ID in this setup
        const url = `http://localhost:80/api/brands.php`;
        
        axios.put(url, {
            id: brandIdToRestore, 
            archived: 0
        })
        .then(response => {
            console.log("Response received:", response.data);  // Log response data
            if (response.data.status === 1) {
                fetchArchivedBrands();  // Re-fetch the brands list to see the changes
                setShowRestoreModal(false);  // Close the modal
                toast.success('Brand restored successfully!');
            } else {
                toast.error(response.data.message || 'Failed to restore brand');
            }
        })
        .catch((error) => {
            console.error('Error restoring brand:', error);
            toast.error('Failed to restore brand');
        });
    };
    
    
    
    const deleteBrand = () => {
        axios.delete(`http://localhost:80/api/brands.php/${brandIdToDelete}`)
            .then(() => {
                fetchArchivedBrands();
                setShowDeleteModal(false);
                toast.success('Brand deleted successfully!');
            })
            .catch(error => {
                console.error('Error deleting brand:', error);
                toast.error('Failed to delete brand');
            });
    };

    const handleSelectBrand = (id) => {
        setSelectedBrands(prev =>
            prev.includes(id) ? prev.filter(bid => bid !== id) : [...prev, id]
        );
    };

    const handleSelectAll = () => {
        if (!selectAll) {
            setSelectedBrands(archivedBrands.map(b => b.id));
        } else {
            setSelectedBrands([]);
        }
        setSelectAll(!selectAll);
    };

    const handleFilter = (event) => {
        const searchText = event.target.value.toLowerCase();
        const filteredData = originalArchivedBrands.filter(row =>
            row.name.toLowerCase().includes(searchText)
        );
        setArchivedBrands(searchText ? filteredData : originalArchivedBrands);
    };

    const handleSort = (key) => {
        let order = 'asc';
        if (sortBy.key === key && sortBy.order === 'asc') {
            order = 'desc';
        }
        setSortBy({ key, order });
        const sortedBrands = [...archivedBrands].sort((a, b) => {
            const valueA = typeof a[key] === 'string' ? a[key].toLowerCase() : a[key];
            const valueB = typeof b[key] === 'string' ? b[key].toLowerCase() : b[key];
            return order === 'asc' ? (valueA > valueB ? 1 : -1) : (valueA < valueB ? 1 : -1);
        });
        setArchivedBrands(sortedBrands);
    };

    const getSortIcon = (key) => {
        if (sortBy.key === key) {
            return sortBy.order === 'asc' ? <AiOutlineArrowUp /> : <AiOutlineArrowDown />;
        }
        return null;
    };

    const indexOfLastBrand = currentPage * brandsPerPage;
    const indexOfFirstBrand = indexOfLastBrand - brandsPerPage;
    const currentBrands = archivedBrands.slice(indexOfFirstBrand, indexOfLastBrand);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    return (
        <div className="container mt-4">
            <h1 className="mb-4">Archived Brands</h1>

            <div className='d-flex justify-content-between align-items-center mb-3'>
                <div className="input-group" style={{ width: '25%' }}>
                    <input type="text" className="form-control" onChange={handleFilter} placeholder="Search Brands" />
                </div>
                <Button 
                    variant="primary" 
                    onClick={() => navigate('/brand')}
                    style={{ fontWeight: 'bold' }}
                >
                    Back to Brands
                </Button>
            </div>

            {/* Table for displaying archived brands */}
            <Table className="table-responsive">
                <thead>
                    <tr>
                        <th className="text-center">
                            <Form.Check type="checkbox" checked={selectAll} onChange={handleSelectAll} />
                        </th>
                        <th className="text-center" onClick={() => handleSort('name')}>
                            Brand Name {getSortIcon('name')}
                        </th>
                        <th className="text-center">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {currentBrands.map((brand) => (
                        <tr key={brand.id}>
                            <td className="text-center">
                                <Form.Check
                                    type="checkbox"
                                    checked={selectedBrands.includes(brand.id)}
                                    onChange={() => handleSelectBrand(brand.id)}
                                />
                            </td>
                            <td className="text-center">{brand.name}</td>
                            <td className="text-center">
                                <Button variant="success" onClick={() => {
                                    setBrandIdToRestore(brand.id);
                                    setShowRestoreModal(true);
                                }}>
                                    <FaTrashRestore />
                                </Button>
                                <Button variant="danger" onClick={() => {
                                    setBrandIdToDelete(brand.id);
                                    setShowDeleteModal(true);
                                }}>
                                    <FaTrash />
                                </Button>
                            </td>
                        </tr>
                    ))}
                    {currentBrands.length === 0 && (
                        <tr>
                            <td colSpan="3" className="text-center">No archived brands found.</td>
                        </tr>
                    )}
                </tbody>
            </Table>

            <Pagination>
                {Array.from({ length: Math.ceil(archivedBrands.length / brandsPerPage) }, (_, index) => (
                    <Pagination.Item key={index} active={index + 1 === currentPage} onClick={() => paginate(index + 1)}>
                        {index + 1}
                    </Pagination.Item>
                ))}
            </Pagination>

            {/* Restore and Delete Modals */}
            <Modal show={showRestoreModal} onHide={() => setShowRestoreModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Restore Brand</Modal.Title>
                </Modal.Header>
                <Modal.Body>Are you sure you want to restore this brand?</Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowRestoreModal(false)}>
                        Cancel
                    </Button>
                    <Button variant="success" onClick={restoreBrand}>
                        Restore
                    </Button>
                </Modal.Footer>
            </Modal>

            <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Delete Brand</Modal.Title>
                </Modal.Header>
                <Modal.Body>Are you sure you want to permanently delete this brand?</Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
                        Cancel
                    </Button>
                    <Button variant="danger" onClick={deleteBrand}>
                        Delete Permanently
                    </Button>
                </Modal.Footer>
            </Modal>

        </div>
    );
};

export default ArchivedBrandManagement;
