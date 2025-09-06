import React, { useEffect, useState } from 'react';
import { FaArchive, FaEdit } from 'react-icons/fa';
import { AiOutlineArrowUp, AiOutlineArrowDown } from 'react-icons/ai';
import axios from "axios";
import { Pagination, Button, Modal, Tooltip, OverlayTrigger } from 'react-bootstrap';
import { ToastContainer, toast } from 'react-toastify'; // Import Toastify
import '../assets/table.css'; 
import AddCategoryModal from '../components/Add/AddCategoryModal';
import EditCategoryModal from '../components/Edit/EditCategoryModal';

const Category = () => {
    const [categories, setCategories] = useState([]);
    const [originalCategories, setOriginalCategories] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [categoriesPerPage, setCategoriesPerPage] = useState(5); 
    const [sortBy, setSortBy] = useState({ key: 'id', order: 'asc' }); // Default to descending by ID
    const [showAddModal, setShowAddModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [categoryIdToDelete, setCategoryIdToDelete] = useState(null);
    const [editCategory, setEditCategory] = useState({});
    const [editLoading, setEditLoading] = useState(true);
    const [userRole, setUserRole] = useState(null); // Store the user role

    useEffect(() => {
        const role = parseInt(localStorage.getItem('userRole'), 10);
        setUserRole(role);
        getCategories();
    }, []);

    const handleCloseAddModal = () => setShowAddModal(false);
    const handleShowAddModal = () => setShowAddModal(true);

    const handleCloseDeleteModal = () => setShowDeleteModal(false);
    const handleShowDeleteModal = (categoryId) => {
        setCategoryIdToDelete(categoryId);
        setShowDeleteModal(true);
    };

    const handleCloseEditModal = () => setShowEditModal(false);
    const handleShowEditModal = (categoryId) => {
        setEditLoading(true);
    
        axios.get(`http://localhost:80/api/category.php/${categoryId}`)
        .then(response => {
            if (response.data && response.data.id) {
                setEditCategory(response.data);
                setEditLoading(false);
                setShowEditModal(true);
            } else {
                toast.error('Category not found.');
                setEditLoading(false);
            }
        })

        .catch(error => {
            console.error('Error fetching category:', error);
            toast.error('Failed to fetch category.');
            setEditLoading(false);
        });
    };

    const IconButtonWithTooltip = ({ tooltip, children, ...props }) => (
        <OverlayTrigger placement="top" overlay={<Tooltip>{tooltip}</Tooltip>}>
            <Button {...props}>{children}</Button>
        </OverlayTrigger>
    );

    const getCategories = () => {
        axios.get('http://localhost:80/api/category.php/')
            .then(response => {
                console.log('API Response:', response.data); // Log the response
                if (Array.isArray(response.data.categories)) {
                    const fetchedCategories = response.data.categories;
                    const sortedCategories = sortCategories(fetchedCategories, 'id', 'asc');
                    setCategories(sortedCategories);
                    setOriginalCategories(fetchedCategories);
                } else {
                    console.error('Unexpected response structure: categories is not an array');
                }
            })
            .catch(error => {
                console.error('Error fetching categories:', error);
            });
    };

    const sortCategories = (categories, key, order) => {
        return [...categories].sort((a, b) => {
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

    const archiveCategory = () => {
        if (!categoryIdToDelete) {
            toast.error('Invalid category ID.');
            return;
        }

        console.log('Archiving category ID:', categoryIdToDelete);

        axios.put(`http://localhost:80/api/category.php/${categoryIdToDelete}`, {
            id: categoryIdToDelete,
            archived: 1
        })
        .then((response) => {
            console.log('Archive category response:', response.data);

            if (response.data.status === 1) {
                getCategories();
                handleCloseDeleteModal();
                toast.success('Category archived successfully!');
            } else {
                toast.error(response.data.message || 'Failed to archive category.');
            }
        })
        .catch((error) => {
            console.error('Error archiving category:', error);
            toast.error('Failed to archive category.');
        });
    };
    
    const handleFilter = (event) => {
        const searchText = event.target.value.toLowerCase();
        const newData = originalCategories.filter(row => 
            String(row.name).toLowerCase().includes(searchText) ||
            String(row.created_by).toLowerCase().includes(searchText)
        );

        const dataToSet = searchText ? newData : originalCategories;
        setCategories(sortCategories(dataToSet, sortBy.key, sortBy.order)); 
    };

    const indexOfLastCategory = currentPage * categoriesPerPage;
    const indexOfFirstCategory = indexOfLastCategory - categoriesPerPage;
    const currentCategories = categories.slice(indexOfFirstCategory, indexOfLastCategory);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    const handlePerPageChange = (e) => {
        setCurrentPage(1);
        setCategoriesPerPage(Number(e.target.value));
    };

    const handleSort = (key) => {
        let order = 'asc';
        if (sortBy.key === key && sortBy.order === 'asc') {
            order = 'desc';
        }
        setSortBy({ key: key, order: order });
        const sortedCategories = sortCategories(categories, key, order);
        setCategories(sortedCategories);
    };

    const getSortIcon = (key) => {
        if (sortBy.key === key) {
            return sortBy.order === 'asc' ? <AiOutlineArrowUp /> : <AiOutlineArrowDown />;
        }
        return null;
    };

    const handleCategoryAdded = () => {
        getCategories();
        toast.success('Category added successfully!'); // Show success notification
    };

    const handleEditChange = (event) => {
        const { name, value } = event.target;
        setEditCategory(prevCategory => ({ ...prevCategory, [name]: value }));
    };

    const handleEditSubmit = (event) => {
        event.preventDefault();
    
        if (editCategory.name.trim() === '') {
            toast.error('Category name cannot be empty.');
            return;
        }
    
        // Add updated_by with the userID from localStorage
        const updatedCategory = {
            ...editCategory,
            updated_by: localStorage.getItem('userID') || null // Ensure a valid userID is set
        };
    
        axios.put(`http://localhost:80/api/category.php/${editCategory.id}`, updatedCategory)
            .then((response) => {
                if (response.data.status === 1) {
                    handleCloseEditModal();
                    getCategories();
                    toast.success('Category updated successfully!');
                } else {
                    toast.error(response.data.message || 'Failed to update category');
                }
            })
            .catch((error) => {
                console.error('Error updating category:', error);
                toast.error('Failed to update category. Please try again.');
            });
    };
    
    return (
        <div className='container mt-2'>
            <h1 style={{ textAlign: 'left', fontWeight: 'bold' }}>Category</h1>
            <div className='d-flex justify-content-between align-items-center'>
                <div className="input-group" style={{ width: '25%' }}>
                    <input type="text" className="form-control shadow-sm" onChange={handleFilter} placeholder="Search" />
                </div>
                {userRole !== 1 && (
                    <div className='text-end'>
                        <Button onClick={handleShowAddModal} className='btn btn-primary w-100 btn-gradient'
                        style={{
                            backgroundImage: 'linear-gradient(to right, #006cb6, #31b44b)',
                            color: '#ffffff', // Text color
                            borderColor: '#006cb6', // Border color
                            fontWeight: 'bold',
                            marginBottom: '-10px',
                        }}>
                            Add Category
                        </Button>
                    </div>
                )}
            </div>

            {/* Table and other components */}
            <div className="table-responsive">
                <table className="table table-striped table-hover custom-table align-middle shadow-sm" style={{ width: '100%' }}>
                    <thead className="table-light">
                        <tr>
                            <th className="text-center" onClick={() => handleSort('id')}>
                                #
                                {getSortIcon('id')}
                            </th>
                            <th className="text-center" onClick={() => handleSort('name')}>
                                Name
                                {getSortIcon('name')}
                            </th>
                            {userRole !== 1 && (
                                <th className="text-center">Action</th>
                            )}
                        </tr>
                    </thead>
                    <tbody>
                        {currentCategories.map((category, index) => {
                            return (
                                <tr key={category.id}>
                                    <td className="text-center">{index + indexOfFirstCategory + 1}</td>
                                    <td className="text-center">{category.name}</td>
                                    {userRole !== 1 && (
                                        <td className="text-center">
                                            <div className="d-flex justify-content-center align-items-center">
                                            <IconButtonWithTooltip 
                                                tooltip="Edit" 
                                                onClick={() => handleShowEditModal(category.id)} 
                                                className="btn btn-primary me-2"
                                                >
                                                <FaEdit />
                                                </IconButtonWithTooltip>

                                                <IconButtonWithTooltip 
                                                tooltip="Archive" 
                                                onClick={() => handleShowDeleteModal(category.id)} 
                                                className="btn btn-warning"
                                                >
                                                <FaArchive />
                                            </IconButtonWithTooltip>
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            <div className="d-flex justify-content-between align-items-center">
            {/* Items per page selector (left) */}
                <div className="d-flex align-items-center">
                    <label className="me-2 fw-bold">Items per page:</label>
                    <select 
                        className="form-select form-select-sm shadow-sm" 
                        style={{ width: '80px' }} 
                        value={categoriesPerPage} 
                        onChange={handlePerPageChange}
                    >
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                    </select>
                </div>

                {/* Pagination */}
                <Pagination className='mb-0'>
                    {Array.from({ length: Math.ceil(categories.length / categoriesPerPage) }).map((_, index) => (
                        <Pagination.Item 
                            key={index + 1} 
                            active={currentPage === index + 1} 
                            onClick={() => paginate(index + 1)}
                        >
                            {index + 1}
                        </Pagination.Item>
                    ))}
                </Pagination>
            </div>

            {/* Modals */}
            <AddCategoryModal 
                show={showAddModal} 
                handleClose={handleCloseAddModal} 
                onCategoryAdded={handleCategoryAdded} 
            />
            <EditCategoryModal
                show={showEditModal}
                handleClose={handleCloseEditModal}
                editCategory={editCategory}
                editLoading={editLoading}
                handleEditChange={handleEditChange}
                handleEditSubmit={handleEditSubmit}
            />

        <Modal show={showDeleteModal} onHide={handleCloseDeleteModal}>
            <Modal.Header closeButton>
                <Modal.Title>Archive Category</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                Are you sure you want to archive this category? All products under this category will also be archived.
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={handleCloseDeleteModal}>
                    Close
                </Button>
                <Button variant="warning" onClick={() => archiveCategory(categoryIdToDelete, 1)}>
                    Archive
                </Button>
            </Modal.Footer>
        </Modal>

        </div>
    );
};

export default Category;
