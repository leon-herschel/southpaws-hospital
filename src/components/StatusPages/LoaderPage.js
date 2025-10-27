import React from "react";

const LoaderPage = () => {
  return (
    <div className="d-flex justify-content-center align-items-center vh-100">
      <div className="spinner-grow text-primary" role="status" style={{ width: '4rem', height: '4rem' }}>
        <span className="visually-hidden">Loading...</span>
      </div>
    </div>
  );
};

export default LoaderPage;
