import React, { useEffect, useState } from 'react';
import { FaTrashRestore, FaTrash } from 'react-icons/fa';
import { AiOutlineArrowUp, AiOutlineArrowDown } from 'react-icons/ai';
import axios from 'axios';
import { Table, Button, Form, Modal, Pagination, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useNavigate } from 'react-router-dom';

const ArchivedCategoriesManagement = () => {
    const [archivedCategories, setArchivedCategories] = useState([]);
    const [originalArchivedCategories, setOriginalArchivedCategories] = useState([]);
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [sortBy, setSortBy] = useState({ key: '', order: '' });
    const [currentPage, setCurrentPage] = useState(1);
    const [categoriesPerPage, setCategoriesPerPage] = useState(5);  
    const [categoryIdToDelete, setCategoryIdToDelete] = useState(null);
    const [showRestoreModal, setShowRestoreModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [categoryIdToRestore, setCategoryIdToRestore] = useState(null); 
    const [selectAll, setSelectAll] = useState(false);

    const navigate = useNavigate();

    useEffect(() => {
        fetchArchivedCategories();
    }, []);

    const fetchArchivedCategories = () => {
        axios.get('http://localhost:80/api/category.php?archived=1')
            .then((response) => {
                const categoriesData = response.data.categories || [];
                setArchivedCategories(categoriesData);
                setOriginalArchivedCategories(categoriesData);
            })
            .catch((error) => {
                console.error('Error fetching archived categories:', error);
            });
    };

    const restoreCategory = () => {
        const url = `http://localhost:80/api/categories.php`;
        
        axios.put(url, {
            id: categoryIdToRestore, 
            archived: 0
        })
        .then(response => {
            if (response.data.status === 1) {
                fetchArchivedCategories();
                setShowRestoreModal(false);
                toast.success('Category restored successfully!');
            } else {
                toast.error(response.data.message || 'Failed to restore category');
            }
        })
        .catch((error) => {
            console.error('Error restoring category:', error);
            toast.error('Failed to restore category');
        });
    };

    const deleteCategory = () => {
        axios.delete(`http://localhost:80/api/categories.php/${categoryIdToDelete}`)
            .then(() => {
                fetchArchivedCategories();
                setShowDeleteModal(false);
                toast.success('Category deleted successfully!');
            })
            .catch(error => {
                console.error('Error deleting category:', error);
                toast.error('Failed to delete category');
            });
    };

    const handleSelectCategory = (id) => {
        setSelectedCategories(prev =>
            prev.includes(id) ? prev.filter(cid => cid !== id) : [...prev, id]
        );
    };

    const handleSelectAll = () => {
        if (!selectAll) {
            setSelectedCategories(archivedCategories.map(c => c.id));
        } else {
            setSelectedCategories([]);
        }
        setSelectAll(!selectAll);
    };

    const handleFilter = (event) => {
        const searchText = event.target.value.toLowerCase();
        const filteredData = originalArchivedCategories.filter(row =>
            row.name.toLowerCase().includes(searchText)
        );
        setArchivedCategories(searchText ? filteredData : originalArchivedCategories);
    };

    const handleSort = (key) => {
        let order = 'asc';
        if (sortBy.key === key && sortBy.order === 'asc') {
            order = 'desc';
        }
        setSortBy({ key, order });
        const sortedCategories = [...archivedCategories].sort((a, b) => {
            const valueA = typeof a[key] === 'string' ? a[key].toLowerCase() : a[key];
            const valueB = typeof b[key] === 'string' ? b[key].toLowerCase() : b[key];
            return order === 'asc' ? (valueA > valueB ? 1 : -1) : (valueA < valueB ? 1 : -1);
        });
        setArchivedCategories(sortedCategories);
    };

    const getSortIcon = (key) => {
        if (sortBy.key === key) {
            return sortBy.order === 'asc' ? <AiOutlineArrowUp /> : <AiOutlineArrowDown />;
        }
        return null;
    };

    const indexOfLastCategory = currentPage * categoriesPerPage;
    const indexOfFirstCategory = indexOfLastCategory - categoriesPerPage;
    const currentCategories = archivedCategories.slice(indexOfFirstCategory, indexOfLastCategory);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    return (
        <div className="container mt-4">
            <h1 className="mb-4">Archived Categories</h1>

            <div className='d-flex justify-content-between align-items-center mb-3'>
                <div className="input-group" style={{ width: '25%' }}>
                    <input type="text" className="form-control" onChange={handleFilter} placeholder="Search Categories" />
                </div>
                <Button 
                    variant="primary" 
                    onClick={() => navigate('/category')}
                    style={{ fontWeight: 'bold' }}
                >
                    Back to Categories
                </Button>
            </div>

            <Table className="table-responsive">
                <thead>
                    <tr>
                        <th className="text-center">
                            <Form.Check type="checkbox" checked={selectAll} onChange={handleSelectAll} />
                        </th>
                        <th className="text-center" onClick={() => handleSort('name')}>
                            Category Name {getSortIcon('name')}
                        </th>
                        <th className="text-center">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {currentCategories.map((category) => (
                        <tr key={category.id}>
                            <td className="text-center">
                                <Form.Check
                                    type="checkbox"
                                    checked={selectedCategories.includes(category.id)}
                                    onChange={() => handleSelectCategory(category.id)}
                                />
                            </td>
                            <td className="text-center">{category.name}</td>
                            <td className="text-center">
                                <Button variant="success" onClick={() => {
                                    setCategoryIdToRestore(category.id);
                                    setShowRestoreModal(true);
                                }}>
                                    <FaTrashRestore />
                                </Button>
                                <Button variant="danger" onClick={() => {
                                    setCategoryIdToDelete(category.id);
                                    setShowDeleteModal(true);
                                }}>
                                    <FaTrash />
                                </Button>
                            </td>
                        </tr>
                    ))}
                    {currentCategories.length === 0 && (
                        <tr>
                            <td colSpan="3" className="text-center">No archived categories found.</td>
                        </tr>
                    )}
                </tbody>
            </Table>

            <Pagination>
                {Array.from({ length: Math.ceil(archivedCategories.length / categoriesPerPage) }, (_, index) => (
                    <Pagination.Item key={index} active={index + 1 === currentPage} onClick={() => paginate(index + 1)}>
                        {index + 1}
                    </Pagination.Item>
                ))}
            </Pagination>

            {/* Restore and Delete Modals */}
            <Modal show={showRestoreModal} onHide={() => setShowRestoreModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Restore Category</Modal.Title>
                </Modal.Header>
                <Modal.Body>Are you sure you want to restore this category?</Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowRestoreModal(false)}>
                        Cancel
                    </Button>
                    <Button variant="success" onClick={restoreCategory}>
                        Restore
                    </Button>
                </Modal.Footer>
            </Modal>

            <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Delete Category</Modal.Title>
                </Modal.Header>
                <Modal.Body>Are you sure you want to permanently delete this category?</Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
                        Cancel
                    </Button>
                    <Button variant="danger" onClick={deleteCategory}>
                        Delete Permanently
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default ArchivedCategoriesManagement;
