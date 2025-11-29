import React, { useState, useEffect, useRef } from "react";
import { Modal, Button, Form } from "react-bootstrap";
import axios from "axios";
import "../../assets/add.css";

const AddClientAndPatientModal = ({
  show,
  handleClose,
  onCategoryAdded,
  prefillData,
  disablePrefilledFields,
}) => {
  const [clientInputs, setClientInputs] = useState({
    name: "",
    email: "",
    cellnumber: "",
    address: "",
  });
  const [patients, setPatients] = useState([
    {
      name: "",
      species: "",
      gender: "",
      breed: "",
      weight: "",
      age: "",
      birthdate: "",
      distinct_features: "",
      other_details: "",
    },
  ]);
  const [clients, setClients] = useState([]);
  const clientNameRef = useRef(null);
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

  const resetForm = () => {
    setClientInputs({
      name: "",
      email: "",
      cellnumber: "",
      address: "",
    });
    setPatients([
      {
        name: "",
        species: "",
        gender: "",
        breed: "",
        weight: "",
        age: "",
        birthdate: "",
        distinct_features: "",
        other_details: "",
      },
    ]);
  };

  useEffect(() => {
    if (show && clientNameRef.current) {
      clientNameRef.current.focus(); // Auto-focus when modal opens
    }
  }, [show]);

  useEffect(() => {
    fetchClients();
  }, []);

  useEffect(() => {
    if (show && prefillData) {
      setClientInputs((prev) => ({
        ...prev,
        name: prefillData.name || "",
        email: prefillData.email || "",
        cellnumber: prefillData.contact || "",
        address: prefillData.address || "",
      }));

      if (
        prefillData.pet_name ||
        prefillData.pet_species ||
        prefillData.pet_breed
      ) {
        setPatients([
          {
            name: prefillData.pet_name || "",
            species: prefillData.pet_species || "",
            breed: prefillData.pet_breed || "",
            gender: "",
            weight: "",
            age: "",
            birthdate: "",
            distinct_features: "",
            other_details: "",
          },
        ]);
      }
    }
  }, [show, prefillData]);

  const fetchClients = () => {
    axios
      .get(`${API_BASE_URL}/api/clients.php`)
      .then((response) => {
        setClients(response.data.clients);
      })
      .catch((error) => {
        console.error("Error fetching clients:", error);
      });
  };

  const handleCloseAndReset = () => {
    resetForm(); // Clear input fields
    handleClose(); // Close modal
  };

  const handleClientChange = (event) => {
    const { name, value } = event.target;
    setClientInputs((prevInputs) => ({ ...prevInputs, [name]: value }));
  };

  const handlePatientChange = (event, index) => {
    const { name, value } = event.target;
    const updatedPatients = [...patients];

    if (name === "birthdate") {
      const today = new Date();
      const selectedDate = new Date(value);

      if (selectedDate > today) {
        alert("Birthdate cannot be in the future!");
        updatedPatients[index][name] = ""; // Clear invalid input
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

  const addNewPatient = () => {
    setPatients([
      ...patients,
      {
        name: "",
        species: "",
        gender: "",
        breed: "",
        weight: "",
        age: "",
        birthdate: "",
        distinct_features: "",
        other_details: "",
      },
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

    const updatedPatients = patients.map((patient) => ({
      ...patient,
      age: patient.age || "Unknown", // Ensure age has a value
    }));

    const userID = localStorage.getItem("userID");

    // If email empty, set a default placeholder
    const safeClientInputs = {
      ...clientInputs,
      email:
        clientInputs.email && clientInputs.email.trim() !== ""
          ? clientInputs.email
          : "no_email@noemail.com",
    };

    const formData = {
      ...safeClientInputs,
      created_by: userID,
      patients: updatedPatients,
    };

    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/clients.php`,
        formData
      );

      if (response.data.status === 1) {
        resetForm(); // ✅ Clear input fields after successful submission
        handleClose(); // ✅ Close modal
        onCategoryAdded(); // ✅ Refresh client list (if needed)
      } else {
        console.error(
          "Error saving client or patients:",
          response.data.message
        );
        alert(`Error: ${response.data.message}`);
      }
    } catch (error) {
      console.error("Error saving client or patients:", error);
      alert("An error occurred while saving the data. Please try again.");
    }
  };

  return (
    <Modal
      show={show}
      onHide={handleCloseAndReset}
      className="custom-modal"
      size="lg"
    >
      <Modal.Header closeButton>
        <Modal.Title>Add Client and Pet</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form onSubmit={handleSubmit}>
          <h4 className="mb-3">Client Information</h4>
          <div className="row">
            <div className="col-md-6">
              <Form.Group className="mb-3">
                <Form.Label style={{ margin: 0 }}>
                  Name: <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  type="text"
                  name="name"
                  ref={clientNameRef}
                  value={clientInputs.name || ""}
                  onChange={handleClientChange}
                  placeholder="Enter name"
                  required
                  disabled={disablePrefilledFields && !!prefillData?.name}
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label style={{ margin: 0 }}>
                  Address: <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  type="text"
                  name="address"
                  value={clientInputs.address || ""}
                  onChange={handleClientChange}
                  placeholder="Enter address"
                  required
                />
              </Form.Group>
            </div>
            <div className="col-md-6">
              <Form.Group className="mb-3">
                <Form.Label style={{ margin: 0 }}>Email: </Form.Label>
                <Form.Control
                  type="email"
                  name="email"
                  value={clientInputs.email || ""}
                  onChange={handleClientChange}
                  placeholder="Enter email"
                  disabled={disablePrefilledFields && !!prefillData?.name}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label style={{ margin: 0 }}>
                  Mobile Number: <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  type="text"
                  name="cellnumber"
                  value={clientInputs.cellnumber || ""}
                  onChange={handleClientChange}
                  placeholder="Enter mobile number"
                  required
                  disabled={disablePrefilledFields && !!prefillData?.name}
                />
              </Form.Group>
            </div>
          </div>

          <hr />

          <h4 className="d-flex justify-content-between align-items-center mb-3">
            Pet Information
            {!(disablePrefilledFields && !!prefillData?.name) && (
              <Button
                variant="success"
                onClick={addNewPatient}
                className="sticky-button"
              >
                Add Another Patient
              </Button>
            )}
          </h4>
          {patients.map((patient, index) => (
            <div key={index}>
              {index > 0 && <hr className="my-4" />}
              <div className="row">
                <div className="col-md-6">
                  <Form.Group className="mb-3">
                    <Form.Label style={{ margin: 0 }}>
                      Name: <span className="text-danger">*</span>
                    </Form.Label>
                    <Form.Control
                      type="text"
                      name="name"
                      value={patient.name}
                      onChange={(event) => handlePatientChange(event, index)}
                      placeholder="Enter name"
                      required
                      disabled={disablePrefilledFields && !!prefillData?.name}
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label style={{ margin: 0 }}>
                      Species: <span className="text-danger">*</span>
                    </Form.Label>
                    <Form.Control
                      type="text"
                      name="species"
                      value={patient.species}
                      onChange={(event) => handlePatientChange(event, index)}
                      placeholder="Enter species"
                      required
                      disabled={disablePrefilledFields && !!prefillData?.name}
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label style={{ margin: 0 }}>
                      Gender: <span className="text-danger">*</span>
                    </Form.Label>
                    <Form.Control
                      as="select"
                      name="gender"
                      value={patients.gender}
                      onChange={(event) => handlePatientChange(event, index)}
                      required
                    >
                      <option value="">Select Gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                    </Form.Control>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label style={{ margin: 0 }}>
                      Breed: <span className="text-danger">*</span>
                    </Form.Label>
                    <Form.Control
                      type="text"
                      name="breed"
                      value={patient.breed}
                      onChange={(event) => handlePatientChange(event, index)}
                      placeholder="Enter breed"
                      required
                      disabled={disablePrefilledFields && !!prefillData?.name}
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label style={{ margin: 0 }}>
                      Weight (in kgs.): <span className="text-danger">*</span>
                    </Form.Label>
                    <Form.Control
                      type="number"
                      step="0.1"
                      name="weight"
                      value={patient.weight}
                      onChange={(event) => handlePatientChange(event, index)}
                      placeholder="Enter weight"
                      required
                    />
                  </Form.Group>
                </div>
                <div className="col-md-6">
                  <Form.Group className="mb-3">
                    <Form.Label style={{ margin: 0 }}>
                      Birthdate: <span className="text-danger">*</span>
                    </Form.Label>
                    <Form.Control
                      type="date"
                      name="birthdate"
                      value={patient.birthdate}
                      onChange={(event) => handlePatientChange(event, index)}
                      required
                      max={new Date().toISOString().split("T")[0]} // Set max to today's date
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label style={{ margin: 0 }}>Age: </Form.Label>
                    <Form.Control
                      type="text" // Change to 'text' so that it can display the full age in years and months
                      name="age"
                      value={patient.age}
                      readOnly
                      placeholder="Auto-calculated age"
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label style={{ margin: 0 }}>
                      Distinct Features:{" "}
                    </Form.Label>
                    <Form.Control
                      type="text"
                      name="distinct_features"
                      value={patient.distinct_features}
                      onChange={(event) => handlePatientChange(event, index)}
                      placeholder="Enter distinct features"
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label style={{ margin: 0 }}>
                      Other Details:{" "}
                    </Form.Label>
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
                    <div className="d-flex justify-content-end">
                      <Button
                        variant="danger"
                        onClick={() => removePatient(index)}
                        className="mt-3 mb-3"
                      >
                        Remove Patient
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          <div className="flex button-container d-flex justify-content-end mt-4">
            <Button variant="secondary" className="me-2" onClick={handleClose}>
              Close
            </Button>
            <Button variant="primary" type="submit">
              Save
            </Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
};

export default AddClientAndPatientModal;
