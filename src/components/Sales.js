import React, { useEffect, useState } from 'react';
import { AiOutlineArrowUp, AiOutlineArrowDown } from 'react-icons/ai';
import axios from "axios";
import { Pagination, Button } from 'react-bootstrap';
import ReceiptModal from '../components/ReceiptModal';
import '../assets/table.css';

const SalesList = () => {
    const [sales, setSales] = useState([]);
    const [originalSales, setOriginalSales] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [salesPerPage, setSalesPerPage] = useState(10);
    const [sortBy, setSortBy] = useState({ key: '', order: '' });
    const [showModal, setShowModal] = useState(false);
    const [selectedReceipt, setSelectedReceipt] = useState(null);

    useEffect(() => {
        fetchSales();
    }, []);

    const fetchSales = () => {
        axios.get('http://localhost:80/api/transaction.php')
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

    return (
        <div className='container mt-2'>
            <h1 style={{ textAlign: 'left', fontWeight: 'bold' }}>Sales Transactions</h1>
            <div className='d-flex justify-content-between align-items-center'>
                <div className="input-group" style={{ width: '25%', marginBottom: '10px' }}>
                    <input type="text" className="form-control" onChange={handleFilter} placeholder="Search" />
                </div>
            </div>
            <div className="table-responsive">
                <table className="table table-striped table-hover custom-table" style={{ width: '100%' }}>
                    <thead>
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
                                    <Button variant="primary" size="sm" onClick={() => handleViewReceipt(sale)}>View</Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="d-flex justify-content-between mb-3">
                <div className="d-flex align-items-center">
                    <label htmlFor="itemsPerPage" className="form-label me-2">Items per page:</label>
                    <select id="itemsPerPage" className="form-select" value={salesPerPage} onChange={handlePerPageChange}>
                        <option value="5">5</option>
                        <option value="10">10</option>
                        <option value="15">15</option>
                        <option value="20">20</option>
                        <option value="30">30</option>
                        <option value="50">50</option>
                    </select>
                </div>
                <Pagination>
                    {Array.from({ length: Math.ceil(sales.length / salesPerPage) }, (_, index) => (
                        <Pagination.Item key={index} active={index + 1 === currentPage} onClick={() => paginate(index + 1)}>
                            {index + 1}
                        </Pagination.Item>
                    ))}
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
