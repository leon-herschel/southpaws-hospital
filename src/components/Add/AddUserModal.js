import React, { useState, useEffect, useRef } from "react";
import { Modal, Button, Form, OverlayTrigger, Tooltip  } from "react-bootstrap";
import { FaQuestionCircle } from "react-icons/fa";

import axios from "axios";
import "../../assets/add.css";

const AddUserModal = ({ show, handleClose, onUsersAdded }) => {
  const [inputs, setInputs] = useState({
    user_role: 1,
    is_doctor: 0,
  });

  const [confirmPassword, setConfirmPassword] = useState("");
  const [emailError, setEmailError] = useState(""); // State for email error
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
  const brandNameRef = useRef(null);

  useEffect(() => {
    if (show && brandNameRef.current) {
      brandNameRef.current.focus(); // ✅ Auto-focus when modal opens
    }
  }, [show]);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    let newValue;
    if (type === "checkbox") {
      newValue = checked ? 1 : 0;
    } else if (name === "user_role") {
      newValue = parseInt(value);
    } else {
      newValue = value;
    }

    setInputs((prevInputs) => {
      const updated = { ...prevInputs, [name]: newValue };

      if (name === "user_role") {
        if (newValue === 1) {
          updated.is_doctor = 1;
        } else if (newValue === 2) {
          updated.is_doctor = 0;
        }
      }

      return updated;
    });
  };

  const handlePasswordChange = (event) => {
    const { value } = event.target;
    setConfirmPassword(value);
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (inputs.password !== confirmPassword) {
      alert("Password and Confirm Password do not match");
      return;
    }

    // Reset email error before sending request
    setEmailError("");

    axios
      .post(`${API_BASE_URL}/api/internal_users.php`, inputs) // Updated API endpoint
      .then(function (response) {
        if (
          response.data.status === 0 &&
          response.data.message === "Email already exists."
        ) {
          setEmailError("Email already exists."); // Set the error if the email already exists
        } else {
          console.log(response.data);
          onUsersAdded();
          handleClose();
        }
      })
      .catch(function (error) {
        console.error("Error saving user:", error);
      });
  };

  return (
    <Modal show={show} onHide={handleClose} className="custom-modal">
      <Modal.Header closeButton>
        <Modal.Title>Add User</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          <div className="row">
            {/* Left column */}
            <div className="col-md-6">
              <Form.Group className="mb-3">
                <Form.Label style={{ margin: 0 }}>First Name</Form.Label>
                <Form.Control
                  type="text"
                  name="first_name"
                  ref={brandNameRef} // ✅ Attach ref to input field
                  onChange={handleChange}
                  placeholder="Enter first name"
                  required
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label style={{ margin: 0 }}>Last Name</Form.Label>
                <Form.Control
                  type="text"
                  name="last_name"
                  onChange={handleChange}
                  placeholder="Enter last name"
                  required
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label style={{ margin: 0 }}>Email</Form.Label>
                <Form.Control
                  type="email"
                  name="email"
                  onChange={handleChange}
                  placeholder="Enter email"
                  required
                />
                {emailError && <div className="text-danger">{emailError}</div>}{" "}
                {/* Show email error */}
              </Form.Group>
            </div>
            {/* Right column */}
            <div className="col-md-6">
              <Form.Group className="mb-3">
                <Form.Label style={{ margin: 0 }}>User Level</Form.Label>
                <Form.Control
                  as="select"
                  name="user_role"
                  value={inputs.user_role}
                  onChange={handleChange}
                  placeholder="Select user level"
                  required
                >
                  <option value={1}>Veterinarian</option>
                  <option value={2}>Receptionist</option>
                  <option value={3}>Admin</option>
                </Form.Control>
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label style={{ margin: 0 }}>Password</Form.Label>
                <Form.Control
                  type="password"
                  name="password"
                  onChange={handleChange}
                  placeholder="Enter password"
                  required
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label style={{ margin: 0 }}>Confirm Password</Form.Label>
                <Form.Control
                  type="password"
                  name="confirmPassword"
                  onChange={handlePasswordChange}
                  placeholder="Confirm password"
                  required
                />
              </Form.Group>
            </div>
          </div>
          {(inputs.user_role === 1 || inputs.user_role === 3) && (
            <Form.Group className="mt-3">
              <div className="d-flex">
                <Form.Check
                  type="checkbox"
                  name="is_doctor"
                  checked={inputs.is_doctor === 1}
                  onChange={handleChange}
                  id="doctorCheck"
                  label="Is this user a Doctor?"
                />
                <OverlayTrigger
                  placement="right"
                  overlay={
                    <Tooltip id="doctor-tooltip">
                      Checking this will add the user to the appointment module.
                    </Tooltip>
                  }
                >
                  <span className="ms-2">
                    <FaQuestionCircle
                      style={{
                        cursor: "pointer",
                        color: "#6c757d",
                        fontSize: "1rem",
                      }}
                    />
                  </span>
                </OverlayTrigger>
              </div>
            </Form.Group>
          )}
          {/* Note about required fields */}
          <div className="text-muted mt-2">
            <p>
              <em>All fields are required in adding user.</em>
            </p>
          </div>
          <div className="button-container">
            <Button
              variant="primary"
              type="button"
              className="button btn-gradient"
              onClick={handleSubmit}
            >
              Add
            </Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
};

export default AddUserModal;
