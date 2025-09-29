import React, { useState, useEffect, useRef } from "react";
import { Modal, Button, Form } from "react-bootstrap";
import axios from "axios";
import "../../assets/add.css";

const AddUserModal = ({ show, handleClose, onUsersAdded }) => {
  const [inputs, setInputs] = useState({
    user_role: 1,
    is_doctor: 0,
  });

  const [confirmPassword, setConfirmPassword] = useState("");
  const [emailError, setEmailError] = useState(""); // State for email error

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
      .post("http://localhost:80/api/internal_users.php", inputs) // Updated API endpoint
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
              <Form.Group>
                <Form.Label>FIRST NAME</Form.Label>
                <Form.Control
                  type="text"
                  name="first_name"
                  ref={brandNameRef} // ✅ Attach ref to input field
                  onChange={handleChange}
                  placeholder="Enter first name"
                  required
                />
              </Form.Group>
              <Form.Group>
                <Form.Label>LAST NAME</Form.Label>
                <Form.Control
                  type="text"
                  name="last_name"
                  onChange={handleChange}
                  placeholder="Enter last name"
                  required
                />
              </Form.Group>
              <Form.Group>
                <Form.Label>EMAIL</Form.Label>
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
              <Form.Group>
                <Form.Label>USER LEVEL</Form.Label>
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
              <Form.Group>
                <Form.Label>PASSWORD</Form.Label>
                <Form.Control
                  type="password"
                  name="password"
                  onChange={handleChange}
                  placeholder="Enter password"
                  required
                />
              </Form.Group>
              <Form.Group>
                <Form.Label>CONFIRM PASSWORD</Form.Label>
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
              <Form.Check
                type="checkbox"
                label="Is this user a Doctor?"
                name="is_doctor"
                checked={inputs.is_doctor === 1}
                onChange={handleChange}
              />
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
              className="button"
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
