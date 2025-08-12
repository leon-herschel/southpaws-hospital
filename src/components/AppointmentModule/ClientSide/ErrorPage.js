import { FaExclamationTriangle } from "react-icons/fa";

function ErrorPage() {
  return (
    <div
      className="d-flex justify-content-center align-items-center"
      style={{ height: "100vh", width: "100vw", backgroundColor: "#f8f9fa" }}
    >
      <div className="text-center px-4">
        <FaExclamationTriangle size={120} className="text-warning mb-4" />
        <h1 className="mb-4 fw-bold" style={{ fontSize: "2.5rem" }}>
          Appointments Unavailable
        </h1>
        <p className="text-muted" style={{ fontSize: "1.25rem" }}>
          We're not accepting online appointments at the moment.
          <br />
          Please check back later or contact the clinic directly.
        </p>
      </div>
    </div>
  );
}

export default ErrorPage;
