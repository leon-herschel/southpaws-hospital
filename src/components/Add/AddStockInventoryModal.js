import React, { useState, useEffect, useRef } from 'react';
import { Modal, Button, Form, Row } from 'react-bootstrap';
import axios from 'axios';
import '../../assets/add.css';

const AddStockInventoryModal = ({ show, handleClose, inventoryItem, handleEditSubmit }) => {
    const [item, setItem] = useState(null);
    const [loading, setLoading] = useState(true);
    const [addQuantity, setAddQuantity] = useState('');
    const brandNameRef = useRef(null);
    
    useEffect(() => {
        if (show && brandNameRef.current) {
            brandNameRef.current.focus(); // ✅ Auto-focus when modal opens
        }
    }, [show]);    

    useEffect(() => {
        if (inventoryItem && Object.keys(inventoryItem).length > 0) {
            setItem(inventoryItem); // Use the provided inventory item data
            setLoading(false);
        } else {
            setLoading(false);
            setItem(null); // Reset if inventoryItem is invalid
        }
    }, [inventoryItem]);
    
    const handleInputChange = (e) => {
        const value = e.target.value;
    
        // Allow negative numbers, including the "-" sign alone
        if (value === '' || value === '-' || !isNaN(value)) {
            setAddQuantity(value);
        }
    };
    

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!item || isNaN(addQuantity)) {
            console.error('Valid inventory item and quantity are required.');
            return;
        }
        

        // Prepare the data for adding stock
        const dataToSubmit = {
            id: item.id, // Inventory ID
            add_to_quantity: parseInt(addQuantity, 10), // Quantity to add
        };

        // Update the inventory in the backend
        axios
            .put('http://localhost:80/api/inventory.php', dataToSubmit)
            .then((response) => {
                if (response.data.status === 1) {
                    console.log('Stock added successfully:', response.data);
                    handleEditSubmit(); // Refresh parent state or perform additional actions
                    handleClose(); // Close the modal
                } else {
                    console.error('Failed to add stock:', response.data.message);
                }
            })
            .catch((error) => {
                console.error('Error adding stock:', error);
            });
    };

    return (
        <Modal show={show} onHide={handleClose} className="custom-modal">
            <Modal.Header closeButton>
                <Modal.Title>Add Stock</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {loading ? (
                    <div>Loading...</div>
                ) : item ? (
                    <Form onSubmit={handleSubmit}>
                        <Row>
                            <Form.Group>
                                <Form.Label>Current Quantity</Form.Label>
                                <Form.Control
                                    type="text"
                                    value={item.quantity || ''}
                                    readOnly
                                />
                            </Form.Group>
                            <Form.Group>
                                <Form.Label>Add Quantity</Form.Label>
                                <Form.Control
                                    type="number"
                                    name="addQuantity"
                                    ref={brandNameRef} // ✅ Attach ref to input field
                                    value={addQuantity}
                                    onChange={handleInputChange}
                                    placeholder="Enter quantity to add"
                                />
                            </Form.Group>
                        </Row>

                        <div className="button-container">
                            <Button variant="primary" type="submit" className="button">
                                Add Stock
                            </Button>
                        </div>
                    </Form>
                ) : (
                    <div>Error: Inventory item not found</div>
                )}
            </Modal.Body>
        </Modal>
    );
};

export default AddStockInventoryModal;
