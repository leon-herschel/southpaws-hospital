import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { FaTrash, FaPlus, FaMinus, FaShoppingCart, FaMedkit } from 'react-icons/fa';
import { Button, Card, Modal, Form, Table, ToggleButton, Row, Col } from 'react-bootstrap';
import '../assets/table.css';
import Receipt from './Receipt';
import AddImmunizationFormModal from '../components/Add/AddImmunizationFormModal';
import AddSurgicalFormModal from '../components/Add/AddSurgicalFormModal';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import AddClientAndPatientModal from '../components/Add/AddClientsModal';
import Select from "react-select";

const cartFromLocalStorage = JSON.parse(localStorage.getItem('cartItems') || '[]');

const PointofSales = () => {
    const [cartItems, setCartItems] = useState(cartFromLocalStorage);
    const [clients, setClients] = useState([]);
    const [selectedClient, setSelectedClient] = useState(null);
    const [selectedPetsData, setSelectedPetsData] = useState([]); 
    const [clientPets, setClientPets] = useState([]);
    const [showReceipt, setShowReceipt] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [isConfirming, setIsConfirming] = useState(false);
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
    const [searchTerm, setSearchTerm] = useState("");
    const [hasManuallySelectedClient, setHasManuallySelectedClient] = useState(false);
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

    const handleClientSelect = (option) => {
        const selectedClientId = option ? option.value : null;
        setSelectedClient(selectedClientId);
        setHasManuallySelectedClient(true);

        if (selectedClientId) {
            localStorage.setItem("selectedClient", selectedClientId);
            fetchPets(selectedClientId);
            setSelectedPets([]);
            setCartItems([]);
            localStorage.removeItem("selectedPets");
        } else {
            setClientPets([]);
            setSelectedPets([]);
            setCartItems([]);
            localStorage.removeItem("selectedPets");
            localStorage.removeItem("selectedClient");
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
        } else {
            setSelectedClient(null);
        }
    }, []);


    const handleCloseCartModal = () => {
        setShowCartModal(false); 
        setErrorMessage('');     
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
        if (isConfirming) return;

        setIsConfirming(true);
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
                    setIsConfirming(false);
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
    
            if (!hasManuallySelectedClient) {
                clientId = null;
            }
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
                    client_id: hasManuallySelectedClient ? clientId : null,
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
                setSelectedClient(null);
                setClientPets([]);
                setSelectedPets([]);
                localStorage.removeItem("selectedClient");
                localStorage.removeItem("selectedPets");
            } else {
                setErrorMessage(`Order failed: ${response.data.message}`);
                console.error("Order creation failed:", response.data);
            }
        } catch (error) {
            console.error("Error while sending order:", error);
            setErrorMessage("An error occurred while placing the order. Please try again.");
        } finally {
            setIsConfirming(false); // Reset button state
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
            <div className="d-flex justify-content-between align-items-center mb-2">

                <h1 style={{ fontWeight: 'bold' }}>Point of Sales</h1>
                
                <div style={{ position: 'relative', display: 'inline-block' }}>
                    <FaShoppingCart
                        className="cart-icon"
                        style={{ fontSize: '3rem', cursor: 'pointer', color: 'black' }}
                        onClick={() => setShowCartModal(true)}
                        title="View Cart"
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

            {/* Client Selection Section */}
            <Card className="mb-3 shadow-sm">
            <Card.Body>
                <div className="d-flex justify-content-between align-items-center mb-3">
                <h6 className="mb-0">Select Client</h6>
                <button 
                    className="btn btn-success btn-sm d-flex align-items-center"
                    onClick={() => setShowAddClientModal(true)}
                >
                    <FaPlus className="me-1" /> Add Client
                </button>
                </div>

                <Select
                    id="clientSelect"
                    className="mt-2"
                    options={clients.map(client => ({
                        value: client.id,
                        label: client.name
                    }))}
                    value={clients
                        .map(client => ({ value: client.id, label: client.name }))
                        .find(option => option.value === selectedClient) || null
                    }
                    onChange={option => handleClientSelect(option)}
                    placeholder="Select or search for a client..."
                    isSearchable={true}
                />
            </Card.Body>
            </Card>

            {/* Pet Selection Section */}
            {hasManuallySelectedClient && selectedClient && clientPets.length > 0 && (
            <Card className="mb-3 shadow-sm">
                <Card.Body>
                <h6 className="mb-3">Select Pet</h6>
                <div className="d-flex flex-wrap gap-2">
                    {clientPets.map((pet) => (
                    <ToggleButton
                        key={pet.pet_id}
                        id={`pet-${pet.pet_id}`}
                        type="checkbox"
                        variant={selectedPets.includes(pet.pet_id) ? "primary" : "outline-primary"}
                        value={pet.pet_id}
                        checked={selectedPets.includes(pet.pet_id)}
                        onChange={(e) => handlePetSelection(e, pet.pet_id)}
                    >
                        {pet.pet_name}
                    </ToggleButton>
                    ))}
                </div>
                </Card.Body>
            </Card>
            )}

            <div className="d-flex justify-content-around mt-4 mb-4">
                <Row className="mt-4">
                    <Col md={6}>
                        <Card 
                            className={`h-100 shadow-sm p-3 card-clickable ${showInventory ? "active" : ""}`}
                            onClick={() => { 
                                fetchInventory(); 
                                setShowInventory(true); 
                                setShowServices(false); 
                                setTimeout(() => document.getElementById("inventory-section")?.scrollIntoView({ behavior: "smooth" }), 100);
                            }}
                            >
                            <Card.Body>
                                <Card.Title className="text-center">
                                    Products
                                </Card.Title>
                                <div className="text-center mb-2">
                                    <FaShoppingCart style={{ fontSize: '75px' }} />
                                </div>
                                <Card.Text className="text-center">Click to view and add items to the cart.</Card.Text>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={6}>
                        <Card 
                            className={`h-100 shadow-sm p-3 card-clickable ${showServices ? "active" : ""}`}
                            onClick={() => {
                                if (!selectedClient) {
                                toast.warning("Please select a client first.", { autoClose: 2000 });
                                return;
                                }
                                fetchServices();
                                setShowServices(true);
                                setShowInventory(false);
                                setTimeout(() => document.getElementById("services-section")?.scrollIntoView({ behavior: "smooth" }), 100);
                            }}
                            >
                            <Card.Body>
                                <Card.Title className="text-center">
                                    Services 
                                </Card.Title>
                                <div className="text-center mb-2">
                                    <FaMedkit style={{ fontSize: '75px' }} />
                                </div>
                                <Card.Text className="text-center">Click to view and add services to the cart.</Card.Text>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            </div>
            <hr className='mt-4'/> 

            {showInventory && (
            <div id="inventory-section" className="table-responsive mt-4">
                <h3 className="mb-3">Available Inventory</h3>
                <Form.Control
                type="text"
                placeholder="Search items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="shadow-sm"
                style={{ maxWidth: "300px" }}
                />

                <table className="table table-striped table-hover align-middle shadow-sm">
                <thead className='table-light'>
                    <tr>
                    <th>Barcode</th>
                    <th>Name</th>
                    <th>Supplier</th>
                    <th>Brand</th>
                    <th>Price</th>
                    <th className='text-center'>Action</th>
                    </tr>
                </thead>
                <tbody>
                    {inventory
                    .filter(item =>
                        searchTerm === "" ||
                        item.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        item.brand_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        item.supplier_name.toLowerCase().includes(searchTerm.toLowerCase())
                    )
                    .map((item, index) => (
                        <tr key={index}>
                        <td>{item.barcode}</td>
                        <td>{item.product_name}</td>
                        <td>{item.supplier_name}</td>
                        <td>{item.brand_name}</td>
                        <td>₱{formatPrice(item.price)}</td>
                        <td className="text-center">
                            <Button
                            variant="success"
                            onClick={() => addProductToCart(item)}
                            >
                            Add to Cart
                            </Button>
                        </td>
                        </tr>
                    ))}
                </tbody>
                </table>
            </div>
            )}

            {showServices && (
            <div id="services-section" className="table-responsive mt-4">
                <h3 className="mb-3">Available Services</h3>
                <Form.Control
                type="text"
                placeholder="Search services..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="shadow-sm"
                style={{ maxWidth: "300px" }}
                />

                <table className="table table-striped table-hover align-middle shadow-sm">
                <thead className="table-light">
                    <tr>
                    <th>Name</th>
                    <th>Price</th>
                    <th className='text-center'>Action</th>
                    </tr>
                </thead>
                <tbody>
                    {services
                    .filter(service =>
                        searchTerm === "" ||
                        service.name.toLowerCase().includes(searchTerm.toLowerCase())
                    )
                    .map((service, index) => (
                        <tr key={index}>
                        <td>{service.name}</td>
                        <td>₱{formatPrice(service.price)}</td>
                        <td className='text-center'>
                            <Button
                            variant="success"
                            onClick={() => addServiceToCart(service)}
                            >
                            Add to Cart
                            </Button>
                        </td>
                        </tr>
                    ))}
                </tbody>
                </table>
            </div>
            )}

            {/* Cart Modal */}
            <Modal show={showCartModal} onHide={handleCloseCartModal} size="xl" centered>
                <Modal.Header closeButton className="bg-light">
                    <Modal.Title className="fw-bold align">
                    Cart Summary
                    </Modal.Title>
                </Modal.Header>

                <Modal.Body>
                    <div className="table-responsive shadow-sm rounded p-2">
                    <Table hover bordered className="align-middle text-center">
                        <thead className='table-light'>
                        <tr>
                            <th>Barcode</th>
                            <th>Name</th>
                            <th>Price</th>
                            <th style={{ width: "120px" }}>Quantity</th>
                            <th>Total</th>
                            <th>Type</th>
                            <th>Action</th>
                            <th>Form</th>
                        </tr>
                        </thead>
                        <tbody>
                        {cartItems.map((item, index) => (
                            <tr key={index}>
                            <td className="text-muted">{item.barcode}</td>
                            <td className="fw-semibold">
                                {item.name ? item.name : item.product_name}
                            </td>
                            <td>₱{parseFloat(item.price).toLocaleString()}</td>

                            {/* Quantity Input */}
                            <td>
                                <Form.Control
                                type="number"
                                min="1"
                                max={(() => {
                                    const inventoryItem = inventory.find(
                                    (inv) => inv.barcode === item.barcode
                                    );
                                    return inventoryItem ? inventoryItem.quantity : 1;
                                })()}
                                value={item.quantity}
                                onChange={(e) => {
                                    let newQuantity = parseInt(e.target.value, 10) || 1;
                                    const inventoryItem = inventory.find(
                                    (inv) => inv.barcode === item.barcode
                                    );
                                    const inventoryQuantity = inventoryItem
                                    ? inventoryItem.quantity
                                    : 1;

                                    if (newQuantity > inventoryQuantity) {
                                    newQuantity = inventoryQuantity;
                                    toast.warning(
                                        `Only ${inventoryQuantity} available in stock!`,
                                        { autoClose: 2000 }
                                    );
                                    }
                                    updateCartItemQuantity(item, newQuantity);
                                }}
                                onBlur={(e) => {
                                    if (!e.target.value) {
                                    updateCartItemQuantity(item, 1);
                                    }
                                }}
                                className="text-center shadow-sm"
                                />
                            </td>

                            <td className="fw-bold text-success">
                                ₱{formatPrice(item.price * item.quantity)}
                            </td>
                            <td>
                                {item.isService ? "Service" : "Product"}
                            </td>

                            {/* Actions */}
                            <td>
                                <div className="d-flex justify-content-center gap-2">
                                <Button
                                    size="sm"
                                    variant="success"
                                    onClick={() => increaseQuantity(item.barcode)}
                                >
                                    <FaPlus />
                                </Button>
                                <Button
                                    size="sm"
                                    variant="warning"
                                    onClick={() => decreaseQuantity(item.barcode)}
                                >
                                    <FaMinus />
                                </Button>
                                <Button
                                    size="sm"
                                    variant="danger"
                                    onClick={() =>
                                    removeFromTable(
                                        item.isService ? item.id : item.barcode,
                                        item.isService
                                    )
                                    }
                                >
                                    <FaTrash />
                                </Button>
                                </div>
                            </td>

                            {/* Service Form */}
                            <td>
                                {item.isService &&
                                item.consent_form &&
                                item.consent_form.trim() !== "None" && (
                                    <Button
                                    size="sm"
                                    variant="info"
                                    onClick={() => handleServiceForm(item)}
                                    >
                                    {item.consent_form}
                                    </Button>
                                )}
                            </td>
                            </tr>
                        ))}
                        </tbody>
                    </Table>
                    </div>

                    {/* Summary */}
                    <div className="mt-4 p-3 bg-light rounded shadow-sm">
                    <h4 className="fw-bold text-end">
                        Grand Total:{" "}
                        <span className="text-success">
                        ₱{formatPrice(calculateGrandTotal())}
                        </span>
                    </h4>

                    <Form.Group className="mt-3">
                        <Form.Label className="fw-semibold">Amount Tendered</Form.Label>
                        <Form.Control
                        type="number"
                        value={paymentAmount}
                        className='shadow-sm'
                        onChange={(e) => setPaymentAmount(e.target.value)}
                        placeholder="Enter amount..."
                        />
                        {errorMessage && (
                        <small className="text-danger mt-1 d-block">{errorMessage}</small>
                        )}
                    </Form.Group>
                    </div>
                </Modal.Body>

                <Modal.Footer className="bg-light">
                    <Button variant="secondary" onClick={() => setShowCartModal(false)}>Close</Button>
                    <Button variant="success" onClick={handleConfirm}> Confirm Payment</Button>
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
            <Modal show={showConfirmModal} onHide={handleConfirmNo} centered>
                <Modal.Header closeButton>
                    <Modal.Title className="fw-bold">Confirm Payment</Modal.Title>
                </Modal.Header>

                <Modal.Body>
                    {/* Show input for client name/email only if no client ID exists */}
                    {!selectedClient && (
                    <>
                        <div className="form-floating mb-3">
                        <input
                            type="text"
                            className="form-control"
                            id="clientName"
                            value={clientName}
                            onChange={(e) => setClientName(e.target.value)}
                            placeholder="Enter client name"
                            required
                        />
                        <label htmlFor="clientName">Client Name</label>
                        </div>

                        <div className="form-floating mb-3">
                        <input
                            type="email"
                            className="form-control"
                            id="clientEmail"
                            value={clientEmail}
                            onChange={(e) => setClientEmail(e.target.value)}
                            placeholder="Enter client email"
                            required
                        />
                        <label htmlFor="clientEmail">Client Email</label>
                        </div>
                    </>
                    )}

                    <div className="text-center">
                    {changeAmount !== null ? (
                    <div className="p-3 mb-3 rounded bg-light border">
                        <h5 className="mb-1 text-muted">Change</h5>
                        <h3 className="mb-0 text-success">₱{formatPrice(changeAmount)}</h3>
                    </div>
                    ) : (
                    <div className="p-2 mb-3 text-danger">
                        Insufficient payment. Please enter a valid amount.
                    </div>
                    )}
                    </div>
                </Modal.Body>

                <Modal.Footer className="d-flex justify-content-between">
                    <Button variant="secondary" onClick={handleConfirmNo}>
                    Cancel
                    </Button>
                    <Button
                    variant="primary"
                    onClick={handleConfirmYes}
                    disabled={changeAmount === null || isConfirming}
                    >
                    {isConfirming ? (
                        <>
                        Processing...
                        </>
                    ) : (
                        "Confirm Payment"
                    )}
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
