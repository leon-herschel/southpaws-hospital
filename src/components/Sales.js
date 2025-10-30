import React, { useEffect, useState } from 'react';
import { AiOutlineArrowUp, AiOutlineArrowDown } from 'react-icons/ai';
import axios from "axios";
import { Pagination, Button, OverlayTrigger, Tooltip } from 'react-bootstrap';
import ReceiptModal from '../components/ReceiptModal';
import '../assets/table.css';
import { FaEye } from 'react-icons/fa';

const SalesList = () => {
    const [sales, setSales] = useState([]);
    const [originalSales, setOriginalSales] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [salesPerPage, setSalesPerPage] = useState(5);
    const [sortBy, setSortBy] = useState({ key: '', order: '' });
    const [showModal, setShowModal] = useState(false);
    const [selectedReceipt, setSelectedReceipt] = useState(null);
    const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

    useEffect(() => {
        fetchSales();
    }, []);

    const fetchSales = () => {
        axios.get(`${API_BASE_URL}/api/transaction.php`)
            .then(response => {
                if (Array.isArray(response.data)) {
                    setSales(response.data);
                    setOriginalSales(response.data);
                } else {
                    console.error('Sales data is not an array');
                }
            })
            .catch(error => {
                console.error('Error fetching sales:', error);
            });
    };

    const handleFilter = (event) => {
        const searchText = event.target.value.toLowerCase();
        const filteredSales = originalSales.filter(sale => 
            String(sale.receipt_number).toLowerCase().includes(searchText) ||
            String(sale.client_name).toLowerCase().includes(searchText) ||
            String(sale.unregistered_client_id).toLowerCase().includes(searchText) ||
            String(sale.order_date).toLowerCase().includes(searchText) ||
            String(sale.grand_total).toLowerCase().includes(searchText)
        );
        setSales(searchText ? filteredSales : originalSales);
    };

    const handleSort = (key) => {
        let order = 'asc';
        if (sortBy.key === key && sortBy.order === 'asc') {
            order = 'desc';
        }
        setSortBy({ key, order });
        const sortedSales = [...sales].sort((a, b) => {
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
        setSales(sortedSales);
    };

    const getSortIcon = (key) => {
        if (sortBy.key === key) {
            return sortBy.order === 'asc' ? <AiOutlineArrowUp /> : <AiOutlineArrowDown />;
        }
        return null;
    };

    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return date.toLocaleDateString('en-US', options);
    };

    const formatCurrency = (amount) => {
        return parseFloat(amount).toLocaleString('en-US', {
            style: 'currency',
            currency: 'PHP',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    };

    const indexOfLastSale = currentPage * salesPerPage;
    const indexOfFirstSale = indexOfLastSale - salesPerPage;
    const currentSales = sales.slice(indexOfFirstSale, indexOfLastSale);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    const handlePerPageChange = (e) => {
        setCurrentPage(1);
        setSalesPerPage(Number(e.target.value));
    };

    const handleViewReceipt = (sale) => {
        setSelectedReceipt(sale.receipt_number);  // Pass only receipt number
        setShowModal(true);
    }; 

    const IconButtonWithTooltip = ({ tooltip, children, ...props }) => (
            <OverlayTrigger placement="top" overlay={<Tooltip>{tooltip}</Tooltip>}>
                <Button {...props}>{children}</Button>
            </OverlayTrigger>
    );

    return (
        <div className='container mt-2'>
            <h1 style={{ textAlign: 'left', fontWeight: 'bold' }}>Sales Transactions</h1>
            <div className='d-flex justify-content-between align-items-center'>
                <div className="input-group" style={{ width: '25%' }}>
                    <input type="text" className="form-control shadow-sm" onChange={handleFilter} placeholder="Search" />
                </div>
            </div>
            <div className="table-responsive">
                <table className="table table-striped table-hover custom-table align-middle shadow-sm" style={{ width: '100%' }}>
                    <thead className='table-light'>
                        <tr>
                            <th className="text-center" onClick={() => handleSort('receipt_number')}>
                                Receipt # {getSortIcon('receipt_number')}
                            </th>
                            <th className="text-center" onClick={() => handleSort('client_id')}>
                                Client {getSortIcon('client_id')}
                            </th>
                            <th className="text-center" onClick={() => handleSort('order_date')}>
                                Date {getSortIcon('order_date')}
                            </th>
                            <th className="text-center" onClick={() => handleSort('grand_total')}>
                                Total Amount {getSortIcon('grand_total')}
                            </th>
                            <th className="text-center">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentSales.map((sale, key) => (
                            <tr key={key}>
                                <td className="text-center">{sale.receipt_number || 'No Receipt'}</td>
                                <td className="text-center">
                                    {sale.client_name ? sale.client_name : `Unregistered ID #${sale.unregistered_client_id}`}
                                </td>
                                <td className="text-center">{formatDate(sale.order_date)}</td>
                                <td className="text-center">{formatCurrency(sale.grand_total)}</td>
                                <td className="text-center">
                                    <IconButtonWithTooltip tooltip="View" variant="primary" className='btn btn-success' onClick={() => handleViewReceipt(sale)}><FaEye /></IconButtonWithTooltip>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="d-flex justify-content-between align-items-center">
                {/* Items per page selector (left) */}
                <div className="d-flex align-items-center">
                    <label htmlFor="itemsPerPage" className="form-label me-2 fw-bold">Items per page:</label>
                    <select 
                    style={{ width: '80px' }} 
                    id="itemsPerPage" 
                    className="form-select form-select-sm shadow-sm" 
                    value={salesPerPage} 
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

                    {Array.from({ length: Math.ceil(sales.length / salesPerPage) }, (_, index) => index + 1)
                    .filter(page =>
                        page === 1 ||
                        page === Math.ceil(sales.length / salesPerPage) ||
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
                        currentPage < Math.ceil(sales.length / salesPerPage) &&
                        paginate(currentPage + 1)
                    }
                    disabled={currentPage === Math.ceil(sales.length / salesPerPage)}
                    />
                </Pagination>
                </div>

                {/* Receipt Modal */}
                <ReceiptModal 
                    show={showModal} 
                    handleClose={() => setShowModal(false)} 
                    receiptNumber={selectedReceipt} 
                />
        </div>
    );
};

export default SalesList;
