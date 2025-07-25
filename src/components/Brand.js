import React, { useEffect, useState } from 'react';
import { FaEdit, FaTrash } from 'react-icons/fa';
import { AiOutlineArrowUp, AiOutlineArrowDown } from 'react-icons/ai';
import axios from "axios";
import { Pagination, Button, Modal, Tooltip, OverlayTrigger } from 'react-bootstrap';
import { ToastContainer, toast } from 'react-toastify'; // Import Toastify
import '../assets/table.css'; 
import AddBrandModal from '../components/Add/AddBrandModal';
import EditBrandModal from '../components/Edit/EditBrandModal';

const Brand = () => {
    const [brands, setBrands] = useState([]);
    const [originalBrands, setOriginalBrands] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [brandsPerPage, setBrandsPerPage] = useState(5); 
    const [sortBy, setSortBy] = useState({ key: 'id', order: 'desc' }); // Default to descending by ID
    const [showAddModal, setShowAddModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [brandIdToDelete, setBrandIdToDelete] = useState(null);
    const [editBrand, setEditBrand] = useState({});
    const [editLoading, setEditLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState(''); // Add error message state
    const [userRole, setUserRole] = useState(null); // Store the user role

    useEffect(() => {
        const role = parseInt(localStorage.getItem('userRole'), 10);
        setUserRole(role);
        getBrands();
    }, []);

    const handleCloseAddModal = () => setShowAddModal(false);
    const handleShowAddModal = () => setShowAddModal(true);

    const handleCloseDeleteModal = () => setShowDeleteModal(false);
    const handleShowDeleteModal = (brandId) => {
        setBrandIdToDelete(brandId);
        setShowDeleteModal(true);
    };

    const handleCloseEditModal = () => setShowEditModal(false);

    const handleShowEditModal = (brandId) => {
        setErrorMessage(''); // Clear the error message
        setEditLoading(true);
    
        axios.get(`http://localhost:80/api/brands.php/${brandId}`)
            .then(response => {
                const brandData = response.data.brand || response.data.brands || null; // Handle correct response structure
    
                if (brandData && brandData.id) {
                    setEditBrand(brandData);
                    setEditLoading(false);
                    setShowEditModal(true);
                } else {
                    console.error('Error: Brand not found');
                    setEditLoading(false);
                }
            })
            .catch(error => {
                console.error('Error fetching brand:', error);
                setEditLoading(false);
            });
    };
    

    const getBrands = () => {
        axios.get('http://localhost:80/api/brands.php/')
            .then(response => {
                if (Array.isArray(response.data.brands)) {
                    const fetchedBrands = response.data.brands;
                    const sortedBrands = sortBrands(fetchedBrands, 'id', 'desc'); // Sort by ID in descending order
                    setBrands(sortedBrands);
                    setOriginalBrands(fetchedBrands);
                } else {
                    console.error('Unexpected response structure: brands is not an array');
                }
            })
            .catch(error => {
                console.error('Error fetching brands:', error);
            });
    };

    const sortBrands = (brands, key, order) => {
        return [...brands].sort((a, b) => {
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

    const deleteBrand = () => {
        axios.delete(`http://localhost:80/api/brands.php/${brandIdToDelete}`)
            .then(() => {
                getBrands();
                handleCloseDeleteModal();
                toast.success('Brand deleted successfully!'); // Show success notification
            })
            .catch(error => {
                toast.error('Failed to delete brand'); // Show error notification
            });
    };

    const handleFilter = (event) => {
        const searchText = event.target.value.toLowerCase();
        const newData = originalBrands.filter(row => 
            String(row.name).toLowerCase().includes(searchText) ||
            String(row.created_by).toLowerCase().includes(searchText)
        );
        setBrands(searchText ? newData : originalBrands);
    };

    const indexOfLastBrand = currentPage * brandsPerPage;
    const indexOfFirstBrand = indexOfLastBrand - brandsPerPage;
    const currentBrands = brands.slice(indexOfFirstBrand, indexOfLastBrand);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    const handlePerPageChange = (e) => {
        setCurrentPage(1);
        setBrandsPerPage(Number(e.target.value));
    };

    const handleSort = (key) => {
        let order = 'asc';
        if (sortBy.key === key && sortBy.order === 'asc') {
            order = 'desc';
        }
        setSortBy({ key: key, order: order });
        const sortedBrands = sortBrands(brands, key, order);
        setBrands(sortedBrands);
    };

    const getSortIcon = (key) => {
        if (sortBy.key === key) {
            return sortBy.order === 'asc' ? <AiOutlineArrowUp /> : <AiOutlineArrowDown />;
        }
        return null;
    };

    const handleBrandAdded = () => {
        getBrands();
        toast.success('Brand added successfully!'); // Show success notification
    };

    const handleEditChange = (event) => {
        const { name, value } = event.target;
        setEditBrand(prevBrand => ({ ...prevBrand, [name]: value }));
    };

    const archiveBrand = () => {
        if (!brandIdToDelete) {
            toast.error('Invalid brand ID.'); // Prevent sending an invalid request
            return;
        }
    
        axios.put(`http://localhost:80/api/brands.php/${brandIdToDelete}`, { 
            id: brandIdToDelete, 
            archived: 1 
        })
        .then((response) => {
            if (response.data.status === 1) {
                getBrands();
                handleCloseDeleteModal();
                toast.success('Brand archived successfully!');
            } else {
                toast.error(response.data.message || 'Failed to archive brand');
            }
        })
        .catch((error) => {
            console.error('Error archiving brand:', error);
            toast.error('Failed to archive brand.');
        });
    };
    

    const handleEditSubmit = (event) => {
        event.preventDefault();
    
        // Set updated_by from localStorage before sending
        const updatedBrand = {
            ...editBrand,
            updated_by: localStorage.getItem('userID', 10) // Assuming 'userID' is the correct key
        };
    
        if (updatedBrand.name === '') {
            setErrorMessage('Brand name cannot be empty.');
            return;
        }
    
        axios.put(`http://localhost:80/api/brands.php/${updatedBrand.id}`, updatedBrand)
            .then((response) => {
                if (response.data.status === 1) {
                    handleCloseEditModal();
                    getBrands();
                    toast.success('Brand updated successfully!'); // Show success notification
                } else {
                    setErrorMessage(response.data.message || 'Failed to update brand');
                }
            })
            .catch((error) => {
                console.error('Error updating brand:', error);
                setErrorMessage('Failed to update brand. Please try again.');
            });
    };
    


    return (
        <div className='container mt-4'>
            <h1 style={{ textAlign: 'left', fontWeight: 'bold' }}>Brand</h1>
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
                            Add Brand
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
                        {currentBrands.map((brand, index) => {
                            const recentIndex = index + 1; // Start numbering from 1 for the current page
                            return (
                                <tr key={brand.id}>
                                    <td className="text-center">{recentIndex}</td>
                                    <td className="text-center">{brand.name}</td>
                                    {userRole !== 1 && (
                                        <td className="text-center">
                                            <OverlayTrigger placement="top" overlay={<Tooltip>Edit</Tooltip>}>
                                                <Button 
                                                    onClick={() => handleShowEditModal(brand.id)}
                                                    className="btn btn-primary me-2 col-4" 
                                                    style={{ fontSize: ".9rem" }}
                                                >
                                                    <FaEdit />
                                                </Button>
                                            </OverlayTrigger>
                                            <OverlayTrigger placement="top" overlay={<Tooltip>Delete</Tooltip>}>
                                                <Button 
                                                    onClick={() => handleShowDeleteModal(brand.id)} 
                                                    className="btn btn-danger me-2 col-4" 
                                                    style={{ fontSize: ".9rem" }}
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

            <Pagination>
                {Array.from({ length: Math.ceil(brands.length / brandsPerPage) }, (_, index) => (
                    <Pagination.Item key={index + 1} active={index + 1 === currentPage} onClick={() => paginate(index + 1)}>
                        {index + 1}
                    </Pagination.Item>
                ))}
            </Pagination>
            <AddBrandModal show={showAddModal} handleClose={handleCloseAddModal} onBrandAdded={handleBrandAdded} />
            <EditBrandModal
                show={showEditModal}
                handleClose={handleCloseEditModal}
                editUnit={editBrand}
                editLoading={editLoading}
                handleEditChange={handleEditChange}
                handleEditSubmit={handleEditSubmit}
                errorMessage={errorMessage}  
            />            
            <Modal show={showDeleteModal} onHide={handleCloseDeleteModal} backdrop="static" keyboard={false}>
    <Modal.Header closeButton>
        <Modal.Title>Archive Brand</Modal.Title>
    </Modal.Header>
    <Modal.Body>Are you sure you want to archive this brand?</Modal.Body>
    <Modal.Footer>
        <Button variant="secondary" onClick={handleCloseDeleteModal}>
            Cancel
        </Button>
        <Button variant="warning" onClick={archiveBrand}> {/* Changed to 'warning' */}
            Archive
        </Button>
    </Modal.Footer>
</Modal>
        </div>
    );
};

export default Brand;
