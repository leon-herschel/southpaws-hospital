import React, { useState, useEffect } from 'react';
import { FaEdit, FaEye, FaArchive } from 'react-icons/fa';
import { AiOutlineArrowUp, AiOutlineArrowDown } from 'react-icons/ai';
import axios from 'axios';
import { Pagination, Button, Modal, Tooltip, OverlayTrigger } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import '../assets/table.css';
import AddProductModal from '../components/Add/AddProductModal';
import EditProductModal from '../components/Edit/EditProductModal';
import ViewProductModal from '../components/View/ViewProductModal';
import { toast } from 'react-toastify'; // Import Toastify


const Product = () => {
    const [products, setProducts] = useState([]);
    const [originalProducts, setOriginalProducts] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [productsPerPage, setProductsPerPage] = useState(5);
    const [sortBy, setSortBy] = useState({ key: '', order: '' });

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showViewDetailsModal, setShowViewDetailsModal] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [productIdToDelete, setProductIdToDelete] = useState(null);
    const [productIdToEdit, setProductIdToEdit] = useState(null);
    const [productDetails, setProductDetails] = useState(null);
    const [editProduct, setEditProduct] = useState({});
    const [brands, setBrands] = useState([]);
    const [categories, setCategories] = useState([]);
    const [units, setUnits] = useState([]);
    const [errorMessage, setErrorMessage] = useState(''); 
    

    const navigate = useNavigate();
    const [userRole, setUserRole] = useState(null); // Add state for user role

    useEffect(() => {
        const fetchData = async () => {
            try {
                const role = parseInt(localStorage.getItem('userRole'), 10);
                setUserRole(role);
    
                const [productsData, unitsData, categoriesData, brandsData] = await Promise.all([
                    getProducts(),
                    fetchUnits(),
                    fetchCategories(),
                    fetchBrands(),
                ]);
    
                setProducts(productsData || []);
                setUnits(unitsData || []);
                setCategories(categoriesData || []);
                setBrands(brandsData || []);
            } catch (error) {
                console.error("Error fetching data:", error);
            }
        };
    
        fetchData();
    }, []); 

    useEffect(() => {
        setProducts((prevProducts) => [...prevProducts]); 
    }, [brands, units]);

    const handleClose = () => setShowModal(false);

    const handleShow = () => setShowModal(true);

    const handleCloseDeleteModal = () => setShowDeleteModal(false);

    const handleShowDeleteModal = (productId) => {
        setProductIdToDelete(productId);
        setShowDeleteModal(true);
    };

    const handleCloseEditModal = () => {
        setShowEditModal(false);
        navigate('/products');
    };

    const handleShowEditModal = (productId) => {
        setErrorMessage(''); // Clear the error message
        setProductIdToEdit(productId);
        setShowEditModal(true);
    };

    const handleEditSubmit = () => {
        getProducts(); // Re-fetch products after editing
        setShowEditModal(false); // Close the modal
        toast.success('Product updated successfully!'); // Show success notification
        
    };

    const handleCloseViewDetailsModal = () => {
        setShowViewDetailsModal(false);
        setProductDetails(null);
    };

    const handleShowViewDetailsModal = (productId) => {
        // Example fetch call to get product details
        axios.get(`http://localhost:80/api/products.php?id=${productId}`)
            .then(response => {
                setProductDetails(response.data.product); // Assume response.data.product contains all needed product details
                setShowViewDetailsModal(true);
            })
            .catch(error => {
                console.error("Error fetching product details:", error);
                setProductDetails(null);
            });
    };


    const fetchCategories = () => {
        axios
            .get('http://localhost:80/api/category.php?archived=0') // Fetch only non-archived categories
            .then((response) => {
                // Check if response.data and response.data.categories exist and is an array
                if (response.data && Array.isArray(response.data.categories)) {
                    setCategories(response.data.categories); // Setting categories correctly
                } else {
                    // If the structure is invalid or empty, log an error
                    console.error('Invalid categories data structure:', response.data);
                    setCategories([]); // Reset categories in case of unexpected data structure
                }
            })
            .catch((error) => {
                // Log and handle any error from the API request
                console.error('Error fetching categories:', error);
                setCategories([]); // Reset categories on error
            });
    };
    

    const fetchBrands = () => {
        axios
            .get('http://localhost:80/api/brands.php?archived=0') // Fetch only active brands
            .then((response) => {
                // Check if response.data and response.data.brands exist and is an array
                if (response.data && Array.isArray(response.data.brands)) {
                    setBrands(response.data.brands); // Setting brands correctly
                } else {
                    console.error('Invalid brands data structure:', response.data);
                    setBrands([]); // Reset brands if the data structure is not as expected
                }
            })
            .catch((error) => {
                console.error('Error fetching brands:', error);
                setBrands([]); // Reset brands on error
            });
    };
    

    const fetchUnits = () => {
        // Ensure the 'archived' query parameter is passed as expected (e.g., 0 for active units)
        axios.get('http://localhost:80/api/units.php?archived=0') // Fetch only active units
            .then(response => {
                // Check if response.data and response.data.units exist and are an array
                if (response.data && Array.isArray(response.data.units)) {
                    setUnits(response.data.units); // Set the units correctly
                } else {
                    // Log error and set empty array if no valid data
                    console.error('No valid unit data received:', response.data);
                    setUnits([]); // Reset units
                }
            })
            .catch(error => {
                // Handle error during fetch
                console.error('Error fetching units:', error);
                setUnits([]); // Reset units on error
            });
    };

    const IconButtonWithTooltip = ({ tooltip, children, ...props }) => (
        <OverlayTrigger placement="top" overlay={<Tooltip>{tooltip}</Tooltip>}>
            <Button {...props}>{children}</Button>
        </OverlayTrigger>
    );
    
    useEffect(() => {
        if (showEditModal && productIdToEdit) {
            axios.get(`http://localhost:80/api/products.php?id=${productIdToEdit}`)
                .then(response => {
                    const productData = response.data.product;
                    if (productData && productData.id) {
                        setEditProduct(productData); // Ensure the ID remains unchanged
                    } else {
                        console.error("Invalid product data received");
                    }
                })
                .catch(error => console.error("Error fetching product:", error));
        }
    }, [showEditModal, productIdToEdit]);
    
    
    const archiveProduct = (productId) => {
        if (!productId) {
            toast.error('Invalid product ID.'); // Prevent sending an invalid request
            return;
        }
    
        // Ensure you're only sending the relevant data (id and archived)
        console.log("Archiving product with ID:", productId);  // Debugging: Check productId value
    
        axios.put(`http://localhost:80/api/products.php/${productId}`, { 
            id: productId, 
            archived: 1  // Ensure archived is correctly set to 1
        })
        .then((response) => {
            console.log("API response:", response);  // Log API response for debugging
            if (response.data.status === 1) {
                getProducts(); // Refresh the list after archiving
                handleCloseDeleteModal();
                toast.success('Product archived successfully!');
            } else {
                toast.warning(response.data.message || 'No changes made.');
            }
        })
        .catch((error) => {
            console.error('Error archiving product:', error);
            toast.error('Failed to archive product.');
        });
    };
    
    const getProducts = () => {
        axios.get('http://localhost:80/api/products.php') // Fetch products from the API
            .then(response => {
                if (Array.isArray(response.data.products)) {
                    // Sort products alphabetically by product_name (case insensitive)
                    const sortedProducts = response.data.products.sort((a, b) => {
                        const nameA = a.product_name?.toLowerCase() || '';
                        const nameB = b.product_name?.toLowerCase() || '';
                        return nameA.localeCompare(nameB); // Alphabetical order
                    });
    
                    // Update the state with the sorted products
                    setProducts(sortedProducts);
                    setOriginalProducts(sortedProducts); // Save the original list for filtering
                } else {
                    console.error('Products data is not an array');
                }
            })
            .catch(error => {
                console.error('Error fetching products:', error);
            });
    };

    const handleFilter = (event) => {
        const searchText = event.target.value.toLowerCase();
        const newData = originalProducts.filter(row => {
            return (
                String(row.product_name).toLowerCase().includes(searchText) ||
                String(row.brand_name).toLowerCase().includes(searchText) ||
                String(row.unit_name).toLowerCase().includes(searchText) 
            );
        });
        setProducts(searchText ? newData : originalProducts);
    };

    const indexOfLastProduct = currentPage * productsPerPage;
    const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
    const currentProducts = products.slice(indexOfFirstProduct, indexOfLastProduct);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    const handlePerPageChange = (e) => {
        setCurrentPage(1);
        setProductsPerPage(Number(e.target.value));
    };

    const handleSort = (key) => {
        let order = 'asc';
        if (sortBy.key === key && sortBy.order === 'asc') {
            order = 'desc';
        }
        setSortBy({ key, order });
        
        const sortedProducts = [...products].sort((a, b) => {
            // Handle cases where the value might be null or undefined
            const valueA = a[key] === null || a[key] === undefined ? '' : 
                          typeof a[key] === 'string' ? a[key].toLowerCase() : a[key];
            const valueB = b[key] === null || b[key] === undefined ? '' : 
                          typeof b[key] === 'string' ? b[key].toLowerCase() : b[key];
    
            if (valueA < valueB) return order === 'asc' ? -1 : 1;
            if (valueA > valueB) return order === 'asc' ? 1 : -1;
            return 0;
        });
        
        setProducts(sortedProducts);
    };

    const getSortIcon = (key) => {
        if (sortBy.key === key) {
            return sortBy.order === 'asc' ? <AiOutlineArrowUp /> : <AiOutlineArrowDown />;
        }
        return null;
    };

    const handleProductAdded = () => {
        toast.success('Product added successfully!'); // Trigger toast notification here
        getProducts();
        fetchBrands();
        fetchUnits();
        fetchCategories();
    };

    return (
        <div className='container mt-2'>
            <h1 style={{ textAlign: 'left', fontWeight: 'bold' }}>Products</h1>
            <div className='d-flex justify-content-between align-items-center'>
                <div className="input-group" style={{ width: '25%' }}>
                    <input type="text" className="form-control shadow-sm" onChange={handleFilter} placeholder="Search" />
                </div>
                {userRole !== 1 && ( // Show Add button only for non-Veterinarian
                    <div className='text-end'>
                        <Button onClick={handleShow} className='btn btn-primary w-100 btn-gradient'
                            style={{
                                backgroundImage: 'linear-gradient(to right, #006cb6, #31b44b)',
                                color: '#ffffff',
                                borderColor: '#006cb6',
                                fontWeight: 'bold',
                                marginBottom: '-10px',
                            }}
                        >
                            Add Product
                        </Button>
                    </div>
                )}
            </div>
            <div className="table-responsive">
            <table className="table table-striped table-hover custom-table align-middle shadow-sm" style={{ width: '100%' }}>
    <thead className="table-light">
        <tr>
            <th className="text-center" onClick={() => handleSort('product_name')}>
                Product Name
                {getSortIcon('product_name')}
            </th>
            <th className="text-center" onClick={() => handleSort('category_name')}>
                Category
                {getSortIcon('category_name')}
            </th>

            <th className="text-center" onClick={() => handleSort('brand_name')}>
                Brand
                {getSortIcon('brand_name')}
            </th>

            <th className="text-center" onClick={() => handleSort('unit_name')}>
                Type
                {getSortIcon('unit_name')}
            </th>
            {userRole !== 1 && ( // Show Add button only for non-Veterinarian
            <th className="text-center">Action</th>
            )}
        </tr>
    </thead>
    <tbody>
    {currentProducts.map((product, index) => {
        // Calculate the global index
        const globalIndex = (currentPage - 1) * productsPerPage + index + 1;
        return (
            <tr key={product.id}>
                <td className="text-center">{product.product_name}</td>
                <td className="text-center">{product.category_name}</td>
                <td className="text-center">
                    {brands.length > 0 ? (brands.find(b => b.id === product.brand_id)?.name ?? "Unknown Brand") : "Loading..."}
                </td>
                <td className="text-center">
                    {units.length > 0 ? (units.find(u => u.id === product.unit_id)?.unit_name ?? "Unknown Unit") : "Loading..."}
                </td>
                <td className="text-center">
                    <div className="d-flex justify-content-center align-items-center">
                        {userRole !== 1 && (
                            <>
                                <IconButtonWithTooltip
                                    tooltip="View"
                                    onClick={() => handleShowViewDetailsModal(product.id)}
                                    className="btn btn-success me-2"
                                >
                                    <FaEye />
                                </IconButtonWithTooltip>

                                <IconButtonWithTooltip
                                    tooltip="Edit"
                                    onClick={() => handleShowEditModal(product.id)}
                                    className="btn btn-primary me-2"
                                >
                                    <FaEdit />
                                </IconButtonWithTooltip>

                                <IconButtonWithTooltip
                                    tooltip="Archive"
                                    onClick={() => handleShowDeleteModal(product.id)}
                                    className="btn btn-warning"
                                >
                                    <FaArchive />
                                </IconButtonWithTooltip>
                            </>
                        )}
                    </div>
                </td>
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
                value={productsPerPage} 
                onChange={handlePerPageChange}
                >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                </select>
            </div>

            {/* Pagination (right) */}
            <Pagination className="mb-0">
                {/* Prev button */}
                <Pagination.Prev
                onClick={() => currentPage > 1 && paginate(currentPage - 1)}
                disabled={currentPage === 1}
                />

                {Array.from({ length: Math.ceil(products.length / productsPerPage) }, (_, index) => index + 1)
                .filter(page =>
                    page === 1 ||
                    page === Math.ceil(products.length / productsPerPage) ||
                    (page >= currentPage - 2 && page <= currentPage + 2) // show range around current page
                )
                .map((page, i, arr) => (
                    <React.Fragment key={page}>
                    {/* Add ellipsis when gap */}
                    {i > 0 && arr[i] !== arr[i - 1] + 1 && <Pagination.Ellipsis disabled />}
                    <Pagination.Item
                        active={page === currentPage}
                        onClick={() => paginate(page)}
                    >
                        {page}
                    </Pagination.Item>
                    </React.Fragment>
                ))}

                {/* Next button */}
                <Pagination.Next
                onClick={() =>
                    currentPage < Math.ceil(products.length / productsPerPage) &&
                    paginate(currentPage + 1)
                }
                disabled={currentPage === Math.ceil(products.length / productsPerPage)}
                />
            </Pagination>
            </div>
            <AddProductModal show={showModal} handleClose={handleClose} onProductAdded={handleProductAdded} />
            <EditProductModal
            show={showEditModal}
            handleClose={handleCloseEditModal}
            editProduct={editProduct}
            handleEditSubmit={handleEditSubmit}
            errorMessage={errorMessage}  
        />

            <Modal show={showDeleteModal} onHide={handleCloseDeleteModal} className="custom-modal">
                <Modal.Header closeButton>
                <Modal.Title>Archive Product</Modal.Title>
            </Modal.Header>
            <Modal.Body>Are you sure you want to archive this product?</Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={handleCloseDeleteModal}>
                    Cancel
                </Button>
                <Button variant="warning" onClick={() => archiveProduct(productIdToDelete)}> {/* Changed to 'warning' */}
                    Archive
                </Button>
            </Modal.Footer>
            </Modal>
            <ViewProductModal
                show={showViewDetailsModal}
                handleClose={handleCloseViewDetailsModal}
                viewProduct={productDetails}
            />
            
        </div>
    );
}

export default Product;
