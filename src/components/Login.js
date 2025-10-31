import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify"; // ✅ Import Toast
import "react-toastify/dist/ReactToastify.css"; // ✅ Import Toast CSS
import "../assets/login.css";
import logo from "../assets/southpawslogo.png";
import { FaEye, FaEyeSlash } from "react-icons/fa";

export default function Login({ onLogin }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

  useEffect(() => {
    const userID = localStorage.getItem("userID");
    if (userID) {
      navigate("/dashboard");
    }

    const queryParams = new URLSearchParams(location.search);
    const message = queryParams.get("message");

    if (message) {
      const decodedMessage = decodeURIComponent(message);

      switch (decodedMessage) {
        case "Verification Successful":
          toast.success("Your email has been successfully verified!");
          break;
        case "Verification Failed":
          toast.error("Verification failed. Please contact support.");
          break;
        case "Invalid or Expired Token":
          toast.error(
            "The verification link is invalid or has already been used."
          );
          break;
        case "Missing Verification Token":
          toast.error("Missing verification token.");
          break;
        default:
          toast.error("An unknown error occurred.");
      }

      navigate(location.pathname, { replace: true });
    }
  }, [navigate, location]);

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!email || !password) {
      setErrorMessage("Email and password are required.");
      return;
    }

    setLoading(true);
    axios
      .post(`${API_BASE_URL}/api/login.php`, { email, password }, { withCredentials: true })
      .then((response) => {
        if (response.data.status === 1) {
          localStorage.setItem("userID", response.data.id);
          localStorage.setItem("first_name", response.data.first_name);
          localStorage.setItem("last_name", response.data.last_name);
          localStorage.setItem("userRole", response.data.user_role);
          localStorage.setItem("userEmail", response.data.email);
          onLogin();
          navigate("/dashboard");
        } else if (response.data.needsVerification) {
          navigate("/verify", { state: { email } });
        } else {
          setErrorMessage(response.data.message || "Login failed.");
        }
      })
      .catch(() => {
        setErrorMessage("An error occurred. Please try again.");
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
            <h2 className="fw-semibold m-0">Sign in</h2>
            <img src={logo} alt="logo" style={{ width: "220px" }} />
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label htmlFor="email" className="form-label">Email</label>
              <input
                type="text"
                id="email"
                value={email}
                onChange={(ev) => setEmail(ev.target.value)}
                className="form-control shadow-sm"
                placeholder="Enter your email"
              />
            </div>

            <div className="mb-3">
              <label htmlFor="password" className="form-label">Password</label>
              <div className="position-relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  value={password}
                  onChange={(ev) => setPassword(ev.target.value)}
                  className="form-control shadow-sm"
                  placeholder="Enter your password"
                />
                <span
                  className="position-absolute top-50 end-0 translate-middle-y pe-3"
                  style={{ cursor: "pointer" }}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </span>
              </div>
            </div>

            <button
              className="loginInputButton btn-gradient w-100 d-flex justify-content-center align-items-center"
              type="submit"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="spinner-border spinner-border-sm text-light me-2" role="status"></div>
                  Signing in...
                </>
              ) : (
                "Sign in"
              )}
            </button>

          </form>

          {errorMessage && <p className="text-danger mt-2">{errorMessage}</p>}

          <div
            className="forgot-pass-link text-primary mt-3 text-center"
            onClick={() => navigate("/forgot-password")}
          >
            Forgot your password?
          </div>
        </div>

        {/* Right Section */}
        <div className="col-md-6 d-flex flex-column justify-content-center align-items-center text-white p-5 loginForm2">
          <h3 className="fw-bold text-center">
            South Paws Hospital Management Hub
          </h3>
        </div>
      </div>
    </div>
  </div>
);

}
