import React, { useState, useEffect, useRef } from 'react';
import { Modal, Button, Form, Table } from "react-bootstrap";
import axios from "axios";
import { toast } from 'react-toastify'; // Import ToastContainer and toast
import 'react-toastify/dist/ReactToastify.css'; // Import CSS for Toastify

const PatientMedicalRecordModal = ({ show, handleClose, onAddRecord, petId }) => {
    const [formData, setFormData] = useState({
        chief_complaint: "",
        history: "",
        diagnostic_plan: "",
        differentials: "",
        treatment_plan: "",
        veterinarian: "",
        heart_rate: "",
        lymph_nodes: "",
        respiratory_rate: "",
        abdomen: "",
        bcs: "",
        cardiovascular: "",
        general_appearance: "",
        respiratory: "",
        mm: "",
        genitourinary: "",
        ears: "",
        integument: "",
        eyes: "",
        musculoskeletal: "",
        nose: "",
        neuro: "",
        date: "",
    });
    const [showConfirmModal, setShowConfirmModal] = useState(false); // For showing confirmation modal
    const [error, setError] = useState(""); // Error message state
    const brandNameRef = useRef(null);

    useEffect(() => {
        if (show && brandNameRef.current) {
            brandNameRef.current.focus(); // ✅ Auto-focus when modal opens
        }
    }, [show]);    

    // Open confirmation modal
    const handleShowConfirmModal = () => setShowConfirmModal(true);
    
    // Close confirmation modal
    const handleCloseConfirmModal = () => setShowConfirmModal(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prevState) => ({
            ...prevState,
            [name]: value,
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
    
        // Reset error on form submission
        setError("");
    
        // Check if at least one field has a value
        const atLeastOneFieldFilled = Object.values(formData).some((field) => field.trim() !== "");
    
        if (!atLeastOneFieldFilled) {
            toast.error("Please fill in at least one field.");
            return; // Stop form submission if no field is filled
        }
    
        // Conditional validation: If chief_complaint is filled, treatment_plan must be filled
        if (formData.chief_complaint && !formData.treatment_plan) {
            setError("Treatment Plan is required when Chief Complaint is filled.");
            return; // Stop form submission if validation fails
        }
    
        // Proceed to show confirmation modal if validation passes
        handleShowConfirmModal(); // Open the confirmation modal
    };
    
    const handleModalClose = () => {
        // Reset formData when closing the modal
        setFormData({
            chief_complaint: "",
            history: "",
            diagnostic_plan: "",
            differentials: "",
            treatment_plan: "",
            veterinarian: "",
            heart_rate: "",
            lymph_nodes: "",
            respiratory_rate: "",
            abdomen: "",
            bcs: "",
            cardiovascular: "",
            general_appearance: "",
            respiratory: "",
            mm: "",
            genitourinary: "",
            ears: "",
            integument: "",
            eyes: "",
            musculoskeletal: "",
            nose: "",
            neuro: "",
            date: "",
        });
        handleClose();
        setError(""); // Clear any error message when modal is closed
        handleCloseConfirmModal(); // Close the confirmation modal if it's open
    };   

    const handleConfirmSubmit = async () => {
        try {
            // Retrieve userID from localStorage
            const createdBy = localStorage.getItem('userID');
            
            // Check if userID is available in localStorage
            if (!createdBy) {
                toast.error("User ID is not found. Please log in again.");
                return;
            }

            // Adding the created_by to the form data
            const response = await axios.post("http://localhost:80/api/medical_records.php", {
                patient_id: petId, // Associate the record with the pet
                created_by: createdBy, // Add the userID from localStorage
                ...formData,
            });
    
            if (response.data.status === 1) {
                onAddRecord({ ...formData, id: response.data.record_id }); // ✅ Update parent state
                setFormData({ // Reset form data
                    chief_complaint: "",
                    history: "",
                    diagnostic_plan: "",
                    differentials: "",
                    treatment_plan: "",
                    veterinarian: "",
                    heart_rate: "",
                    lymph_nodes: "",
                    respiratory_rate: "",
                    abdomen: "",
                    bcs: "",
                    cardiovascular: "",
                    general_appearance: "",
                    respiratory: "",
                    mm: "",
                    genitourinary: "",
                    ears: "",
                    integument: "",
                    eyes: "",
                    musculoskeletal: "",
                    nose: "",
                    neuro: "",
                    date: "",
                });
    
                handleClose(); // Close modal
                handleCloseConfirmModal();
                toast.success("Medical record added successfully!");
            } else {
                toast.error("Failed to add medical record. Please try again.");
            }
        } catch (error) {
            console.error("Error submitting medical record:", error);
            toast.error("Error submitting the medical record. Please try again.");
        }
    };
    

    return (
        <Modal show={show} onHide={handleModalClose} size="xl" centered>
            <Modal.Header closeButton>
                <Modal.Title>Patient Medical Record</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form onSubmit={handleSubmit}>
                    {/* Physical Exam Findings */}
                    <h5 className="mt-4">Physical Exam Findings</h5>
                    <Table bordered>
                        <thead>
                            <tr>
                                <th>Rectal Temperature</th>
                                <th>Oral Cavity</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>
                                    <Form.Label>Heart Rate</Form.Label>
                                    <Form.Control
                                        type="text"
                                        placeholder="Enter Heart Rate"
                                        ref={brandNameRef} // ✅ Attach ref to input field
                                        name="heart_rate"
                                        value={formData.heart_rate}
                                        onChange={handleChange}
                                        required
                                    />
                                </td>
                                <td>
                                    <Form.Label>Lymph Nodes</Form.Label>
                                    <Form.Control
                                        type="text"
                                        placeholder="Enter Lymph Nodes"
                                        name="lymph_nodes"
                                        value={formData.lymph_nodes}
                                        onChange={handleChange}
                                        required
                                    />
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    <Form.Label>Respiratory Rate</Form.Label>
                                    <Form.Control
                                        type="text"
                                        placeholder="Enter Respiratory Rate"
                                        name="respiratory_rate"
                                        value={formData.respiratory_rate}
                                        onChange={handleChange}
                                        required
                                    />
                                </td>
                                <td>
                                    <Form.Label>Abdomen</Form.Label>
                                    <Form.Control
                                        type="text"
                                        placeholder="Enter Abdomen"
                                        name="abdomen"
                                        value={formData.abdomen}
                                        onChange={handleChange}
                                        required
                                    />
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    <Form.Label>BCS</Form.Label>
                                    <Form.Control
                                        type="text"
                                        placeholder="Enter BCS"
                                        name="bcs"
                                        value={formData.bcs}
                                        onChange={handleChange}
                                        required
                                    />
                                </td>
                                <td>
                                    <Form.Label>Cardiovascular</Form.Label>
                                    <Form.Control
                                        type="text"
                                        placeholder="Enter Cardiovascular"
                                        name="cardiovascular"
                                        value={formData.cardiovascular}
                                        onChange={handleChange}
                                        required
                                    />
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    <Form.Label>General Appearance</Form.Label>
                                    <Form.Control
                                        type="text"
                                        placeholder="Enter General Appearance"
                                        name="general_appearance"
                                        value={formData.general_appearance}
                                        onChange={handleChange}
                                        required
                                    />
                                </td>
                                <td>
                                    <Form.Label>Respiratory</Form.Label>
                                    <Form.Control
                                        type="text"
                                        placeholder="Enter Respiratory"
                                        name="respiratory"
                                        value={formData.respiratory}
                                        onChange={handleChange}
                                        required
                                    />
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    <Form.Label>MM</Form.Label>
                                    <Form.Control
                                        type="text"
                                        placeholder="Enter MM"
                                        name="mm"
                                        value={formData.mm}
                                        onChange={handleChange}
                                        required
                                    />
                                </td>
                                <td>
                                    <Form.Label>Genitourinary</Form.Label>
                                    <Form.Control
                                        type="text"
                                        placeholder="Enter Genitourinary"
                                        name="genitourinary"
                                        value={formData.genitourinary}
                                        onChange={handleChange}
                                        required
                                    />
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    <Form.Label>Ears</Form.Label>
                                    <Form.Control
                                        type="text"
                                        placeholder="Enter Ears"
                                        name="ears"
                                        value={formData.ears}
                                        onChange={handleChange}
                                        required
                                    />
                                </td>
                                <td>
                                    <Form.Label>Integument</Form.Label>
                                    <Form.Control
                                        type="text"
                                        placeholder="Enter Integument"
                                        name="integument"
                                        value={formData.integument}
                                        onChange={handleChange}
                                        required
                                    />
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    <Form.Label>Eyes</Form.Label>
                                    <Form.Control
                                        type="text"
                                        placeholder="Enter Eyes"
                                        name="eyes"
                                        value={formData.eyes}
                                        onChange={handleChange}
                                        required
                                    />
                                </td>
                                <td>
                                    <Form.Label>Musculoskeletal</Form.Label>
                                    <Form.Control
                                        type="text"
                                        placeholder="Enter Musculoskeletal"
                                        name="musculoskeletal"
                                        value={formData.musculoskeletal}
                                        onChange={handleChange}
                                        required
                                    />
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    <Form.Label>Nose</Form.Label>
                                    <Form.Control
                                        type="text"
                                        placeholder="Enter Nose"
                                        name="nose"
                                        value={formData.nose}
                                        onChange={handleChange}
                                        required
                                    />
                                </td>
                                <td>
                                    <Form.Label>Neuro</Form.Label>
                                    <Form.Control
                                        type="text"
                                        placeholder="Enter Neuro"
                                        name="neuro"
                                        value={formData.neuro}
                                        onChange={handleChange}
                                        required
                                    />
                                </td>
                            </tr>
                        </tbody>
                    </Table>

                    {[
    "chief_complaint", 
    "history", 
    "diagnostic_plan", 
    "differentials", 
    "treatment_plan"
].map((field, idx) => (
    <Form.Group className="mb-3" key={idx}>
        <Form.Label>
            {field === "chief_complaint" 
                ? "Chief Complaint (requires Receptionist's findings/diagnosis)" 
                : field.replace(/_/g, ' ').toUpperCase()}
        </Form.Label>
        <Form.Control
            as="textarea"
            rows={3}
            name={field}
            value={formData[field]}
            onChange={handleChange}
            required
            isInvalid={error && field === "treatment_plan" && !formData.treatment_plan && formData.chief_complaint} // Error handling for treatment_plan
        />
        {error && field === "treatment_plan" && !formData.treatment_plan && formData.chief_complaint && (
            <Form.Control.Feedback type="invalid">
                {error}
            </Form.Control.Feedback>
        )}
    </Form.Group>
))}




                    <Form.Group className="mb-3">
                        <Form.Label>NAME OF VETERINARIAN</Form.Label>
                        <Form.Control
                            type="text"
                            name="veterinarian"
                            value={formData.veterinarian}
                            onChange={handleChange}
                        />
                    </Form.Group>

                    <Modal.Footer className="d-flex justify-content-center">
                <Button variant="primary" type="submit" className="button">
                    Submit
                </Button>
            </Modal.Footer>
                </Form>
            </Modal.Body>

            {/* Confirmation Modal */}
            <Modal show={showConfirmModal} onHide={handleCloseConfirmModal} centered>
                <Modal.Header closeButton className="bg-light">
                    <Modal.Title className="fw-bold">Confirm Submission</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p className="text-muted">Are you sure you want to add this medical record?</p>

                    <div className="p-3 rounded border bg-light">
                        {Object.keys(formData)
                            .filter((key) => formData[key].trim() !== "")
                            .map((key, index) => (
                                <div 
                                    key={index} 
                                    className="d-flex justify-content-between align-items-center py-2 border-bottom"
                                >
                                    <span className="fw-semibold text-secondary text-start">
                                        {key.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase())}:
                                    </span>
                                    <span className="text-dark fw-medium text-end text-break">
                                        {formData[key]}
                                    </span>
                                </div>
                            ))}

                        {/* If no fields have been filled out, show a message */}
                        {Object.keys(formData).every((key) => formData[key].trim() === "") && (
                            <div className="text-center text-muted py-3">No data provided</div>
                        )}
                    </div>
                </Modal.Body>
                <Modal.Footer className="d-flex justify-content-between">
                    <Button 
                        variant="outline-secondary" 
                        onClick={handleCloseConfirmModal} 
                        className="d-flex align-items-center"
                    >
                        Cancel
                    </Button>
                    <Button 
                        variant="primary" 
                        onClick={handleConfirmSubmit} 
                        className="d-flex align-items-center"
                    >
                        Confirm
                    </Button>
                </Modal.Footer>
            </Modal>
        </Modal>
        
    );
};

export default PatientMedicalRecordModal;
