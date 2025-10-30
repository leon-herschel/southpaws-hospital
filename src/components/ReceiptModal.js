import React, { useEffect, useState } from 'react';
import { Modal, Button, Spinner } from 'react-bootstrap';
import axios from 'axios';
import logo from '../assets/southpawslogo.png';

const ReceiptModal = ({ show, handleClose, receiptNumber }) => {
    const [receiptData, setReceiptData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

    useEffect(() => {
        if (show && receiptNumber) {
            fetchReceiptData(receiptNumber);
        }
    }, [show, receiptNumber]);

    const fetchReceiptData = async (receiptNumber) => {
        setLoading(true);
        setError('');
        console.log("📤 Fetching receipt for:", receiptNumber); // ✅ Debug Log

        try {
            const response = await axios.get(`${API_BASE_URL}/api/transaction.php?receipt_number=${receiptNumber}`);
            console.log("✅ Response:", response.data); // ✅ Debug Log

            if (response.data.status === 1) {
                setReceiptData(response.data.receipt);
            } else {
                setError('Failed to fetch receipt details.');
                console.error("❌ Error: ", response.data.message);
            }
        } catch (err) {
            setError('Error fetching receipt data.');
            console.error("❌ Fetch Error:", err);
        }

        setLoading(false);
    };

    // Ensure that receiptData is loaded before accessing its properties
    const amountTendered = receiptData ? parseFloat(receiptData.amount_tendered || 0) : 0;
    const grandTotal = receiptData ? parseFloat(receiptData.grand_total || 0) : 0;
    const taxAmount = receiptData ? parseFloat(receiptData.tax_amount || 0) : 0;
    const subtotal = (grandTotal - taxAmount).toFixed(2);
    const changeAmount = (amountTendered - grandTotal).toFixed(2);

    return (
        <Modal show={show} onHide={handleClose} centered>
            <Modal.Header closeButton>
                <Modal.Title>Receipt Details</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {loading ? (
                    <div className="text-center">
                        <Spinner animation="border" role="status">
                            <span className="visually-hidden">Loading...</span>
                        </Spinner>
                    </div>
                ) : error ? (
                    <p className="text-danger text-center">{error}</p>
                ) : receiptData ? (
                    <div id="receipt-content"> {/* ✅ Added this wrapper */}

                    <div style={{ fontFamily: "'Arial', sans-serif", maxWidth: '600px', margin: '0 auto' }}>
                        {/* Receipt Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                            <div style={{ textAlign: 'center' }}>
                                <img src={logo} alt="Southpaws Logo" style={{ maxWidth: '280px' }} />
                            </div>
                            <div style={{ textAlign: 'right', fontSize: '14px' }}>
                                <p style={{ margin: '0' }}>
                                    <strong>Receipt#:</strong> {receiptData.receipt_number || "N/A"}
                                </p>
                                <p style={{ margin: '0' }}>
                                    <strong>Date:</strong> {new Date(receiptData.order_date).toLocaleDateString()}
                                </p>
                                <p>
                                    <strong>Cashier:</strong> {receiptData.confirmed_by || "Unknown"}
                                </p>
                            </div>
                        </div>

                        {/* Table Header */}
                        <div style={{ display: 'flex', borderBottom: '1px solid black', paddingBottom: '8px', fontWeight: 'bold' }}>
                            <div style={{ flex: 3 }}>Item Name</div>
                            <div style={{ flex: 1, textAlign: 'center' }}>Qty</div>
                            <div style={{ flex: 2, textAlign: 'right' }}>Price</div>
                            <div style={{ flex: 2, textAlign: 'right' }}>Total</div>
                        </div>

                        {/* Table Rows */}
                        {receiptData.items.map((item, index) => (
                            <div
                                key={index}
                                style={{
                                    display: 'flex',
                                    padding: '8px 0',
                                    borderBottom: '1px solid #ddd',
                                }}
                            >
                                <div style={{ flex: 3 }}>{item.product_name || "Unknown"}</div>
                                <div style={{ flex: 1, textAlign: 'center' }}>{item.quantity}</div>
                                <div style={{ flex: 2, textAlign: 'right' }}>₱{parseFloat(item.price).toFixed(2)}</div>
                                <div style={{ flex: 2, textAlign: 'right' }}>₱{parseFloat(item.total).toFixed(2)}</div>
                            </div>
                        ))}

                        {/* Payment Summary */}
                        <div style={{ marginTop: '20px', fontSize: '14px', borderTop: '1px solid black', paddingTop: '10px', textAlign: 'right' }}>
                            <p><strong>Subtotal:</strong> ₱{subtotal}</p> {/* ✅ Subtotal calculated dynamically */}
                            <p><strong>Tax:</strong> ₱{taxAmount.toFixed(2)}</p>
                            <p><strong>Amount Due:</strong> ₱{grandTotal.toFixed(2)}</p>
                            <p><strong>Amount Tendered:</strong> ₱{amountTendered.toFixed(2)}</p>
                            <p><strong>Change:</strong> ₱{changeAmount}</p> {/* ✅ Change Calculation */}
                        </div>
                    </div>
                </div> 

                ) : (
                    <p className="text-center">No receipt data available.</p>
                )}
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={handleClose}>Close</Button>

                <Button
                        variant="primary"
                        onClick={() => {
                            const printContent = document.getElementById("receipt-content");
                            const printWindow = window.open("", "_blank", "width=800,height=600");
                            const logoPath = `${window.location.origin}/assets/southpawslogo.png`;

                            printWindow.document.write(`
                                <!DOCTYPE html>
                                <html lang="en">
                                    <head>
                                        <meta charset="UTF-8">
                                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                                        <title>Print Receipt</title>
                                        <style>
                                            body {
                                                font-family: Arial, sans-serif;
                                                margin: 0;
                                                padding: 20px;
                                            }
                                            .receipt-logo {
                                                display: block;
                                                max-width: 300px;
                                                margin: 0 auto 20px auto;
                                            }
                                            .receipt-container {
                                                padding: 20px;
                                                border: 1px solid #ddd;
                                                border-radius: 5px;
                                                box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
                                                margin: auto;
                                                max-width: 600px;
                                                background-color: #fff;
                                            }
                                        </style>
                                    </head>
                                    <body>
                                        <div class="receipt-container">
                                            <img 
                                                class="receipt-logo" 
                                                src="${logoPath}" 
                                                alt="Southpaws Logo" 
                                                onerror="this.style.display='none'" 
                                            />
                                            ${printContent.innerHTML}
                                        </div>
                                    </body>
                                </html>
                            `);

                            printWindow.document.close();
                            printWindow.onload = () => {
                                printWindow.print();
                                printWindow.close();
                            };
                        }}
                    >
                        Print
                    </Button>      
            </Modal.Footer>
      
        </Modal>
    );
};

export default ReceiptModal;
