import React, { useState, useEffect, useRef } from "react";
import { Modal, Button, Form } from "react-bootstrap";
import axios from "axios";
import "../../assets/add.css";
import { toast } from "react-toastify";

const AddPatientsModal = ({ show, handleClose, client, prefillPet }) => {
  const [inputs, setInputs] = useState({});
  const [age, setAge] = useState("");
  const patientNameRef = useRef(null);
  const isPrefilled = (fieldName) => {
    return prefillPet && prefillPet[fieldName] !== undefined && prefillPet[fieldName] !== null;
  };
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

  useEffect(() => {
    if (show && prefillPet) {
      const mapped = {
        name: prefillPet.name || "",
        species: prefillPet.species || "",
        breed: prefillPet.breed || "",
        birthdate: prefillPet.birthdate || "",
        gender: prefillPet.gender || "",
        weight: prefillPet.weight || "",
        distinct_features: prefillPet.distinct_features || "",
        other_details: prefillPet.other_details || "",
      };
      setInputs((prev) => ({ ...prev, ...mapped }));
      if (mapped.birthdate) {
        setAge(calculateAge(mapped.birthdate));
      }
    }
  }, [show, prefillPet]);

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
    setInputs({});
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
                ref={patientNameRef}
                onChange={handleChange}
                value={inputs.name || ""}
                readOnly={isPrefilled("name")}
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
                value={inputs.species || ""}
                readOnly={isPrefilled("species")}
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
                value={inputs.gender || ""}
                placeholder="Enter breed"
                required
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
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
                value={inputs.breed || ""}
                readOnly={isPrefilled("breed")}
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
                value={inputs.weight || ""}
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
                value={inputs.birthdate || ""}
                required
                max={new Date().toISOString().split("T")[0]} // Prevent future dates
              />
            </Form.Group>

            <Form.Group controlId="formAge">
              <Form.Label>Age: </Form.Label>
              <Form.Control
                type="text"
                name="age"
                value={age || ""}
                readOnly
                placeholder="Auto-calculated age"
              />
            </Form.Group>
            <Form.Group controlId="formDistinctFeatures">
              <Form.Label>Distinct Features: </Form.Label>
              <Form.Control
                type="text"
                name="distinct_features"
                onChange={handleChange}
                value={inputs.distinct_features || ""}
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
                value={inputs.other_details || ""}
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
