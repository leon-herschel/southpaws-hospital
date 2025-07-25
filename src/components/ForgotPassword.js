// ForgotPassword.js
import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../assets/login.css";
import logo from '../assets/southpawslogo.png';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [resetEmail, setResetEmail] = useState(""); // Email for password reset
  const [errorMessage, setErrorMessage] = useState(""); // Error message for invalid email
  const [successMessage, setSuccessMessage] = useState(""); // Success message after submitting email

  const handleForgotPasswordSubmit = (event) => {
    event.preventDefault();

    if (!resetEmail) {
      setErrorMessage("Please enter your email to reset the password.");
      return;
    }

    axios
      .post("http://localhost:80/api/forgot_password.php", { email: resetEmail })
      .then((response) => {
        if (response.data.status === 1) {
          setSuccessMessage("A password reset link has been sent to your email.");
          // Redirect to the login page after a successful reset
          setTimeout(() => {
            navigate("/login");
          }, 1000); // Redirect after 2 seconds to give the user time to see the success message
        } else {
          setErrorMessage(response.data.message || "Error processing request.");
        }
      })
      .catch(() => {
        setErrorMessage("An error occurred while sending the reset link.");
      });
  };

  return (
    <div className={'loginContainer'}>
      <div className={'loginLeftContainer'}>
        <div className={'loginForm'}>
          <div className={'loginTitleContainer'}>
          <div style={{ fontSize: '32px', fontWeight: 500 }}>Forgot Password</div>
          <img src={logo} alt="logo" />
          </div>
          <form onSubmit={handleForgotPasswordSubmit}>
            <label htmlFor="email" className="loginLabel">Email</label>
            <div className={'loginInputContainer'}>
              <input
                type="email"
                id="email"
                value={resetEmail}
                placeholder="Enter your email here"
                onChange={(ev) => setResetEmail(ev.target.value)}
                className={'loginInputBox'}
                required
              />
            </div>
            <br />
            <button className={'loginInputButton'} type="submit">Submit</button>
          </form>
          {errorMessage && <p className="loginErrorLabel">{errorMessage}</p>}
          {successMessage && <p className="loginSuccessLabel">{successMessage}</p>}
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
