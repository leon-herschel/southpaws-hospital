import React from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const Logout = () => {
  const navigate = useNavigate();
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

  const handleLogout = () => {
    const userId = localStorage.getItem("userID");
  
    // Send logout request to backend
    axios
      .post(`${API_BASE_URL}/api/logout.php`, { user_id: userId })
      .then(response => {
        if (response.data.status === 1) {
          // Clear all session-related data
          localStorage.clear(); // Clears all items from localStorage
          sessionStorage.clear(); // Clears sessionStorage if used
          document.cookie.split(";").forEach(cookie => {
            document.cookie = cookie
              .replace(/^ +/, "")
              .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
          });
  
          // Redirect to login page
          navigate("/login");
        } else {
          console.error("Logout failed:", response.data.message);
        }
      })
      .catch(error => {
        console.error("Error logging out:", error);
      });
  };
  

  return (
    <button onClick={handleLogout}>Logout</button>
  );
};

export default Logout;
