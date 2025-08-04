import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { FaTrash, FaPlus, FaMinus, FaShoppingCart, FaMedkit } from 'react-icons/fa';
import { Button, Card, Modal, Form, Table } from 'react-bootstrap';
import '../assets/table.css';
import Receipt from './Receipt';
import AddImmunizationFormModal from '../components/Add/AddImmunizationFormModal';
import AddSurgicalFormModal from '../components/Add/AddSurgicalFormModal';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import AddClientAndPatientModal from '../components/Add/AddClientsModal';

const cartFromLocalStorage = JSON.parse(localStorage.getItem('cartItems') || '[]');

const PointofSales = () => {
    const [cartItems, setCartItems] = useState(cartFromLocalStorage);
    const [clients, setClients] = useState([]);
    const [selectedClient, setSelectedClient] = useState('');
    const [selectedPetsData, setSelectedPetsData] = useState([]); 
    const [clientPets, setClientPets] = useState([]);
    const [showReceipt, setShowReceipt] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [showInventory, setShowInventory] = useState(false);
    const [showServices, setShowServices] = useState(false);
    const [services, setServices] = useState([]);
    const [inventory, setInventory] = useState([]);
    const [receiptData, setReceiptData] = useState(null);
    const [paymentAmount, setPaymentAmount] = useState('');
    const [changeAmount, setChangeAmount] = useState(null);
    const [loggedInUser, setLoggedInUser] = useState(localStorage.getItem('first_name') || '');
    const [showCartModal, setShowCartModal] = useState(false);
    const [clientName, setClientName] = useState(""); // Track client name input
    const [unregisteredClientId, setUnregisteredClientId] = useState(null); // Store unregistered client ID
    const [clientEmail, setClientEmail] = useState("");

    const [showImmunizationModal, setShowImmunizationModal] = useState(false);
    const [showSurgicalModal, setShowSurgicalModal] = useState(false);
    const [serviceForForm, setServiceForForm] = useState(null); // Track service for the form modals

    const [immunizationFormData, setImmunizationFormData] = useState(null); // For Immunization Form
    const [surgicalFormData, setSurgicalFormData] = useState(null); // For Surgical Form
    const [isImmunizationFormComplete, setIsImmunizationFormComplete] = useState(false);
    const [isSurgicalFormComplete, setIsSurgicalFormComplete] = useState(false);

    const [errorMessage, setErrorMessage] = useState('');
    const [showAddClientModal, setShowAddClientModal] = useState(false);

    const [selectedPets, setSelectedPets] = useState(() => {
        const storedPets = localStorage.getItem("selectedPets");
        return storedPets ? JSON.parse(storedPets) : [];
    });
    
    useEffect(() => {
        if (selectedClient) {
            fetchPets(selectedClient); // Fetch pets for the selected client on load
        }
    }, [selectedClient]);
    

    const handleClientAdded = () => {
        setShowAddClientModal(false); // ✅ Close modal after adding a client
        fetchClients(); // ✅ Refresh client list
    
        // ✅ Show Success Toast
        toast.success("Client added successfully!");
    };

    const handleReferenceSelect = async (clientId) => {
        try {
            // Find the selected pet name from clientPets
            const selectedPetName = clientPets.find(pet =>
                selectedPets.includes(pet.pet_id)
            )?.pet_name;

            if (!selectedPetName) {
                console.warn("No pet name matched, skipping appointment service fetch.");
                return;
            }

            // Build the URL with optional pet_name
            const baseUrl = `http://localhost/api/POS-Integration/getAppointmentServices.php?client_id=${clientId}`;
            const url = selectedPetName
                ? `${baseUrl}&pet_name=${encodeURIComponent(selectedPetName)}`
                : baseUrl;

            const res = await axios.get(url);

            if (res.data.status === 1) {
                const fetchedServices = res.data.services;

                const newCartItems = fetchedServices.map(service => ({
                    id: service.id || service.name,
                    name: service.name,
                    price: parseFloat(service.price),
                    quantity: 1,
                    isService: true,
                    selectedPets: selectedPets, // Use selected pets if available
                }));

                setCartItems(prevCart => [...prevCart, ...newCartItems]);
            } else {
                console.warn("No arrived appointment found:", res.data.message || res.data);
            }
        } catch (err) {
            console.error("Error fetching appointment services", err);
        }
    };

    const handleClientChange = (e) => {
        const selectedClientId = e.target.value;
        setSelectedClient(selectedClientId);
        localStorage.setItem("selectedClient", selectedClientId);

        if (selectedClientId) {
            fetchPets(selectedClientId);
        } else {
            // Reset all when client is cleared
            setClientPets([]);
            setSelectedPets([]);
            setCartItems([]); // 🧼 Clear cart
            localStorage.removeItem("selectedPets");
        }
    };

    useEffect(() => {
    if (selectedClient && selectedPets.length > 0) {
        handleReferenceSelect(selectedClient);
    } else {
        setCartItems([]); // Clear cart if no pets are selected
    }
    }, [selectedPets, selectedClient]);
    
    
    const fetchPets = (clientId) => {
        if (clientId) {
            axios.get(`http://localhost:80/api/clients.php/${clientId}`)
                .then(response => {
                    const petsData = response.data.clients[0]?.pets;
                    if (petsData) {
                        setClientPets(petsData); // Set the pet list
                    } else {
                        console.error('Unexpected data structure:', response.data);
                        setClientPets([]); // Reset pet data if no pets found
                    }
                })
                .catch(error => {
                    console.error('API fetch error:', error);
                });
        }
    };
    
    const handlePetSelection = (event, petId) => {
        const isChecked = event.target.checked;

        if (isChecked) {
            setSelectedPets([petId]); // Only allow one pet
            localStorage.setItem("selectedPets", JSON.stringify([petId]));
        } else {
            setSelectedPets([]);
            localStorage.removeItem("selectedPets");
            setCartItems([]); // Clear cart
        }
    };
    
    useEffect(() => {
        const savedClient = localStorage.getItem('selectedClient');
        if (savedClient) {
            setSelectedClient(savedClient);
        }
    }, []);

    const handleCloseCartModal = () => {
        setShowCartModal(false); // Close modal
        setErrorMessage('');     // ✅ Reset error message
        setPaymentAmount('');
    };

    useEffect(() => {
        localStorage.setItem('cartItems', JSON.stringify(cartItems)); // Save cart items
    }, [cartItems]);
    
    useEffect(() => {
        const savedCart = JSON.parse(localStorage.getItem('cartItems') || '[]'); // Retrieve cart items
        setCartItems(savedCart);
    }, []);

    const handleServiceForm = (service) => {
        setServiceForForm(service); // Set the selected service first
        // Get the selected pet(s) data
        const selectedPetsData = clientPets.filter(pet => selectedPets.includes(pet.pet_id));
        setSelectedPetsData(selectedPetsData); // Set the data correctly once

    
        // Set the form data with the selected pets
        if (service.consent_form === 'Immunization Form') {
            setImmunizationFormData(prev => ({
                ...prev,
                client: selectedClient || "Guest",
                pet: selectedPetsData, // Pass selected pets
            }));
            setShowImmunizationModal(true); // Show the immunization modal
        } else if (service.consent_form === 'Surgical Form') {
            // Directly pass data to Surgical Form without waiting for Immunization Form
            setSurgicalFormData(prev => ({
                ...prev,
                client: selectedClient || "Guest",
                surgical_procedure: service.name || service.id,
                pet: selectedPetsData, // Pass selected pets
            }));
            setShowSurgicalModal(true); // Show Surgical Form modal
        }
    };
    
    
   
    
    
    

    useEffect(() => {
        localStorage.setItem('cartItems', JSON.stringify(cartItems));
    }, [cartItems]);

    useEffect(() => {
        fetchClients();
        fetchPets();
    }, []);

    useEffect(() => {
        if (showServices) {
            fetchServices();
        }
    }, [selectedClient, showServices]);

    const fetchClients = () => {
        axios.get('http://localhost:80/api/clients.php/')
            .then(response => {
                if (Array.isArray(response.data.clients)) {
                    setClients(response.data.clients);
                } else {
                    console.error('Invalid clients data:', response.data);
                }
            })
            .catch(error => {
                console.error('Error fetching clients:', error);
            });
    };

    const fetchInventory = () => {
        axios.get('http://localhost:80/api/inventory.php')
            .then(response => {
                const availableInventory = (response.data.inventory || []).filter(item => item.quantity > 0); // Filter items with quantity > 0
                setInventory(availableInventory); // Update the state with filtered inventory
            })
            .catch(error => {
                console.error('Error fetching inventory:', error);
            });
    };
    
    const fetchServices = () => {
        axios.get('http://localhost:80/api/services.php')
            .then(response => {
                let availableServices = response.data.filter(service => service.status === 'Available');
    
                if (!selectedClient) {
                    // ✅ Hide all services when no client is selected
                    availableServices = [];
                }
    
                setServices(availableServices);
            })
            .catch(error => {
                console.error('Error fetching services:', error);
            });
    };

    const addProductToCart = (item) => {
        const existingItem = cartItems.find(cartItem => cartItem.barcode === item.barcode);
        if (existingItem) {
            const updatedItems = cartItems.map(cartItem =>
                cartItem.barcode === item.barcode
                    ? { ...cartItem, quantity: cartItem.quantity + 1 }
                    : cartItem
            );
            setCartItems(updatedItems);
        } else {
            setCartItems([...cartItems, { ...item, quantity: 1, product_id: item.product_id }]);
        }
    
        toast.success(`${item.product_name} added to cart!`);

    };
    
    const addServiceToCart = (service) => {
        // Check if pets are selected
        if (selectedPets.length === 0) {
            toast.error('Please select a pet before adding the service to the cart!');
            return; // Exit if no pet is selected
        }
    
        // Check if the service already exists in the cart
        const existingService = cartItems.find(item => item.id === service.id && item.isService);
    
        // If the service doesn't exist in the cart, add it
        if (!existingService) {
            setCartItems([...cartItems, { ...service, isService: true, quantity: 1, selectedPets }]);
            toast.success(`${service.name} added to cart!`);
        }
    };
    

    const removeFromTable = (itemId, isService = false) => {
        const updatedItems = cartItems.filter(item => {
            if (isService) {
                // For services, match by `id`
                return item.id !== itemId || !item.isService;
            } else {
                // For products, match by `barcode`
                return item.barcode !== itemId;
            }
        });
        setCartItems(updatedItems);
    };
    

    const increaseQuantity = (itemId) => {
        const updatedItems = cartItems.map(item => {
            if (item.barcode === itemId && !item.isService) {
                // ✅ Find the corresponding stock from the fetched inventory
                const inventoryItem = inventory.find(inv => inv.barcode === item.barcode);
                const inventoryQuantity = inventoryItem ? inventoryItem.quantity : 0; // Get stock from API
                
                if (item.quantity < inventoryQuantity) {
                    return { ...item, quantity: item.quantity + 1 };
                } else {
                    toast.warning(`Only ${inventoryQuantity} available in stock!`, {
                        position: "top-right",
                        autoClose: 2000,
                        hideProgressBar: false,
                        closeOnClick: true,
                        pauseOnHover: true,
                        draggable: true,
                    });
                }
            }
            return item;
        });
    
        setCartItems(updatedItems);
    };
    
    
    

    const decreaseQuantity = (itemId) => {
        const updatedItems = cartItems.map(item =>
            item.barcode === itemId && item.quantity > 1 && !item.isService
                ? { ...item, quantity: item.quantity - 1 }
                : item
        );
        setCartItems(updatedItems);
    };

    const calculateGrandTotal = () => {
        return cartItems.reduce((total, item) => total + (parseFloat(item.price) * item.quantity), 0);
    };

    const handleConfirm = () => {
        setErrorMessage(""); // Reset previous errors
    
        // ✅ Check if the cart is empty before proceeding
        if (cartItems.length === 0) {
            setErrorMessage("Your cart is empty! Please add items before confirming.");
            return;
        }
    
        const grandTotal = calculateGrandTotal();
        const parsedPaymentAmount = parseFloat(paymentAmount);
    
        if (isNaN(parsedPaymentAmount)) {
            setErrorMessage("Invalid payment amount. Please enter a valid number.");
            return;
        }
    
        // ✅ Check if any service in the cart requires a form and validate completion
        const incompleteForms = cartItems.some((item) => {
            if (item.consent_form === "Immunization Form" && !isImmunizationFormComplete) {
                return true; // Immunization form incomplete
            }
            if (item.consent_form === "Surgical Form" && !isSurgicalFormComplete) {
                return true; // Surgical form incomplete
            }
            return false;
        });
    
        if (incompleteForms) {
            setErrorMessage("Please complete all required forms before confirming payment.");
            return;
        }
    
        // ✅ Calculate change amount
        const change = parsedPaymentAmount - grandTotal;
        setChangeAmount(change >= 0 ? change : null);
    
        // ✅ Clear error messages and proceed to confirmation modal
        setErrorMessage("");
        setShowConfirmModal(true);
    };
    
    
    

    const updateCartItemQuantity = (item, newQuantity) => {
        // Allow empty input while typing
        if (newQuantity === '') {
            setCartItems(prevCart =>
                prevCart.map(cartItem =>
                    cartItem.barcode === item.barcode
                        ? { ...cartItem, quantity: '' } // Temporarily store empty input
                        : cartItem
                )
            );
            return;
        }
    
        // Convert input to a valid integer
        const quantity = parseInt(newQuantity, 10);
    
        // Validate the input before updating
        if (isNaN(quantity) || quantity < 1) return;
    
        setCartItems(prevCart =>
            prevCart.map(cartItem =>
                cartItem.barcode === item.barcode
                    ? { ...cartItem, quantity }
                    : cartItem
            )
        );
    };
    
    const handleConfirmYes = async () => {
        try {
            setErrorMessage(""); // Reset previous errors
    
            let clientId = selectedClient; // Use selected client ID if available
            let unregisteredClientIdToUse = unregisteredClientId; // Store temporary unregistered client ID
    
            // Fetch the current tax rate
            const taxResponse = await axios.get("http://localhost:80/api/tax.php");
            const taxRate = taxResponse.data.status === 1 ? parseFloat(taxResponse.data.tax) : 0; // Default to 0 if not set
    
            // ✅ If no client is selected, ensure a client name is entered
            if (!clientId) {
                if (!clientName.trim()) {
                    setErrorMessage("Client name is required.");
                    return;
                }
    
                // ✅ Save unregistered client in the database
                try {
                    const clientResponse = await axios.post(
                        "http://localhost:80/api/unregistered_clients.php?action=create",
                        { 
                            name: clientName, 
                            email: clientEmail // Include email
                        }
                    );                    
    
                    if (clientResponse.data.status === 1) {
                        unregisteredClientIdToUse = clientResponse.data.unregistered_client_id; // Corrected variable
                        setUnregisteredClientId(unregisteredClientIdToUse); // Store in state
                    } else {
                        setErrorMessage("Failed to create unregistered client.");
                        return;
                    }
    
                    // Ensure `client_id` remains null for unregistered clients
                    clientId = null;
                } catch (error) {
                    console.error("Error saving unregistered client:", error);
                    setErrorMessage("Error saving client. Please try again.");
                    return;
                }
            }
    
            // Calculate grand total (sum of all items)
            const grandTotal = calculateGrandTotal();
    
            // Calculate tax amount
            const taxAmount = (grandTotal * (taxRate / 100)).toFixed(2);
    
            // Calculate subtotal (grand total - tax)
            const subtotal = (grandTotal - taxAmount).toFixed(2);
    
            // Ensure payment amount is set properly
            const amountTendered = parseFloat(paymentAmount) || 0;
            const changeAmount = (amountTendered - grandTotal).toFixed(2);
    
            // ✅ Use the newly created unregistered client ID if applicable
            const receiptData = {
                client_id: clientId || null, // Ensure null for unregistered clients
                unregistered_client_id: unregisteredClientIdToUse, // Corrected variable
                pet_id: selectedPets, // Handle multiple pets
                items: cartItems.map(item => ({
                    name: item.name || item.product_name,
                    sku: item.sku || '',
                    barcode: item.barcode || '',
                    quantity: item.isService ? 1 : item.quantity,
                    price: item.price,
                    total: (item.price * (item.isService ? 1 : item.quantity)).toFixed(2),
                    type: item.isService ? 'service' : 'product',
                })),
                grand_total: grandTotal.toFixed(2), // Grand total remains unchanged
                tax_amount: taxAmount, // Tax amount calculated separately
                subtotal: subtotal, // Subtotal = grand_total - tax_amount
                amount_tendered: amountTendered.toFixed(2), // ✅ Added amount tendered
                change_amount: changeAmount, // ✅ Added change calculation
                confirmed_by: loggedInUser,
            };
    
            console.log("📤 Sending Order Request:", receiptData);
    
            // Send order request
            const response = await axios.post('http://localhost:80/api/orders.php?action=create_order', receiptData);
    
            if (response.data.status === 1) {
                const generatedReceiptNumber = response.data.receipt_number || "Unknown";

                // UPDATE APPOINTMENT STATUS TO DONE
                const selectedPetName = clientPets.find(pet =>
                    selectedPets.includes(pet.pet_id)
                )?.pet_name;

                if (selectedPetName && clientId) {
                    try {
                        await axios.post('http://localhost/api/POS-Integration/updateAppointmentStatus.php', {
                            client_id: clientId,
                            pet_name: selectedPetName,
                            status: 'Done'
                        });
                        console.log("Appointment status updated to Done.");
                    } catch (err) {
                        console.error("Failed to update appointment status", err);
                    }
                }
    
                setReceiptData({
                    receiptNumber: generatedReceiptNumber,
                    client_id: clientId || null,
                    pet_id: selectedPets, // Handle multiple pets
                    unregistered_client_id: unregisteredClientIdToUse, // Corrected variable
                    items: cartItems,
                    grand_total: grandTotal.toFixed(2), // Keep grand total
                    tax_amount: taxAmount, // Display tax amount
                    subtotal: subtotal, // Display subtotal after tax
                    amount_tendered: amountTendered.toFixed(2), // ✅ Added amount tendered
                    changeAmount: changeAmount, // ✅ Added change amount
                    confirmed_by: loggedInUser,
                });
    
                // Update UI after state is set
                setShowReceipt(true);
                setPaymentAmount("");
                setCartItems([]);
                setShowConfirmModal(false);
                setShowCartModal(false);
                setClientPets("");
                setSelectedPets("");
                setSelectedClient("");
            } else {
                setErrorMessage(`❌ Order failed: ${response.data.message}`);
                console.error("🚨 Order creation failed:", response.data);
            }
        } catch (error) {
            console.error("❌ Error while sending order:", error);
            setErrorMessage("An error occurred while placing the order. Please try again.");
        }
    };

    const handleConfirmNo = () => {
        setShowConfirmModal(false);
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat('en-US', { 
            minimumFractionDigits: 2, 
            maximumFractionDigits: 2 
        }).format(price);
    };

    return (
        <div className='container mt-2'>
<div className="d-flex justify-content-between align-items-center">

    <h1 style={{ fontWeight: 'bold' }}>Point of Sales</h1>
    
    <div style={{ position: 'relative', display: 'inline-block' }}>
        <FaShoppingCart
            style={{ fontSize: '3rem', cursor: 'pointer', color: 'black' }}
            onClick={() => setShowCartModal(true)}
        />
        {cartItems.length > 0 && (
            <span
                style={{
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    background: 'red',
                    color: 'white',
                    borderRadius: '50%',
                    padding: '0.05rem 0.5rem',
                    fontSize: '0.8rem',
                    fontWeight: 'bold',
                }}
            >
                {cartItems.length}
            </span>
        )}
    </div>
</div>

            <div className="mb-4">
                {/* ✅ Label and Plus Button on the Same Row */}
                <div className="d-flex align-items-center gap-2">
                    <label htmlFor="clientSelect" className="form-label mb-0" style={{ minWidth: "120px" }}>
                        Select Client:
                    </label>

                    <button 
                        className="btn btn-success d-flex align-items-center justify-content-center"
                        onClick={() => setShowAddClientModal(true)}
                        style={{ padding: '6px 10px' }} // Adjust padding for better size
                    >
                        <FaPlus />
                    </button>
                </div>

{/* ✅ Dropdown Below */}
<select
    id="clientSelect"
    className="form-select mt-2"
    value={selectedClient}
    onChange={handleClientChange}
    style={{ width: '100%' }}
>
    <option value="">Select a client</option>
    {clients.map((client, index) => (
        <option key={index} value={client.id}>{client.name}</option>
    ))}
</select>


                {/* Show pets and checkboxes if a client is selected */}
                {clientPets.length > 0 && (
    <div className="mt-3">
        <p>Select pets:</p>
        <div style={{ display: 'flex', flexWrap: 'wrap' }}> {/* Flex container for horizontal layout */}
            {clientPets.map((pet) => (
                <div key={pet.pet_id} style={{ marginRight: '15px', marginBottom: '10px' }}> {/* Spacing between items */}
                    <input
                        type="checkbox"
                        id={`pet-${pet.pet_id}`} // Unique ID for each pet
                        value={pet.pet_id}
                        onChange={(e) => handlePetSelection(e, pet.pet_id)} // Handle pet selection/deselection
                        checked={selectedPets.includes(pet.pet_id)} // Bind the checked state
                        style={{ display: 'none' }} // Hide the default checkbox
                    />
                    <label 
                        htmlFor={`pet-${pet.pet_id}`} 
                        className="ms-2"
                        style={{
                            cursor: 'pointer',
                            position: 'relative',
                            paddingLeft: '25px',
                            lineHeight: '1.5',
                        }}
                    >
                        {/* Custom checkbox */}
                        <span
                            style={{
                                position: 'absolute',
                                left: '0',
                                top: '0',
                                width: '20px',
                                height: '20px',
                                border: '1px solid #000',
                                backgroundColor: selectedPets.includes(pet.pet_id) ? '#007BFF' : '#fff',
                                color: selectedPets.includes(pet.pet_id) ? 'white' : 'transparent',
                                textAlign: 'center',
                                fontSize: '14px',
                                fontWeight: 'bold',
                                borderRadius: '4px',
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                            }}
                        >
                            {selectedPets.includes(pet.pet_id) ? '✓' : ''}
                        </span>
                        {pet.pet_name} {/* Display pet name */}
                    </label>
                </div>
            ))}
        </div>
    </div>
)}


     </div>
            <div className="d-flex justify-content-around mt-4">
                <Card style={{ width: '18rem' }} onClick={() => { fetchInventory(); setShowInventory(true); setShowServices(false); }}>
                    <Card.Body>
                        <Card.Title className="text-center">
                            Product 
                        </Card.Title>
                        <div className="text-center">
                            <FaShoppingCart style={{ fontSize: '50px' }} />
                        </div>
                        <Card.Text className="text-center">Click to view and add items to the cart.</Card.Text>
                    </Card.Body>
                </Card>
                <Card 
                    style={{ width: '18rem' }} 
                    onClick={() => {
                        if (!selectedClient) {
                            // ✅ Show Toast Notification
                            toast.warning("Please select a client first!", {
                                position: "top-right",
                                autoClose: 2000,
                                hideProgressBar: false,
                                closeOnClick: true,
                                pauseOnHover: true,
                                draggable: true,
                            });
                            return; // ✅ Stop function execution if no client is selected
                        }

                        fetchServices(); // ✅ Fetch services only if a client is selected
                        setShowServices(true);
                        setShowInventory(false);
                    }}
                >
                    <Card.Body>
                        <Card.Title className="text-center">
                            Services 
                        </Card.Title>
                        <div className="text-center">
                            <FaMedkit style={{ fontSize: '50px' }} />
                        </div>
                        <Card.Text className="text-center">Click to view and add services to the cart.</Card.Text>
                    </Card.Body>
                </Card>
            </div>

            {showInventory && (
                <div className="table-responsive mt-4">
                    <h3>Available Inventory</h3>
                    <table className="table table-striped table-hover">
                        <thead>
                            <tr>
                                <th>Barcode</th>
                                <th>Name</th>
                                <th>Supplier</th>
                                <th>Brand</th>
                                <th>Price</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {inventory.map((item, index) => (
                                <tr key={index}>
                                    <td>{item.barcode}</td>
                                    <td> {item.product_name}  </td>
                                    <td>{item.supplier_name}</td>               
                                    <td>{item.brand_name}</td>
                                    <td>₱{formatPrice(item.price)}</td>
                                    <td>
                                        <Button variant="success" onClick={() => addProductToCart(item)}>Add to Cart</Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {showServices && (
                <div className="table-responsive mt-4">
                    <h3>Available Services</h3>
                    <table className="table table-striped table-hover">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Price</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {services.map((service, index) => (
                                <tr key={index}>
                                    <td>{service.name}</td>
                                    <td>₱{formatPrice(service.price)}</td>
                                    <td>
                                        <Button variant="success" onClick={() => addServiceToCart(service)}>Add to Cart</Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Cart Modal */}
            <Modal show={showCartModal} onHide={handleCloseCartModal} size="xl" centered>
    <Modal.Header closeButton>
        <Modal.Title>Cart Items</Modal.Title>
    </Modal.Header>
    <Modal.Body>
        <div className="table-responsive">
            <Table striped bordered hover>
                <thead>
                    <tr>
                        <th>Barcode</th>
                        <th>Name</th>
                        <th>Price</th>
                        <th>Quantity</th>
                        <th>Total</th>
                        <th>Type</th>
                        <th>Action</th>
                        <th>Form</th>
                    </tr>
                </thead>
                <tbody>
                    {cartItems.map((item, index) => (
                        <tr key={index}>
                            <td>{item.barcode}</td>
                            <td>{item.name ? item.name : item.product_name}</td>
                            <td>₱{parseFloat(item.price).toLocaleString()}</td>
                            <td style={{ padding: '0', margin: '0', height: '100%', background: 'transparent', border: 'none' }}>
                                <Form.Control
                                    type="number"
                                    min="1"
                                    max={(() => {
                                        const inventoryItem = inventory.find(inv => inv.barcode === item.barcode);
                                        return inventoryItem ? inventoryItem.quantity : 1; // ✅ Get stock from API
                                    })()}
                                    value={item.quantity}
                                    onChange={(e) => {
                                        let newQuantity = parseInt(e.target.value, 10) || 1; // Default to 1 if empty or invalid

                                        // ✅ Find the inventory stock dynamically
                                        const inventoryItem = inventory.find(inv => inv.barcode === item.barcode);
                                        const inventoryQuantity = inventoryItem ? inventoryItem.quantity : 1;

                                        if (newQuantity > inventoryQuantity) {
                                            newQuantity = inventoryQuantity; // ✅ Prevent exceeding stock
                                            
                                            // ✅ Show toast notification for stock limit
                                            toast.warning(`Only ${inventoryQuantity} available in stock!`, {
                                                position: "top-right",
                                                autoClose: 2000,
                                                hideProgressBar: false,
                                                closeOnClick: true,
                                                pauseOnHover: true,
                                                draggable: true,
                                            });
                                        }
                                        updateCartItemQuantity(item, newQuantity);
                                    }}
                                    onBlur={(e) => {
                                        if (!e.target.value) {
                                            updateCartItemQuantity(item, 1); // ✅ Reset to 1 if left empty
                                        }
                                    }}
                                    style={{
                                        width: '50px',
                                        height: '80%',
                                        textAlign: 'center',
                                        border: 'none',
                                        outline: 'none',
                                        boxShadow: 'none',
                                        background: 'transparent',
                                        lineHeight: 'normal',
                                        padding: '10px 0',
                                    }}
                                    className="quantity-input"
                                />
                            </td>

                            <td>₱{formatPrice(item.price * item.quantity)}</td>
                            <td>{item.isService ? 'Service' : 'Product'}</td>
                            <td>
                                <Button variant="success" onClick={() => increaseQuantity(item.barcode)}>
                                    <FaPlus />
                                </Button>{' '}
                                <Button variant="warning" onClick={() => decreaseQuantity(item.barcode)}>
                                    <FaMinus />
                                </Button>{' '}
                                <Button
                                    variant="danger"
                                    onClick={() =>
                                        removeFromTable(item.isService ? item.id : item.barcode, item.isService)
                                    }
                                >
                                    <FaTrash />
                                </Button>
                            </td>
                            <td>
    {item.isService && item.consent_form && item.consent_form.trim() !== "None" ? (
        <Button variant="info" onClick={() => handleServiceForm(item)}>
            {item.consent_form}
        </Button>
    ) : null}
</td>

                        </tr>
                    ))}
                </tbody>
            </Table>

            <h4>Grand Total: ₱{formatPrice(calculateGrandTotal())}</h4>

            <Form.Group className="mb-3">
                <Form.Label>Amount tendered:</Form.Label>
                <Form.Control
                    type="number"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                />
                {/* Error Message */}
                {errorMessage && (
                    <div style={{ color: 'red', marginTop: '5px', fontSize: '0.9rem' }}>
                        {errorMessage}
                    </div>
                )}
            </Form.Group>
        </div>
    </Modal.Body>
    <Modal.Footer>
        <Button variant="secondary" onClick={() => setShowCartModal(false)}>
            Close
        </Button>
        <Button variant="primary" onClick={handleConfirm}>
            Confirm Payment
        </Button>
    </Modal.Footer>

            
                <AddImmunizationFormModal
                show={showImmunizationModal}
                handleClose={() => setShowImmunizationModal(false)}
                formData={immunizationFormData}
                setFormData={setImmunizationFormData}
                selectedClient={selectedClient}
                selectedPetsData={selectedPetsData} // Make sure this is passed correctly
                onFormAdded={() => {
                    setShowImmunizationModal(false);
                    setIsImmunizationFormComplete(true);
                }}
            />

            {/* Surgical Form Modal */}
            <AddSurgicalFormModal
                show={showSurgicalModal}
                handleClose={() => setShowSurgicalModal(false)}
                formData={surgicalFormData}
                setFormData={setSurgicalFormData}
                selectedClient={selectedClient}
                selectedPetsData={selectedPetsData} // Make sure this is passed correctly
                serviceForForm={serviceForForm} // ✅ Pass the selected service
                onFormAdded={() => {
                    setShowSurgicalModal(false);
                    setIsSurgicalFormComplete(true);
                }}
            />

            </Modal>
                {/* Confirm Modal */}
                <Modal show={showConfirmModal} onHide={handleConfirmNo}>
    <Modal.Header closeButton>
        <Modal.Title>Confirm Payment</Modal.Title>
    </Modal.Header>
    <Modal.Body>
        {/* Show input for client name only if no client ID exists */}
        {!selectedClient && (
    <div className="mb-3">
        <label>Client Name:</label>
        <input
            type="text"
            className="form-control"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            placeholder="Enter client name"
            required
        />
    </div>
)}

{!selectedClient && (
    <div className="mb-3">
        <label>Client Email:</label>
        <input
            type="email"
            className="form-control"
            value={clientEmail}
            onChange={(e) => setClientEmail(e.target.value)}
            placeholder="Enter client email"
            required
        />
    </div>
)}


        {changeAmount !== null ? (
            <p>Payment confirmed! Change: ₱{formatPrice(changeAmount)}</p>
        ) : (
            <p>Insufficient payment. Please enter a valid amount.</p>
        )}
    </Modal.Body>
    <Modal.Footer>
        <Button variant="secondary" onClick={handleConfirmNo}>
            Close
        </Button>
        <Button variant="primary" onClick={handleConfirmYes} disabled={changeAmount === null}>
            Confirm
        </Button>
    </Modal.Footer>
</Modal>


            {/* Receipt Modal */}
            <Modal show={showReceipt} onHide={() => setShowReceipt(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Receipt</Modal.Title>
                </Modal.Header>
                <Modal.Body id="receipt-content">
                    {receiptData && <Receipt data={receiptData} />}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowReceipt(false)}>
                        Close
                    </Button>
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

            <AddClientAndPatientModal 
            show={showAddClientModal} 
            handleClose={() => setShowAddClientModal(false)} 
            onCategoryAdded={handleClientAdded} 
            />
        </div>
    );
};

export default PointofSales;
