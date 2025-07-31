import React, { useState, useEffect, useRef } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import axios from 'axios';
import '../../assets/add.css';

const AddClientAndPatientModal = ({ show, handleClose, onCategoryAdded, prefillData }) => {
    const [clientInputs, setClientInputs] = useState({
        name: '',
        email: '',
        cellnumber: '',
        address: '',
        gender: ''
    });
    const [patients, setPatients] = useState([{
        name: '',
        species: '',
        breed: '',
        weight: '',
        age: '',
        birthdate: '',
        distinct_features: '',
        other_details: ''
    }]);
    const [clients, setClients] = useState([]);
    const clientNameRef = useRef(null);

    const resetForm = () => {
        setClientInputs({
            name: '',
            email: '',
            cellnumber: '',
            address: '',
            gender: ''
        });
        setPatients([{
            name: '',
            species: '',
            breed: '',
            weight: '',
            age: '',
            birthdate: '',
            distinct_features: '',
            other_details: ''
        }]);
    };
    
    useEffect(() => {
        if (show && clientNameRef.current) {
            clientNameRef.current.focus(); // ✅ Auto-focus when modal opens
        }
    }, [show]);    
    
    useEffect(() => {
        fetchClients();
    }, []);

    useEffect(() => {
        if (show && prefillData) {
            setClientInputs(prev => ({
                ...prev,
                name: prefillData.name || '',
                email: prefillData.email || '',
                cellnumber: prefillData.contact || ''
            }));
        }
    }, [show, prefillData]);

    const fetchClients = () => {
        axios.get('http://localhost:80/api/clients.php')
            .then(response => {
                setClients(response.data.clients);
            })
            .catch(error => {
                console.error('Error fetching clients:', error);
            });
    };

    const handleCloseAndReset = () => {
        resetForm(); // Clear input fields
        handleClose(); // Close modal
    };
    

    const handleClientChange = (event) => {
        const { name, value } = event.target;
        setClientInputs(prevInputs => ({ ...prevInputs, [name]: value }));
    };

    const handlePatientChange = (event, index) => {
        const { name, value } = event.target;
        const updatedPatients = [...patients];
    
        if (name === "birthdate") {
            const today = new Date();
            const selectedDate = new Date(value);
    
            if (selectedDate > today) {
                alert("Birthdate cannot be in the future!");
                updatedPatients[index][name] = ''; // Clear invalid input
            } else {
                updatedPatients[index][name] = value;
                // Calculate and update the age in months or a string like "X months"
                const age = calculateAge(value);
                updatedPatients[index]["age"] = age || "Unknown"; // Fallback to "Unknown" if age is not valid
            }
        } else {
            updatedPatients[index][name] = value;
        }
    
        setPatients(updatedPatients);
    };
    
    // Function to calculate age in years and months
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
    
    const addNewPatient = () => {
        setPatients([
            ...patients,
            {
                name: '',
                species: '',
                breed: '',
                weight: '',
                age: '',
                birthdate: '',
                distinct_features: '',
                other_details: ''
            }
        ]);
    };

    const removePatient = (index) => {
        if (patients.length > 1) {
            const updatedPatients = patients.filter((_, i) => i !== index);
            setPatients(updatedPatients);
        }
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
    
        const updatedPatients = patients.map(patient => ({
            ...patient,
            age: patient.age || "Unknown" // Ensure age has a value
        }));
    
        const userID = localStorage.getItem('userID');
        const formData = {
            ...clientInputs,
            created_by: userID,
            patients: updatedPatients
        };
    
        try {
            const response = await axios.post('http://localhost:80/api/clients.php', formData);
    
            if (response.data.status === 1) {
                resetForm(); // ✅ Clear input fields after successful submission
                handleClose(); // ✅ Close modal
                onCategoryAdded(); // ✅ Refresh client list (if needed)
            } else {
                console.error('Error saving client or patients:', response.data.message);
                alert(`Error: ${response.data.message}`);
            }
        } catch (error) {
            console.error('Error saving client or patients:', error);
            alert("An error occurred while saving the data. Please try again.");
        }
    };

    return (
    <Modal show={show} onHide={handleCloseAndReset} className="custom-modal" size="lg">
        <Modal.Header closeButton>
                    <Modal.Title>Add Client and Pet</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form onSubmit={handleSubmit}>
                        <h4>Client Information</h4>
                        <div className="row">
                            <div className="col-md-6">
                                <Form.Group>
                                    <Form.Label>Name</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="name"
                                        ref={clientNameRef}
                                        value={clientInputs.name || ''}
                                        onChange={handleClientChange}
                                        placeholder="Enter name"
                                        required
                                    />
                                </Form.Group>
                                <Form.Group>
                                    <Form.Label>Address</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="address"
                                        value={clientInputs.address || ''}
                                        onChange={handleClientChange}
                                        placeholder="Enter address"
                                        required
                                    />
                                </Form.Group>
                                <Form.Group>
                                    <Form.Label>Mobile Number</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="cellnumber"
                                        value={clientInputs.cellnumber || ''}
                                        onChange={handleClientChange}
                                        placeholder="Enter mobile number"
                                        required
                                    />
                                </Form.Group>
                            </div>
                            <div className="col-md-6">
                                <Form.Group>
                                    <Form.Label>Email</Form.Label>
                                    <Form.Control
                                        type="email"
                                        name="email"
                                        value={clientInputs.email || ''}
                                        onChange={handleClientChange}
                                        placeholder="Enter email"
                                        required
                                    />
                                </Form.Group>
                                <Form.Group>
                                    <Form.Label>Gender</Form.Label>
                                    <Form.Control
                                        as="select"
                                        name="gender"
                                        value={clientInputs.gender || ''}
                                        onChange={handleClientChange}
                                        required
                                    >
                                        <option value="">Select Gender</option>
                                        <option value="male">Male</option>
                                        <option value="female">Female</option>
                                        <option value="other">Other</option>
                                    </Form.Control>
                                </Form.Group>
                            </div>
                        </div>

                        <hr />

                        <h4 className="d-flex justify-content-between align-items-center">
                            Pet Information
                            <Button variant="success" onClick={addNewPatient} className="sticky-button">Add Another Patient</Button>
                        </h4>
                        {patients.map((patient, index) => (
                            <div className="row" key={index}>
                                <div className="col-md-6">
                                    <Form.Group>
                                        <Form.Label>Name</Form.Label>
                                        <Form.Control
                                            type="text"
                                            name="name"
                                            value={patient.name}
                                            onChange={(event) => handlePatientChange(event, index)}
                                            placeholder="Enter name"
                                            required
                                        />
                                    </Form.Group>
                                    <Form.Group>
                                        <Form.Label>Species</Form.Label>
                                        <Form.Control
                                            type="text"
                                            name="species"
                                            value={patient.species}
                                            onChange={(event) => handlePatientChange(event, index)}
                                            placeholder="Enter species"
                                            required
                                        />
                                    </Form.Group>
                                    <Form.Group>
                                        <Form.Label>Breed</Form.Label>
                                        <Form.Control
                                            type="text"
                                            name="breed"
                                            value={patient.breed}
                                            onChange={(event) => handlePatientChange(event, index)}
                                            placeholder="Enter breed"
                                        />
                                    </Form.Group>
                                    <Form.Group>
                                        <Form.Label>Weight (in kgs.)</Form.Label>
                                        <Form.Control
                                            type="number"
                                            step="0.1"
                                            name="weight"
                                            value={patient.weight}
                                            onChange={(event) => handlePatientChange(event, index)}
                                            placeholder="Enter weight"
                                        />
                                    </Form.Group>
                                </div>
                                <div className="col-md-6">
                                <Form.Group>
                                <Form.Label>Birthdate</Form.Label>
                                <Form.Control
                                    type="date"
                                    name="birthdate"
                                    value={patient.birthdate}
                                    onChange={(event) => handlePatientChange(event, index)}
                                    required
                                    max={new Date().toISOString().split("T")[0]} // Set max to today's date
                                />
                            </Form.Group>
                                    <Form.Group>
                                <Form.Label>Age</Form.Label>
                                <Form.Control
                                    type="text" // Change to 'text' so that it can display the full age in years and months
                                    name="age"
                                    value={patient.age}
                                    readOnly
                                    placeholder="Auto-calculated age"
                                />
                            </Form.Group>

                                    <Form.Group>
                                        <Form.Label>Distinct Features</Form.Label>
                                        <Form.Control
                                            type="text"
                                            name="distinct_features"
                                            value={patient.distinct_features}
                                            onChange={(event) => handlePatientChange(event, index)}
                                            placeholder="Enter distinct features"
                                        />
                                    </Form.Group>
                                    <Form.Group>
                                        <Form.Label>Other Details</Form.Label>
                                        <Form.Control
                                            as="textarea"
                                            rows={3}
                                            name="other_details"
                                            value={patient.other_details}
                                            onChange={(event) => handlePatientChange(event, index)}
                                            placeholder="Enter other details"
                                        />
                                    </Form.Group>

                                    {patients.length > 1 && (
                                        <Button variant="danger" onClick={() => removePatient(index)} className="mt-3">
                                            Remove Patient
                                        </Button>
                                    )}
                                </div>
                            </div>
                        ))}

                        <div className="flex button-container d-flex justify-content-end mt-4">
                            <Button variant="secondary" className='me-2' onClick={handleClose}>Close</Button>
                            <Button variant="primary" type="submit">Save</Button>
                        </div>
                    </Form>
                </Modal.Body>
            </Modal>
    );
};

export default AddClientAndPatientModal;
