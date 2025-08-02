import React from "react";
import { useNavigate } from "react-router-dom";

function ErrorPage() {
  const navigate = useNavigate();

  const handleGoToClient = () => {
    navigate("/home");
  };

  return (
    <div>
      <button onClick={handleGoToClient}>Back</button>
      <h1> Page is temporary unavailable at the moment</h1>
    </div>
  );
}

export default ErrorPage;
