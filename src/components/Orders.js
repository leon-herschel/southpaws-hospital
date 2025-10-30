import React, { useEffect, useState } from 'react';
import { AiOutlineArrowUp, AiOutlineArrowDown } from 'react-icons/ai';
import axios from 'axios';
import { Pagination } from 'react-bootstrap';
import '../assets/table.css';
import EditProductModal from './Edit/EditProductModal'; 

const Orders = () => {
    const [orders, setOrders] = useState([]);
    const [originalOrders, setOriginalOrders] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [ordersPerPage, setOrdersPerPage] = useState(5); 
    const [sortBy, setSortBy] = useState({ key: '', order: '' });

    const [showEditModal, setShowEditModal] = useState(false);
    const [orderIdToEdit, setOrderIdToEdit] = useState(null); 
    const [editOrder, setEditOrder] = useState(null);
    const [editLoading, setEditLoading] = useState(true);
    const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

    const internalUser = JSON.parse(localStorage.getItem('internalUser')); // Assuming internal users are saved in localStorage

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = () => {
        axios.get(`${API_BASE_URL}/api/orders.php`)
            .then(response => {
                console.log(response.data); // Log the raw response to see what the API returns
                if (Array.isArray(response.data)) {
                    setOrders(response.data);
                    setOriginalOrders(response.data);
                } else {
                    console.error('Orders data is not an array');
                }
            })
            .catch(error => {
                console.error('Error fetching orders:', error);
            });
    };

    const handleFilter = (event) => {
        const searchText = event.target.value.toLowerCase();
        const filteredOrders = originalOrders.filter(order => {
            return (
                (order.client_name && order.client_name.toLowerCase().includes(searchText)) ||
                (order.order_date && order.order_date.toLowerCase().includes(searchText)) ||
                (order.grand_total && order.grand_total.toLowerCase().includes(searchText)) ||
                (order.id.toString().includes(searchText)) // Ensure ID is considered in filter
            );
        });
        setOrders(searchText ? filteredOrders : originalOrders);
    };

    const handleSort = (key) => {
        let order = 'asc';
        if (sortBy.key === key && sortBy.order === 'asc') {
            order = 'desc';
        }
        setSortBy({ key: key, order: order });
        const sortedOrders = [...orders].sort((a, b) => {
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
        setOrders(sortedOrders);
    };

    const getSortIcon = (key) => {
        if (sortBy.key === key) {
            return sortBy.order === 'asc' ? <AiOutlineArrowUp /> : <AiOutlineArrowDown />;
        }
        return null;
    };

    const indexOfLastOrder = currentPage * ordersPerPage;
    const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
    const currentOrders = orders.slice(indexOfFirstOrder, indexOfLastOrder);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    const handlePerPageChange = (e) => {
        setCurrentPage(1);
        setOrdersPerPage(Number(e.target.value));
    };

    const handleShowEditModal = (orderId) => {
        setOrderIdToEdit(orderId);
        setShowEditModal(true);
    };

    const handleCloseEditModal = () => {
        setShowEditModal(false);
    };

    const handleEditSubmit = (event) => {
        event.preventDefault();

        axios.put(`${API_BASE_URL}/api/orders.php/${orderIdToEdit}`, editOrder)
            .then(response => {
                console.log(response.data);
                handleCloseEditModal();
                fetchOrders();
            })
            .catch(error => {
                console.error('Error updating order:', error);
            });
    };

    // Separate Date and Time formatting functions
    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return date.toLocaleDateString('en-US', options); // Only date
    };

    const formatTime = (dateStr) => {
        const date = new Date(dateStr);
        const timeOptions = { hour: '2-digit', minute: '2-digit', hour12: true };
        return date.toLocaleTimeString('en-US', timeOptions); // Only time in 12-hour format
    };

    // Format currency
    const formatCurrency = (amount) => {
        return parseFloat(amount).toLocaleString('en-US', {
            style: 'currency',
            currency: 'PHP',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    };

    return (
        <div className='container mt-2'>
            <h1 style={{ textAlign: 'left', fontWeight: 'bold' }}>Orders</h1>
            <div className='d-flex justify-content-between align-items-center'>
                <div className="input-group" style={{ width: '25%', marginBottom: '10px' }}>
                    <input type="text" className="form-control" onChange={handleFilter} placeholder="Search" />
                </div>
            </div>
            <div className="table-responsive">
                <table className="table table-striped table-hover custom-table" style={{ width: '100%' }}>
                    <thead>
                        <tr>
                            <th className="text-center" onClick={() => handleSort('id')}>
                                #
                                {getSortIcon('id')} 
                            </th>
                            <th className="text-center" onClick={() => handleSort('client_name')}>
                                Client Name
                                {getSortIcon('client_name')} 
                            </th>
                            <th className="text-center" onClick={() => handleSort('order_date')}>
                                Date Ordered
                                {getSortIcon('order_date')} 
                            </th>
                            <th className="text-center" onClick={() => handleSort('order_date')}>
                                Time Ordered
                                {getSortIcon('order_date')} 
                            </th>
                            <th className="text-center" onClick={() => handleSort('grand_total')}>
                                Total Amount
                                {getSortIcon('grand_total')} 
                            </th>
                            <th className="text-center">
                                Confirmed By
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentOrders.map((order, key) =>
                            <tr key={key}>
                                <td className="text-center">{order.id}</td>
                                <td className="text-center">{order.client_name || 'Guest'}</td>
                                <td className="text-center">{formatDate(order.order_date)}</td>
                                <td className="text-center">{formatTime(order.order_date)}</td>
                                <td className="text-center">{formatCurrency(order.grand_total)}</td>
                                <td className="text-center">{internalUser ? internalUser.name : 'N/A'}</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            <div className="d-flex justify-content-between mb-3">
                <div className="d-flex align-items-center">
                    <div className="col-md-auto">
                        <label htmlFor="itemsPerPage" className="form-label me-2">Items per page:</label>
                    </div>
                    <div className="col-md-5">
                        <select id="itemsPerPage" className="form-select" value={ordersPerPage} onChange={handlePerPageChange}>
                            <option value="5">5</option>
                            <option value="10">10</option>
                            <option value="15">15</option>
                            <option value="20">20</option>
                            <option value="30">30</option>
                            <option value="50">50</option>
                        </select>
                    </div>
                </div>
                <Pagination>
                    {Array.from({ length: Math.ceil(orders.length / ordersPerPage) }, (_, index) => (
                        <Pagination.Item key={index} active={index + 1 === currentPage} onClick={() => paginate(index + 1)}>
                            {index + 1}
                        </Pagination.Item>
                    ))}
                </Pagination>
            </div>
        </div>
    );
};

export default Orders;
