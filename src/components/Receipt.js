import React from 'react';
import logo from '../assets/southpawslogo.png';

const Receipt = ({ data }) => {
    if (!data || !data.receiptNumber) {
        return <p style={{ textAlign: "center", padding: "20px" }}>No receipt data available.</p>;
    }

    const currentDate = new Date().toLocaleDateString(); // Current date

    return (
        <div style={{ fontFamily: "'Arial', sans-serif", maxWidth: '600px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <div style={{ textAlign: 'center' }}>
                    <img src={logo} alt="Southpaws Logo" style={{ maxWidth: '280px' }} />
                </div>
                <div style={{ textAlign: 'right', fontSize: '14px' }}>
                    <p style={{ margin: '0' }}>
                        <strong>Receipt#:</strong> {data.receiptNumber || "N/A"}
                    </p>
                    <p style={{ margin: '0' }}>
                        <strong>Date:</strong> {currentDate}
                    </p>
                    <p>
                        <strong>Cashier:</strong> {data.confirmed_by || "Unknown"}
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
            {data.items.map((item, index) => (
                <div
                    key={index}
                    style={{
                        display: 'flex',
                        padding: '8px 0',
                        borderBottom: '1px solid #ddd',
                    }}
                >
                    <div style={{ flex: 3 }}>{item.name || item.product_name || "Unknown"}</div>
                    <div style={{ flex: 1, textAlign: 'center' }}>{item.quantity}</div>
                    <div style={{ flex: 2, textAlign: 'right' }}>₱{parseFloat(item.price).toLocaleString()}</div>
                    <div style={{ flex: 2, textAlign: 'right' }}>₱{(item.price * item.quantity).toLocaleString()}</div>
                </div>
            ))}

            {/* Payment Summary */}
            <div
                style={{
                    marginTop: '20px',
                    fontSize: '14px',
                    borderTop: '1px solid black',
                    paddingTop: '10px',
                    textAlign: 'right',
                }}
            >
                <p>
                    <strong>Subtotal:</strong> ₱{parseFloat(data.subtotal).toLocaleString()}
                </p>
                <p>
                    <strong>Tax:</strong> ₱{parseFloat(data.tax_amount).toLocaleString()} {/* ✅ Using tax_amount from data */}
                </p>
                <p>
                    <strong>Amount Due:</strong> ₱{parseFloat(data.grand_total).toLocaleString()} {/* ✅ Keep grand_total unchanged */}
                </p>
                <p>
                    <strong>Amount Tendered:</strong> ₱{parseFloat(data.amount_tendered || 0).toLocaleString()}
                </p>
                <p>
                    <strong>Change:</strong> ₱{parseFloat(data.changeAmount || 0).toLocaleString()}
                </p>
            </div>
        </div>
    );
};

export default Receipt;
