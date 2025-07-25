import React from "react";
import { Navigate, Route } from "react-router-dom";

const PrivateRoute = ({ element: Element }) => {
  const isAuthenticated = localStorage.getItem("userID") !== null;

  return isAuthenticated ? <Element /> : <Navigate to="/login" />;
};

export default PrivateRoute;
