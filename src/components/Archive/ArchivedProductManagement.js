import React, { useEffect, useState } from 'react';
import { FaTrashRestore, FaTrash, FaSearch } from 'react-icons/fa';
import { AiOutlineArrowUp, AiOutlineArrowDown } from 'react-icons/ai';
import axios from 'axios';
import { Table, Button, Form, Modal, Pagination, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useNavigate } from 'react-router-dom';

const ArchivedProductManagement = () => {
    const [archivedProducts, setArchivedProducts] = useState([]);
    const [originalArchivedProducts, setOriginalArchivedProducts] = useState([]);
    const [selectedProducts, setSelectedProducts] = useState([]);
    const [sortBy, setSortBy] = useState({ key: '', order: '' });
    const [currentPage, setCurrentPage] = useState(1);
    const [productsPerPage, setProductsPerPage] = useState(5);  
    const [productIdToDelete, setProductIdToDelete] = useState(null);
    const [showRestoreModal, setShowRestoreModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [productIdToRestore, setProductIdToRestore] = useState(null);
    const [selectAll, setSelectAll] = useState(false);
    const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
    const navigate = useNavigate();

    useEffect(() => {
        fetchArchivedProducts();
    }, []);

    const fetchArchivedProducts = () => {
        axios.get(`${API_BASE_URL}/api/products.php?archived=1`)
            .then((response) => {
                const productsData = response.data.products || [];
                setArchivedProducts(productsData);
                setOriginalArchivedProducts(productsData);
            })
            .catch((error) => {
                console.error('Error fetching archived products:', error);
            });
    };

    const restoreProduct = () => {
        axios.put(`${API_BASE_URL}/api/products.php/${productIdToRestore}`, { 
            id: productIdToRestore, 
            archived: 0 
        })
        .then(response => {
            if (response.data.status === 1) {
                fetchArchivedProducts();  
                setShowRestoreModal(false);
                toast.success('Product restored successfully!');
            } else {
                toast.error(response.data.message || 'Failed to restore product');
            }
        })
        .catch((error) => {
            console.error('Error restoring product:', error);
            toast.error('Failed to restore product');
        });
    };

    const deleteProduct = () => {
        axios.delete(`${API_BASE_URL}/api/products.php/${productIdToDelete}`)
            .then(() => {
                fetchArchivedProducts();
                setShowDeleteModal(false);
                toast.success('Product deleted successfully!');
            })
            .catch(error => {
                console.error('Error deleting product:', error);
                toast.error('Failed to delete product');
            });
    };

    const handleSelectProduct = (id) => {
        setSelectedProducts(prev =>
            prev.includes(id) ? prev.filter(pid => pid !== id) : [...prev, id]
        );
    };

    const handleSelectAll = () => {
        if (!selectAll) {
            setSelectedProducts(archivedProducts.map(p => p.id));
        } else {
            setSelectedProducts([]);
        }
        setSelectAll(!selectAll);
    };

    const handleFilter = (event) => {
        const searchText = event.target.value.toLowerCase();
        const filteredData = originalArchivedProducts.filter(row =>
            row.product_name.toLowerCase().includes(searchText) ||
            row.generic_name.toLowerCase().includes(searchText) ||
            row.sku.toLowerCase().includes(searchText)
        );
        setArchivedProducts(searchText ? filteredData : originalArchivedProducts);
    };

    const handleSort = (key) => {
        let order = 'asc';
        if (sortBy.key === key && sortBy.order === 'asc') {
            order = 'desc';
        }
        setSortBy({ key, order });
        const sortedProducts = [...archivedProducts].sort((a, b) => {
            const valueA = typeof a[key] === 'string' ? a[key].toLowerCase() : a[key];
            const valueB = typeof b[key] === 'string' ? b[key].toLowerCase() : b[key];
            return order === 'asc' ? (valueA > valueB ? 1 : -1) : (valueA < valueB ? 1 : -1);
        });
        setArchivedProducts(sortedProducts);
    };

    const getSortIcon = (key) => {
        if (sortBy.key === key) {
            return sortBy.order === 'asc' ? <AiOutlineArrowUp /> : <AiOutlineArrowDown />;
        }
        return null;
    };

    const indexOfLastProduct = currentPage * productsPerPage;
    const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
    const currentProducts = archivedProducts.slice(indexOfFirstProduct, indexOfLastProduct);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    return (
        <div className="container mt-4">
            <h1 className="mb-4">Archived Products</h1>

            <div className='d-flex justify-content-between align-items-center mb-3'>
                <div className="input-group" style={{ width: '25%' }}>
                    <input type="text" className="form-control" onChange={handleFilter} placeholder="Search Products" />
                </div>
                <Button 
                    variant="primary" 
                    onClick={() => navigate('/products')}
                    style={{ fontWeight: 'bold' }}
                >
                    Back to Products
                </Button>
            </div>

            {/* Table for displaying archived products */}
            <Table className="table-responsive">
                <thead>
                    <tr>
                        <th className="text-center">
                            <Form.Check type="checkbox" checked={selectAll} onChange={handleSelectAll} />
                        </th>
                        <th className="text-center" onClick={() => handleSort('product_name')}>
                            Product Name {getSortIcon('product_name')}
                        </th>
                        <th className="text-center" onClick={() => handleSort('generic_name')}>
                            Generic Name {getSortIcon('generic_name')}
                        </th>
                        <th className="text-center" onClick={() => handleSort('sku')}>
                            SKU {getSortIcon('sku')}
                        </th>
                        <th className="text-center">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {currentProducts.map((product) => (
                        <tr key={product.id}>
                            <td className="text-center">
                                <Form.Check
                                    type="checkbox"
                                    checked={selectedProducts.includes(product.id)}
                                    onChange={() => handleSelectProduct(product.id)}
                                />
                            </td>
                            <td className="text-center">{product.product_name}</td>
                            <td className="text-center">{product.generic_name}</td>
                            <td className="text-center">{product.sku}</td>
                            <td className="text-center">
                                <Button variant="success" onClick={() => {
                                    setProductIdToRestore(product.id);
                                    setShowRestoreModal(true);
                                }}>
                                    <FaTrashRestore />
                                </Button>
                                <Button variant="danger" onClick={() => {
                                    setProductIdToDelete(product.id);
                                    setShowDeleteModal(true);
                                }}>
                                    <FaTrash />
                                </Button>
                            </td>
                        </tr>
                    ))}
                    {currentProducts.length === 0 && (
                        <tr>
                            <td colSpan="5" className="text-center">No archived products found.</td>
                        </tr>
                    )}
                </tbody>
            </Table>

            <Pagination>
                {Array.from({ length: Math.ceil(archivedProducts.length / productsPerPage) }, (_, index) => (
                    <Pagination.Item key={index} active={index + 1 === currentPage} onClick={() => paginate(index + 1)}>
                        {index + 1}
                    </Pagination.Item>
                ))}
            </Pagination>

            {/* Restore and Delete Modals */}
            <Modal show={showRestoreModal} onHide={() => setShowRestoreModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Restore Product</Modal.Title>
                </Modal.Header>
                <Modal.Body>Are you sure you want to restore this product?</Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowRestoreModal(false)}>Cancel</Button>
                    <Button variant="success" onClick={restoreProduct}>Restore</Button>
                </Modal.Footer>
            </Modal>

        <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
            <Modal.Header closeButton>
                <Modal.Title>Delete Product</Modal.Title>
            </Modal.Header>
            <Modal.Body>Are you sure you want to permanently delete this product?</Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
                    Cancel
                </Button>
                <Button variant="danger" onClick={deleteProduct}>
                    Delete Permanently
                </Button>
            </Modal.Footer>
        </Modal>
        </div>
    );
};

export default ArchivedProductManagement;
