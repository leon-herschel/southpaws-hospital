import React, { useState, useEffect, useRef } from "react";
import { Modal, Button, Form } from "react-bootstrap";
import axios from "axios";
import "../../assets/add.css";
import { toast } from "react-toastify"; // Import Toastify

const AddPatientsModal = ({ show, handleClose, client }) => {
  const [inputs, setInputs] = useState({});
  const [age, setAge] = useState(""); // Store calculated age here
  const patientNameRef = useRef(null);
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

  useEffect(() => {
    if (show && patientNameRef.current) {
      patientNameRef.current.focus(); // ✅ Auto-focus when modal opens
    }
  }, [show]);

  useEffect(() => {
    // Whenever the birthdate changes, recalculate the age
    if (inputs.birthdate) {
      const calculatedAge = calculateAge(inputs.birthdate);
      setAge(calculatedAge);
    }
  }, [inputs.birthdate]);

  // Function to calculate age from birthdate
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

  const handleChange = (event) => {
    const { name, value } = event.target;
    setInputs((prevInputs) => ({ ...prevInputs, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const userID = localStorage.getItem("userID");

    const ownerId =
      client?.id || client?.owner_id || client?.client?.id || null;
    const formData = {
      ...inputs,
      age,
      created_by: userID,
      owner_id: ownerId,
    };

    axios
      .post(`${API_BASE_URL}/api/patients.php`, formData)
      .then((response) => {
        if (response.data.status === 1) {
          toast.success("Pet Added Successfully");
          handleClose(response.data.pet);
        } else {
          console.error("Add Pet Error:", response.data);
          toast.error(response.data.message || "Failed to add pet");
        }
      })
      .catch((error) => {
        console.error("Request failed:", error);
        toast.error("Server error: " + error.message);
      });
  };

  const handleModalClose = () => {
    setAge("");
    handleClose();
  };

  return (
    <Modal
      show={show}
      onHide={handleModalClose}
      className="custom-modal"
      centered
      size="lg"
    >
      <Modal.Header closeButton>
        <Modal.Title>Add Pet</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form onSubmit={handleSubmit} className="row">
          <div className="col-md-6">
            <Form.Group controlId="formName">
              <Form.Label>
                Name: <span className="text-danger">*</span>
              </Form.Label>
              <Form.Control
                type="text"
                name="name"
                ref={patientNameRef} // ✅ Attach ref to input field
                onChange={handleChange}
                placeholder="Enter name"
                required
              />
            </Form.Group>
            <Form.Group controlId="formSpecies">
              <Form.Label>
                Species: <span className="text-danger">*</span>
              </Form.Label>
              <Form.Control
                type="text"
                name="species"
                onChange={handleChange}
                placeholder="Enter species"
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label style={{ margin: 0 }}>
                Gender: <span className="text-danger">*</span>
              </Form.Label>
              <Form.Control
                as="select"
                name="gender"
                onChange={handleChange}
                placeholder="Enter breed"
                required
              >
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </Form.Control>
            </Form.Group>

            <Form.Group controlId="formBreed">
              <Form.Label>
                Breed: <span className="text-danger">*</span>
              </Form.Label>
              <Form.Control
                type="text"
                name="breed"
                onChange={handleChange}
                placeholder="Enter breed"
                required
              />
            </Form.Group>
            <Form.Group controlId="formWeight">
              <Form.Label>
                Weight (in kgs.): <span className="text-danger">*</span>
              </Form.Label>
              <Form.Control
                type="number"
                name="weight"
                onChange={handleChange}
                placeholder="Enter weight"
                min="0" // Ensure non-negative values
                required
              />
            </Form.Group>
          </div>
          <div className="col-md-6">
            <Form.Group controlId="formBirthdate">
              <Form.Label>
                Birthdate: <span className="text-danger">*</span>
              </Form.Label>
              <Form.Control
                type="date"
                name="birthdate"
                onChange={handleChange}
                required
                max={new Date().toISOString().split("T")[0]} // Prevent future dates
              />
            </Form.Group>

            <Form.Group controlId="formAge">
              <Form.Label>Age: </Form.Label>
              <Form.Control
                type="text"
                name="age"
                value={age || ""} // Set the calculated age as the value
                readOnly // Make it read-only since it's auto-calculated
                placeholder="Auto-calculated age"
              />
            </Form.Group>
            <Form.Group controlId="formDistinctFeatures">
              <Form.Label>Distinct Features: </Form.Label>
              <Form.Control
                type="text"
                name="distinct_features"
                onChange={handleChange}
                placeholder="Enter distinct features"
              />
            </Form.Group>
            <Form.Group controlId="formOtherDetails">
              <Form.Label>Other Details: </Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="other_details"
                onChange={handleChange}
                placeholder="Enter other details"
              />
            </Form.Group>
          </div>
          <div className="button-container">
            <Button variant="primary" type="submit" className="button">
              Add
            </Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
};

export default AddPatientsModal;
