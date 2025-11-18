import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import "../assets/login.css";

export default function ResetPassword() {
  const navigate = useNavigate();
  const location = useLocation();
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const token = new URLSearchParams(location.search).get("token");

  useEffect(() => {
    if (!token) {
      setErrorMessage("Invalid or missing reset token.");
    }
  }, [token]);

  const handleResetPasswordSubmit = (e) => {
    e.preventDefault();

    if (!token) {
      setErrorMessage("Invalid or missing reset token.");
      return;
    }

    if (password.length < 6) {
      setErrorMessage("Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    setLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    axios
      .post(
        `${API_BASE_URL}/api/reset_password.php`,
        { token, password },
        { headers: { "Content-Type": "application/json" } }
      )
      .then((response) => {
        if (response.data.status === 1) {
          setSuccessMessage("Password reset successful! Redirecting to login...");
          setTimeout(() => navigate("/login"), 3000);
        } else {
          setErrorMessage(response.data.message || "Reset failed. Please try again.");
        }
      })
      .catch(() => {
        setErrorMessage("An error occurred while resetting your password.");
      })
      .finally(() => setLoading(false));
  };

  return (
    <div className="container-fluid vh-100 d-flex align-items-center justify-content-center bg-light">
      <div className="card shadow-lg rounded-4 overflow-hidden w-100" style={{ maxWidth: "950px" }}>
        <div className="row g-0">
          {/* Left Section */}
          <div className="col-md-6 bg-white p-5 d-flex flex-column justify-content-center">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h3 className="fw-semibold m-0">Reset Password</h3>
            </div>

            <form onSubmit={handleResetPasswordSubmit}>
              <div className="mb-3">
                <label htmlFor="password" className="form-label">New Password</label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="form-control shadow-sm"
                  placeholder="Enter new password"
                  required
                />
              </div>

              <div className="mb-3">
                <label htmlFor="confirmPassword" className="form-label">Confirm Password</label>
                <input
                  type="password"
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="form-control shadow-sm"
                  placeholder="Re-enter new password"
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
                    Resetting...
                  </>
                ) : (
                  "Reset Password"
                )}
              </button>
            </form>

            {errorMessage && <p className="text-danger mt-2">{errorMessage}</p>}
            {successMessage && <p className="text-success mt-2">{successMessage}</p>}
          </div>

          {/* Right Section */}
          <div className="col-md-6 d-flex flex-column justify-content-center align-items-center text-white p-5 loginForm2">
            <h3 className="fw-bold text-center">South Paws Hospital Management Hub</h3>
          </div>
        </div>
      </div>
    </div>
  );
}
