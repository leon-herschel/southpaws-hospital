import React, { useState, useEffect, useRef } from "react";
import { Modal, Button, Form, Row, Col } from "react-bootstrap";
import "../../assets/add.css"; // Assuming you have custom styles

const EditPetModal = ({
  show,
  handleClose,
  editPatient,
  handleEditChange,
  handleEditSubmit,
}) => {
  const [formData, setFormData] = useState({
    pet_name: "",
    pet_species: "",
    pet_breed: "",
    pet_weight: "",
    pet_age: "",
    pet_birthdate: "",
    pet_distinct_features: "",
    pet_other_details: "",
  });
  const [loading, setLoading] = useState(true);
  const brandNameRef = useRef(null);

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

    let ageString = "";

    if (years > 0) {
      ageString += `${years} year${years !== 1 ? "s" : ""}`;
    }

    if (months > 0) {
      if (ageString) ageString += " ";
      ageString += `${months} month${months !== 1 ? "s" : ""}`;
    }

    // Handle less than a month (weeks & days)
    if (years === 0 && months === 0) {
      if (days >= 7) {
        const weeks = Math.floor(days / 7);
        days = days % 7; // Remaining days
        ageString += `${weeks} week${weeks !== 1 ? "s" : ""}`;
      }
      if (days > 0) {
        if (ageString) ageString += " ";
        ageString += `${days} day${days !== 1 ? "s" : ""}`;
      }
    }

    return ageString || "Less than a day old";
  };

  // Populate form data when patient changes
  useEffect(() => {
    if (editPatient && Object.keys(editPatient).length > 0) {
      setFormData({
        ...editPatient,
        owner_id: editPatient.owner_id || "",
      });
    }
    setLoading(false);
  }, [editPatient]);

  // Only focus input when modal opens
  useEffect(() => {
    if (show && brandNameRef.current) {
      setTimeout(() => {
        brandNameRef.current.focus();
      }, 100);
    }
  }, [show]);

  useEffect(() => {
    if (formData.pet_birthdate) {
      setFormData((prevFormData) => ({
        ...prevFormData,
        pet_age: calculateAge(formData.pet_birthdate),
      }));
    }
  }, [formData.pet_birthdate]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prevFormData) => {
      if (name === "pet_birthdate") {
        const age = calculateAge(value); // Calculate the age string
        return { ...prevFormData, pet_birthdate: value, pet_age: age };
      } else {
        return { ...prevFormData, [name]: value };
      }
    });

    handleEditChange(e); // Call parent function to handle real-time changes if needed
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Check if the pet name is empty, don't close modal if it's empty
    if (!formData.pet_name.trim()) {
      return; // Prevent form submission if pet name is empty
    }

    handleEditSubmit(formData); // Pass updated formData to parent component
    handleClose(); // Close modal after submitting
  };

  // If loading, show a loading message
  if (loading) {
    return <div>Loading...</div>; // Or loading spinner
  }

  return (
    <Modal
      show={show}
      onHide={handleClose}
      className="custom-modal"
      centered
      size="lg"
    >
      <Modal.Header closeButton>
        <Modal.Title>Edit Pet</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form onSubmit={handleSubmit}>
          <Row>
            {/* Left Column */}
            <Col md={6}>
              <Form.Group>
                <Form.Label>Name</Form.Label>
                <Form.Control
                  type="text"
                  name="pet_name"
                  value={formData.pet_name}
                  onChange={handleChange}
                  placeholder="Enter name"
                  ref={brandNameRef} // ✅ Attach ref to input field
                  required // Ensure name is required for form submission
                />
              </Form.Group>
              <Form.Group>
                <Form.Label>Species</Form.Label>
                <Form.Control
                  type="text"
                  name="pet_species"
                  value={formData.pet_species}
                  onChange={handleChange}
                  placeholder="Enter species"
                />
              </Form.Group>

              <Form.Group>
                <Form.Label>Gender</Form.Label>
                <Form.Control
                  type="text"
                  name="pet_gender"
                  value={formData.pet_gender}
                  onChange={handleChange}
                  placeholder="Enter gender"
                />
              </Form.Group>

              <Form.Group>
                <Form.Label>Breed</Form.Label>
                <Form.Control
                  type="text"
                  name="pet_breed"
                  value={formData.pet_breed}
                  onChange={handleChange}
                  placeholder="Enter breed"
                />
              </Form.Group>
              <Form.Group>
                <Form.Label>Weight (in kg)</Form.Label>
                <Form.Control
                  type="text"
                  name="pet_weight"
                  value={formData.pet_weight}
                  onChange={handleChange}
                  placeholder="Enter weight in kilograms"
                />
              </Form.Group>
            </Col>
            {/* Right Column */}
            <Col md={6}>
              <Form.Group>
                <Form.Label>Birthdate</Form.Label>
                <Form.Control
                  type="date"
                  name="pet_birthdate"
                  value={formData.pet_birthdate}
                  onChange={handleChange}
                  max={new Date().toISOString().split("T")[0]} // Prevent future dates
                />
              </Form.Group>
              <Form.Group>
                <Form.Label>Age</Form.Label>
                <Form.Control
                  type="text"
                  name="pet_age"
                  value={formData.pet_age}
                  readOnly
                  placeholder="Auto-calculated age"
                />
              </Form.Group>

              <Form.Group>
                <Form.Label>Distinct Features</Form.Label>
                <Form.Control
                  type="text"
                  name="pet_distinct_features"
                  value={formData.pet_distinct_features}
                  onChange={handleChange}
                  placeholder="Enter distinct features"
                />
              </Form.Group>
              <Form.Group>
                <Form.Label>Other Details</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  name="pet_other_details"
                  value={formData.pet_other_details}
                  onChange={handleChange}
                  placeholder="Enter other details"
                />
              </Form.Group>
            </Col>
          </Row>
          {/* Button Section */}
          <div className="button-container text-center mt-4">
            <Button variant="primary" type="submit" className="button">
              Update
            </Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
};

export default EditPetModal;
