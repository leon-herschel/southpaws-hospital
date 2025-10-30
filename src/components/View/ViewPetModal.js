import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Row, Col, Table } from 'react-bootstrap';
import { FaEye } from 'react-icons/fa'; // Icon for viewing medical history
import '../../assets/add.css'; // Assuming you have custom styles
import ViewPatientMedicalRecordModal from '../View/ViewPatientMedicalRecordModal'; // Modal component to view medical history details
import PatientMedicalRecordModal from '../Add/AddPatientMedicalRecordModal'; // Modal component to view medical history details
import { toast } from 'react-toastify'; // Import Toastify

const ViewPetModal = ({ show, handleClose, pet }) => {
    const [loading, setLoading] = useState(true);
    const [patientHistory, setPatientHistory] = useState(pet?.patientHistory || []);
    const [calculatedAge, setCalculatedAge] = useState('');
    const [showAddMedicalRecordModal, setShowAddMedicalRecordModal] = useState(false); // For adding medical history
    const [showViewMedicalRecordModal, setShowViewMedicalRecordModal] = useState(false); // For viewing medical history
    const [selectedHistory, setSelectedHistory] = useState(null); // To store selected history for viewing
    const [availedServices, setAvailedServices] = useState([]);
    const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

    const handleOpenAddMedicalRecordModal = () => {
        setShowAddMedicalRecordModal(true);
    };

    const handleCloseAddMedicalRecordModal = () => {
        setShowAddMedicalRecordModal(false);
    };

    const handleOpenViewMedicalRecordModal = (history) => {
        setSelectedHistory(history);
        setShowViewMedicalRecordModal(true);
    };

    const handleCloseViewMedicalRecordModal = () => {
        setShowViewMedicalRecordModal(false);
    };

    const calculateAge = (birthdate) => {
        const today = new Date();
        const birth = new Date(birthdate);
    
        let years = today.getFullYear() - birth.getFullYear();
        let months = today.getMonth() - birth.getMonth();
        let days = today.getDate() - birth.getDate();
    
        if (days < 0) {
            months--;
            const lastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
            days += lastMonth.getDate();
        }
    
        if (months < 0) {
            years--;
            months += 12;
        }
    
        let ageString = '';
    
        if (years > 0) {
            ageString += `${years} year${years !== 1 ? 's' : ''}`;
        }
    
        if (months > 0) {
            if (ageString) ageString += ' ';
            ageString += `${months} month${months !== 1 ? 's' : ''}`;
        }
    
        // Handle less than a month (weeks & days)
        if (years === 0 && months === 0) {
            if (days >= 7) {
                const weeks = Math.floor(days / 7);
                days = days % 7; // Remaining days
                ageString += `${weeks} week${weeks !== 1 ? 's' : ''}`;
            }
            if (days > 0) {
                if (ageString) ageString += ' ';
                ageString += `${days} day${days !== 1 ? 's' : ''}`;
            }
        }
    
        return ageString || 'Less than a day old';
    };
    

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "numeric",
            minute: "numeric",
            hour12: true
        }).format(date);
    };

    useEffect(() => {
        if (pet && pet.pet_id) {
            setLoading(false);
            if (pet.pet_birthdate) {
                setCalculatedAge(calculateAge(pet.pet_birthdate));
            }
            fetchMedicalHistory(pet.pet_id);
            fetchAvailedServices(pet.pet_id);
        } else {
            setLoading(false);
        }
    }, [pet]);

    const fetchAvailedServices = async (petId) => {
        try {
            if (!petId) {
                console.warn("Pet ID is missing, cannot fetch availed services.");
                setAvailedServices([]); // Clear services if petId is missing
                return;
            }
    
            console.log("Fetching orders for petId:", petId);
    
            // Fetch orders by pet_id (simplified)
            const response = await fetch(`${API_BASE_URL}/api/orders.php?pet_id=${petId}`);
            
            // Check if the response is OK (status 200)
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
    
            const responseData = await response.json(); // Parse JSON directly
    
            console.log("Fetched response data:", responseData); // Log the response data
    
            // Ensure `orders` exists in responseData
            const orders = responseData.orders || [];
    
            if (!Array.isArray(orders) || orders.length === 0) {
                console.warn("No orders found for this pet.");
                setAvailedServices([]); // Clear services if no orders found
                return;
            }
    
            // ✅ Directly update the state with the orders data
            setAvailedServices(orders);
    
        } catch (error) {
            console.error("Error fetching orders:", error);
            setAvailedServices([]); // Clear services in case of an error
        }
    };
    
    
    
    
    
    const fetchMedicalHistory = async (petId) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/medical_records.php?pet_id=${petId}`);
            const data = await response.json();

            if (data && Array.isArray(data.records)) {
                setPatientHistory(data.records);
            } else {
                console.error('Unexpected response format:', data);
            }
        } catch (error) {
            console.error('Error fetching medical history:', error);
        }
    };

    if (!pet) {
        return <div></div>; // Handle case where pet is null
    }

    const handleAddRecord = (newRecord) => {
        setPatientHistory([...patientHistory, newRecord]);
        fetchMedicalHistory();
    };

    return (
        <Modal show={show} onHide={handleClose} className="custom-modal" centered size="xl">
            <Modal.Header closeButton>
                <Modal.Title>Pet Details</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {loading ? (
                    <div>Loading...</div>
                ) : pet && pet.pet_name ? (
                    <Form>
                        <Row>
                            {/* Left Column */}
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Name</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="name"
                                        value={pet.pet_name}
                                        readOnly
                                        disabled
                                    />
                                </Form.Group>
                                <Form.Group>
                                    <Form.Label>Species</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="species"
                                        value={pet.pet_species}
                                        readOnly
                                        disabled
                                    />
                                </Form.Group>
                                <Form.Group>
                                    <Form.Label>Breed</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="breed"
                                        value={pet.pet_breed}
                                        readOnly
                                        disabled
                                    />
                                </Form.Group>
                                <Form.Group>
                                    <Form.Label>Weight (kg)</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="weight"
                                        value={pet.pet_weight}
                                        readOnly
                                        disabled
                                    />
                                </Form.Group>
                            </Col>
                            {/* Right Column */}
                            <Col md={6}>
                            <Form.Group>
                                    <Form.Label>Birthdate</Form.Label>
                                    <Form.Control
                                        type="date"
                                        name="birthdate"
                                        value={pet.pet_birthdate}
                                        readOnly
                                        disabled
                                    />
                                </Form.Group>
                            <Form.Group>
                                <Form.Label>Age</Form.Label>
                                <Form.Control
                                    type="text"
                                    name="pet_age"
                                    value={pet.pet_age}  
                                    readOnly
                                    disabled
                                    placeholder="Auto-calculated age"
                                />
                            </Form.Group>
                                

                                <Form.Group>
                                    <Form.Label>Distinct Features</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="distinct_features"
                                        value={pet.pet_distinct_features}
                                        readOnly
                                        disabled
                                    />
                                </Form.Group>
                                <Form.Group>
                                    <Form.Label>Other Details</Form.Label>
                                    <Form.Control
                                        as="textarea"
                                        rows={3}
                                        name="other_details"
                                        value={pet.pet_other_details}
                                        readOnly
                                        disabled
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                {/* Pet History Table */}
{/* Pet History Table */}
<Row>
    <Col md={12}>
        <h5 className="mt-4">Pet Medical History</h5>
        <Table striped bordered hover>
    <thead>
        <tr>
            <th>Date</th>
            <th>Action</th>
        </tr>
    </thead>
    <tbody>
        {patientHistory.length > 0 ? (
            patientHistory
                .filter(history => history.patient_id === pet.pet_id) // Correctly filter using pet.pet_id
                .sort((a, b) => new Date(b.date) - new Date(a.date)) // Sort by date in descending order
                .map((history, index) => (
                    <tr key={index}>
                        <td>{formatDate(history.date)}</td>
                        <td>
                            <Button
                                variant="info"
                                onClick={() => handleOpenViewMedicalRecordModal(history)}
                                size="sm"
                            >
                                <FaEye /> View
                            </Button>
                        </td>
                    </tr>
                ))
        ) : (
            <tr>
                <td colSpan="2">No history available</td>
            </tr>
        )}
    </tbody>
</Table>

    </Col>
</Row>




                        {/* Services History Table */}

                        <Row>
                            <Col md={12}>
                                <h5 className="mt-4">Availed Services</h5>
                                <Table striped bordered hover>
                                    <thead>
                                        <tr>
                                            <th>Order Date</th>
                                            <th>Service</th>
                                        </tr>
                                    </thead>
                                    {Array.isArray(availedServices) && availedServices.length > 0 ? (
                                            <tbody>
                                                {availedServices.map((order) => (
                                                    // Check if the order type is 'service' directly
                                                    order.type === "service" && (
                                                        <tr key={order.order_id}>
                                                            <td>{formatDate(order.order_date)}</td>
                                                            <td>{order.product_name}</td>
                                                        </tr>
                                                    )
                                                ))}
                                            </tbody>
                                        ) : (
                                            <tr>
                                                <td colSpan="2">No orders found.</td>
                                            </tr>
                                        )}
                                </Table>
                            </Col>
                        </Row>

                        {/* Button Section */}
                        <div className="button-container text-center mt-4">
                            <Button variant="primary" onClick={handleOpenAddMedicalRecordModal} className="ml-2 button">
                                Add Medical History
                            </Button>
                        </div>
                    </Form>
                ) : (
                    <div></div>
                )}

                {/* View Medical History Modal */}
                <ViewPatientMedicalRecordModal
                    show={showViewMedicalRecordModal}
                    handleClose={handleCloseViewMedicalRecordModal}
                    history={selectedHistory} // Pass selected history to the modal
                />

                {/* Add Medical History Modal Placeholder */}
                <PatientMedicalRecordModal
                    show={showAddMedicalRecordModal}
                    handleClose={handleCloseAddMedicalRecordModal}
                    onAddRecord={handleAddRecord}
                    petId={pet.pet_id} // Pass pet ID to the modal
                />
            </Modal.Body>
        </Modal>
    );
};

export default ViewPetModal;
