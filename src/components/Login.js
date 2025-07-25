import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify"; // ✅ Import Toast
import "react-toastify/dist/ReactToastify.css"; // ✅ Import Toast CSS
import "../assets/login.css";
import logo from '../assets/southpawslogo.png';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

export default function Login({ onLogin }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const userID = localStorage.getItem("userID");
    if (userID) {
      navigate("/home");
    }
  
    // ✅ Read and decode query parameters
    const queryParams = new URLSearchParams(location.search);
    const message = queryParams.get('message');
  
    if (message) {
      const decodedMessage = decodeURIComponent(message); // ✅ Fix: Decode URL-encoded strings
  
      switch (decodedMessage) {
        case "Verification Successful":
          toast.success("Your email has been successfully verified! 🎉");
          break;
        case "Verification Failed":
          toast.error("Verification failed. Please contact support.");
          break;
        case "Invalid or Expired Token":
          toast.error("The verification link is invalid or has already been used.");
          break;
        case "Missing Verification Token":
          toast.error("Missing verification token.");
          break;
        default:
          toast.error("An unknown error occurred.");
      }
  
      // ✅ Remove the query parameters after displaying the toast
      navigate(location.pathname, { replace: true });
    }
  }, [navigate, location]);
  

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!email || !password) {
      setErrorMessage("Email and password are required.");
      return;
    }

    axios.post("http://localhost:80/api/login.php", {
      email: email,
      password: password,
    }, {
      withCredentials: true,
    }).then((response) => {
      if (response.data.status === 1) {
        localStorage.setItem("userID", response.data.id);
        localStorage.setItem("first_name", response.data.first_name);
        localStorage.setItem("last_name", response.data.last_name);
        localStorage.setItem("userRole", response.data.user_role);
        onLogin();
        navigate("/home");
      } else if (response.data.needsVerification) {
        navigate('/verify', { state: { email: email } });
      } else {
        setErrorMessage(response.data.message || "Login failed.");
      }
    }).catch(() => {
      setErrorMessage("An error occurred. Please try again.");
    });
  };

  return (
    <div className={'loginContainer'}>      
      <div className={'loginLeftContainer'}>
        <div className={'loginForm'}>
          <div className={'loginTitleContainer'}>
            <div style={{ fontSize: '37px', fontWeight: 500 }}>Sign in</div>
            <img src={logo} alt="logo" />
          </div>
          <form onSubmit={handleSubmit}>
            <label htmlFor="email" className="loginLabel">Email</label>
            <div className={'loginInputContainer'}>
              <input
                type="text"
                id="email"
                value={email}
                placeholder="Enter your email here"
                onChange={(ev) => setEmail(ev.target.value)}
                className={'loginInputBox'}
              />
            </div>
            <br />
            <label htmlFor="password" className="loginLabel">Password</label>
            <div className={'loginInputContainer'} style={{ position: 'relative' }}>
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                value={password}
                placeholder="Enter your password here"
                onChange={(ev) => setPassword(ev.target.value)}
                className={'loginInputBox'}
              />
              <div
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '20px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  cursor: 'pointer',
                }}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </div>
            </div>
            <br />
            <button className={'loginInputButton'} type="submit">Sign in</button>
          </form>
          {errorMessage && <p className="loginErrorLabel">{errorMessage}</p>}

          {/* Forgot Password link */}
          <div className="forgot-password-link" onClick={() => navigate('/forgot-password')}>
            Forgot your password?
          </div>
        </div>
      </div>
      <div className={'loginRightContainer'}>
        <div className={'loginForm2'}>
          <div className={'loginTitleContainer2'}>
            <div>SouthPaws Sales and Inventory Control HUB</div>
          </div>
        </div>
      </div>
    </div>
  );
}
