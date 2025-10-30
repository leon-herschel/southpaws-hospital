import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';  // Import default styles
import "../assets/login.css";
import logo from '../assets/southpawslogo.png';

export default function VerifyAccount() {
  const navigate = useNavigate();
  const [verificationCode, setVerificationCode] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!verificationCode) {
      setErrorMessage("Verification code is required.");
      return;
    }

    axios.post(`${API_BASE_URL}/api/verify.php`, {
      verification_token: verificationCode,
    }, {
      withCredentials: true,
    }).then((response) => {
      if (response.data.status === 1) {
        toast.success("Verification Successful");
        // Navigate after the toast message has had time to display
        setTimeout(() => navigate("/home"), 2500);
      } else {
        setErrorMessage(response.data.message || "Verification failed.");
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
            <div style={{ fontSize: '37px', fontWeight: 500 }}>Verify Your Account</div>
            <img src={logo} alt="logo" />
          </div>
          <form onSubmit={handleSubmit}>
            <label htmlFor="verificationCode" className="loginLabel">Verification Code</label>
            <div className={'loginInputContainer'}>
              <input
                type="text"
                id="verificationCode"
                value={verificationCode}
                onChange={(ev) => setVerificationCode(ev.target.value)}
                className={'loginInputBox'}
                placeholder="Enter your verification code here"
              />
            </div>
            <br />
            <button className={'loginInputButton'} type="submit">Verify Account</button>
          </form>
          {errorMessage && <p className="loginErrorLabel">{errorMessage}</p>}
          <div className="forgot-password-link" onClick={() => navigate('/resend-verification')}>
            Back
          </div>
        </div>
      </div>
      <div className={'loginRightContainer'}>
        <div className={'loginForm2'}>
          <div className={'loginTitleContainer2'}>
            <div>South Paws: Inventory Control Hub</div>
          </div>
        </div>
      </div>

    </div>
  );
}
