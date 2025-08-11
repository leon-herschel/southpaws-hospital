import React from "react";
import logo from "./../../assets/southpawslogowhite.png";

const ClientTopBar = () => {
  return (
    <div
      style={{
        background: "linear-gradient(to right, #006cb6, #31b44b)",
        padding: "0 1rem",
        display: "flex",
        alignItems: "center",
        height: "50px",
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
      }}
    >
      <img
        src={logo}
        alt="South Paws Veterinary Hospital"
        style={{ height: "40px", objectFit: "contain" }}
      />
    </div>
  );
};

export default ClientTopBar;
