import React, { useEffect, useState } from 'react';
import { FaEdit, FaTrash } from 'react-icons/fa';
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
    const [sortBy, setSortBy] = useState({ key: 'id', order: 'desc' }); // Default to descending by ID
    const [showAddModal, setShowAddModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [categoryIdToDelete, setCategoryIdToDelete] = useState(null);
    const [editCategory, setEditCategory] = useState({});
    const [editLoading, setEditLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState(''); // Add error message state
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
        setErrorMessage(''); // Clear the error message
        setEditLoading(true);
    
        axios.get(`http://localhost:80/api/category.php/${categoryId}`)
            .then(response => {
                if (response.data && response.data.category) {
                    setEditCategory(response.data.category);
                    setEditLoading(false);
                    setShowEditModal(true);
                } else {
                    console.error('Error: Category not found');
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
    

    const getCategories = () => {
        axios.get('http://localhost:80/api/category.php/')
            .then(response => {
                console.log('API Response:', response.data); // Log the response
                if (Array.isArray(response.data.categories)) {
                    const fetchedCategories = response.data.categories;
                    const sortedCategories = sortCategories(fetchedCategories, 'id', 'desc'); // Sort by ID in descending order
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

    const deleteCategory = () => {
        axios.delete(`http://localhost:80/api/category.php/${categoryIdToDelete}`)
            .then(() => {
                getCategories();
                handleCloseDeleteModal();
                toast.success('Category deleted successfully!'); // Show success notification
            })
            .catch(error => {
                toast.error('Failed to delete category'); // Show error notification
            });
    };

    const archiveCategory = () => {
        if (!categoryIdToDelete) {
            toast.error('Invalid category ID.'); // Prevent sending an invalid request
            console.error('Invalid category ID:', categoryIdToDelete); // Log the invalid ID
            return;
        }
    
        console.log('Starting archive process for category ID:', categoryIdToDelete); // Log the start of the process
    
        // First, check if the category has any items in the inventory
        axios.get(`http://localhost:80/api/inventory.php?categoryId=${categoryIdToDelete}`)
            .then((response) => {
                console.log('Inventory check response:', response.data); // Log the inventory check response
    
                // Ensure the response contains the expected data
                if (!response.data || !response.data.inventory || !Array.isArray(response.data.inventory)) {
                    toast.error('Invalid response from server. Unable to check inventory.');
                    console.error('Invalid response:', response.data); // Log the invalid response
                    return;
                }
    
                // Calculate the total quantity from the inventory array
                const totalQuantity = response.data.inventory.reduce((sum, item) => sum + (item.quantity || 0), 0);
                console.log('Total quantity calculated:', totalQuantity); // Log the total quantity
    
                // Check if the category has items in the inventory
                if (totalQuantity > 0) {
                    toast.error(`Category cannot be archived because it has items in inventory. Total quantity: ${totalQuantity}`);                    return;
                }
    
                console.log('No items in inventory. Proceeding to archive category.'); // Log the decision to archive
    
                // If the inventory is empty, proceed to archive the category
                axios.put(`http://localhost:80/api/category.php/${categoryIdToDelete}`, {
                    id: categoryIdToDelete,
                    archived: 1
                })
                    .then((response) => {
                        console.log('Archive category response:', response.data); // Log the archive response
    
                        if (response.data.status === 1) {
                            getCategories(); // Refresh the categories list
                            handleCloseDeleteModal(); // Close the modal
                            toast.success('Category archived successfully!');
                            console.log('Category archived successfully:', categoryIdToDelete); // Log success
                        } else {
                            toast.error(response.data.message || 'Failed to archive category.');
                            console.error('Failed to archive category:', response.data.message); // Log failure
                        }
                    })
                    .catch((error) => {
                        console.error('Error archiving category:', error); // Log the error
                        toast.error('Failed to archive category.');
                    });
            })
            .catch((error) => {
                console.error('Error checking inventory:', error); // Log the error
                toast.error('Failed to check inventory.');
            });
    };
    
    const handleFilter = (event) => {
        const searchText = event.target.value.toLowerCase();
        const newData = originalCategories.filter(row => 
            String(row.name).toLowerCase().includes(searchText) ||
            String(row.created_by).toLowerCase().includes(searchText)
        );
        setCategories(searchText ? newData : originalCategories);
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
            setErrorMessage('Category name cannot be empty.');
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
                    toast.success('Category updated successfully!'); // Show success notification
                } else {
                    // If there's an error, set the error message to be displayed in the modal
                    setErrorMessage(response.data.message || 'Failed to update category');
                }
            })
            .catch((error) => {
                console.error('Error updating category:', error);
                setErrorMessage('Failed to update category. Please try again.');
            });
    };
    
    return (
        <div className='container mt-4'>
            <h1 style={{ textAlign: 'left', fontWeight: 'bold' }}>Category</h1>
            <div className='d-flex justify-content-between align-items-center'>
                <div className="input-group" style={{ width: '25%', marginBottom: '10px' }}>
                    <input type="text" className="form-control" onChange={handleFilter} placeholder="Search" />
                </div>
                {userRole !== 1 && (
                    <div className='text-end'>
                        <Button onClick={handleShowAddModal} className='btn btn-primary w-100'
                        style={{
                            backgroundImage: 'linear-gradient(to right, #006cb6, #31b44b)',
                            color: '#ffffff', // Text color
                            borderColor: '#006cb6', // Border color
                            fontWeight: 'bold'
                        }}>
                            Add Category
                        </Button>
                    </div>
                )}
            </div>

            {/* Table and other components */}
            <div className="table-responsive">
                <table className="table table-striped table-hover custom-table" style={{ width: '100%' }}>
                    <thead>
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
                            const recentIndex = index + 1; // Start numbering from 1 for the current page
                            return (
                                <tr key={category.id}>
                                    <td className="text-center">{recentIndex}</td>
                                    <td className="text-center">{category.name}</td>
                                    {userRole !== 1 && (
                                        <td className="text-center">
                                            <div className="d-flex justify-content-center align-items-center">
                                            <OverlayTrigger
            placement="top"
            overlay={<Tooltip id={`edit-tooltip-${category.id}`}>Edit</Tooltip>}
          >
                                                <Button 
                                                    onClick={() => handleShowEditModal(category.id)}
                                                    className="btn btn-primary me-2 col-4" 
                                                    style={{ fontSize: ".9rem" }}
                                                >
                                                    <FaEdit />
                                                </Button>
                                                </OverlayTrigger>

                                                <OverlayTrigger
            placement="top"
            overlay={<Tooltip id={`delete-tooltip-${category.id}`}>Delete</Tooltip>}
          >
                                                <Button 
                                                    onClick={() => handleShowDeleteModal(category.id)} 
                                                    className="btn btn-danger me-2 col-4" 
                                                    style={{ fontSize: ".9rem" }}
                                                >
                                                    <FaTrash />
                                                </Button>
                                                </OverlayTrigger>

                                            </div>
                                        </td>
                                    )}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <Pagination>
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
                errorMessage={errorMessage}  
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
