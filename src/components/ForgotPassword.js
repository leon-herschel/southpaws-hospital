import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../assets/login.css";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [resetEmail, setResetEmail] = useState(""); 
  const [errorMessage, setErrorMessage] = useState(""); 
  const [successMessage, setSuccessMessage] = useState(""); 
  const [loading, setLoading] = useState(false);
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

  const handleForgotPasswordSubmit = (event) => {
    event.preventDefault();

    if (!resetEmail) {
      setErrorMessage("Please enter your email to reset the password.");
      return;
    }

    setLoading(true);

    axios
      .post(`${API_BASE_URL}/api/forgot_password.php`, { email: resetEmail })
      .then((response) => {
        if (response.data.status === 1) {
          setSuccessMessage("A password reset link has been sent to your email.");
          setErrorMessage("");
          // Redirect to login after success
          setTimeout(() => {
            navigate("/login");
          }, 2000);
        } else {
          setErrorMessage(response.data.message || "Error processing request.");
        }
      })
      .catch(() => {
        setErrorMessage("An error occurred while sending the reset link.");
      })
      .finally(() => {
        setLoading(false); 
      });
  };

  return (
    <div className="container-fluid vh-100 d-flex align-items-center justify-content-center bg-light">
      <div className="card shadow-lg rounded-4 overflow-hidden w-100" style={{ maxWidth: "950px" }}>
        <div className="row g-0">
          {/* Left Section */}
          <div className="col-md-6 bg-white p-5 d-flex flex-column justify-content-center">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h3 className="fw-semibold m-0">Forgot Password</h3>
            </div>

            <form onSubmit={handleForgotPasswordSubmit}>
              <div className="mb-3">
                <label htmlFor="email" className="form-label">Email</label>
                <input
                  type="email"
                  id="email"
                  value={resetEmail}
                  onChange={(ev) => setResetEmail(ev.target.value)}
                  className="form-control shadow-sm"
                  placeholder="Enter your email"
                  required
                />
              </div>

              <button
                className="loginInputButton btn-gradient w-100 d-flex justify-content-center align-items-center"
                type="submit"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="spinner-border spinner-border-sm text-light me-2" role="status"></div>
                    Submitting...
                  </>
                ) : (
                  "Submit"
                )}
              </button>
            </form>

            {errorMessage && <p className="text-danger mt-2">{errorMessage}</p>}
            {successMessage && <p className="text-success mt-2">{successMessage}</p>}
          </div>

          {/* Right Section */}
          <div className="col-md-6 d-flex flex-column justify-content-center align-items-center text-white p-5 loginForm2">
            <h3 className="fw-bold text-center">
              SouthPaws Hospital Management Hub
            </h3>
          </div>
        </div>
      </div>
    </div>
  );
}
