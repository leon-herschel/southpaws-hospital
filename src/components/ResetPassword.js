import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import '../assets/login.css'; // Use the same CSS for consistent design
import logo from '../assets/southpawslogo.png';

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);  // For loading state during API call
  const navigate = useNavigate();
  const location = useLocation();
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
  const token = new URLSearchParams(location.search).get('token'); // Extract the token from URL

  // Check if token exists, if not show an error
  useEffect(() => {
    if (!token) {
      setErrorMessage("Invalid reset token.");
    }
  }, [token]);

  const handleSubmit = (e) => {
    e.preventDefault();

    // Check if passwords match
    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    // Set loading to true when starting the request
    setLoading(true);

    // Send request to backend to reset password
    axios
      .post(`${API_BASE_URL}/api/reset_password.php`, {
        token: token,
        password: password,
      }, {
        headers: {
          "Content-Type": "application/json" // Ensure the backend knows the request is JSON
        }
      })
      .then((response) => {
        setLoading(false); // Turn off loading

        if (response.data.status === 1) {
          setSuccessMessage(response.data.message);
          setErrorMessage('');

          // After 5 seconds, navigate to the login page
          setTimeout(() => {
            navigate('/login'); // Redirect to the login page
          }, 5000); // 5-second delay
        } else {
          setErrorMessage(response.data.message);
          setSuccessMessage('');
        }
      })
      .catch(() => {
        setLoading(false);
        setErrorMessage("An error occurred while resetting the password.");
        setSuccessMessage('');
      });
  };

  return (
    <div className="loginContainer">
      <div className="loginLeftContainer">
        <div className="loginForm">
          <div className="loginTitleContainer">
          <div style={{ fontSize: '37px', fontWeight: 500 }}>Reset Password</div>
          <img src={logo} alt="logo" />
          </div>
          <form onSubmit={handleSubmit}>
            <label htmlFor="password" className="loginLabel">New Password</label>
            <div className="loginInputContainer">
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="loginInputBox"
                required
              />
            </div>
            <br />
            <label htmlFor="confirmPassword" className="loginLabel">Confirm New Password</label>
            <div className="loginInputContainer">
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="loginInputBox"
                required
              />
            </div>
            <br />
            <button className="loginInputButton" type="submit" disabled={loading}>Reset Password</button>
          </form>

          {errorMessage && <p className="loginErrorLabel">{errorMessage}</p>}
          {successMessage && (
            <div>
              <p className="loginSuccessLabel">{successMessage}</p>
              <p>Please wait while we redirect you to the login page...</p>
            </div>
          )}
        </div>
      </div>
      <div className="loginRightContainer">
        <div className="loginForm2">
          <div className="loginTitleContainer2">
            <div>South Paws: Inventory Control Hub</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
