import React, { useEffect, useState } from "react";
import axios from "axios";
import { Modal } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { FaEye, FaArrowLeft } from "react-icons/fa";
import { format } from "date-fns";

function DoneAppointments() {
  const [doneAppointments, setDoneAppointments] = useState([]);
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [appointmentsPerPage, setAppointmentsPerPage] = useState(5);
  const [sortBy, setSortBy] = useState({ key: "", order: "" });
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showEventModal, setShowEventModal] = useState(false);

  const currentUserID = localStorage.getItem("userID");
  const currentUserEmail = localStorage.getItem("userEmail");

  const handleEventClick = (event) => {
    setSelectedEvent(event);
    setShowEventModal(true);
  };

  const fetchDone = async () => {
    try {
      const res = await axios.get("http://localhost/api/appointments.php");
      setDoneAppointments(
        res.data.appointments.filter((a) => a.status === "Done")
      );
    } catch (err) {
      console.log("Error in fetching done appointments", err);
    }
  };

  useEffect(() => {
    fetchDone();
  }, []);

  const handleFilter = (e) => {
    setSearchTerm(e.target.value.toLowerCase());
  };

  const handleSort = (key) => {
    let order = "asc";
    if (sortBy.key === key && sortBy.order === "asc") {
      order = "desc";
    }
    setSortBy({ key, order });

    const sorted = [...doneAppointments].sort((a, b) => {
      const valA = typeof a[key] === "string" ? a[key].toLowerCase() : a[key];
      const valB = typeof b[key] === "string" ? b[key].toLowerCase() : b[key];
      if (valA < valB) return order === "asc" ? -1 : 1;
      if (valA > valB) return order === "asc" ? 1 : -1;
      return 0;
    });

    setDoneAppointments(sorted);
  };

  const getSortIcon = (key) => {
    if (sortBy.key === key) {
      return sortBy.order === "asc" ? "▲" : "▼";
    }
    return null;
  };

  const filteredAppointments = doneAppointments.filter((a) =>
    Object.values(a).join(" ").toLowerCase().includes(searchTerm)
  );

  const indexOfLast = currentPage * appointmentsPerPage;
  const indexOfFirst = indexOfLast - appointmentsPerPage;
  const currentAppointments = filteredAppointments.slice(
    indexOfFirst,
    indexOfLast
  );

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const handlePerPageChange = (e) => {
    setCurrentPage(1);
    setAppointmentsPerPage(Number(e.target.value));
  };

  return (
    <div className="container mt-3">
      <button
        className="btn btn-outline-secondary d-inline-flex align-items-center gap-2 mb-3"
        onClick={() => navigate(-1)}
      >
        <FaArrowLeft /> Back
      </button>
      <h2 className="mb-3"> Done Appointments </h2>

      <div className="d-flex justify-content-between align-items-center mb-3">
        <div className="input-group" style={{ width: "25%" }}>
          <input
            type="text"
            className="form-control"
            onChange={handleFilter}
            placeholder="Search"
          />
        </div>
      </div>
      <table className="table table-striped align-middle text-center">
        <thead>
          <tr>
            <th
              onClick={() => handleSort("name")}
              style={{ cursor: "pointer" }}
            >
              Name {getSortIcon("name")}
            </th>
            <th
              onClick={() => handleSort("date")}
              style={{ cursor: "pointer" }}
            >
              Date {getSortIcon("date")}
            </th>
            <th>Time</th>
            <th
              onClick={() => handleSort("contact")}
              style={{ cursor: "pointer" }}
            >
              Contact {getSortIcon("contact")}
            </th>
            <th
              onClick={() => handleSort("email")}
              style={{ cursor: "pointer" }}
            >
              Email {getSortIcon("email")}
            </th>
            <th
              onClick={() => handleSort("pet_name")}
              style={{ cursor: "pointer", width: "100px" }}
            >
              Pet Name {getSortIcon("pet_name")}
            </th>
            <th
              onClick={() => handleSort("pet_species")}
              style={{ cursor: "pointer" }}
            >
              Species {getSortIcon("pet_species")}
            </th>
            <th
              onClick={() => handleSort("pet_breed")}
              style={{ cursor: "pointer" }}
            >
              Breed {getSortIcon("pet_breed")}
            </th>
            <th
              onClick={() => handleSort("service")}
              style={{ cursor: "pointer" }}
            >
              Service {getSortIcon("service")}
            </th>
            <th style={{ width: "15%" }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {doneAppointments.length === 0 ? (
            <tr>
              <td colSpan="11" className="text-center">
                No Done appointments.
              </td>
            </tr>
          ) : (
            currentAppointments.map((appt) => (
              <tr key={appt.id}>
                <td>{appt.name}</td>
                <td>{appt.date}</td>
                <td>
                  {format(new Date(`1970-01-01T${appt.time}`), "hh:mm a")} -{" "}
                  {format(new Date(`1970-01-01T${appt.end_time}`), "hh:mm a")}
                </td>
                <td>{appt.contact}</td>
                <td>{appt.email}</td>
                <td>{appt.pet_name}</td>
                <td>{appt.pet_species}</td>
                <td>{appt.pet_breed}</td>
                <td>{appt.service}</td>
                <td>
                  <button
                    className="btn btn-md btn-danger"
                    onClick={() => handleEventClick(appt)}
                    title="Show Appointment"
                  >
                    <FaEye />
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
      <div className="d-flex justify-content-between mb-3">
        <div className="d-flex align-items-center">
          <label className="me-2">Items per page:</label>
          <select
            value={appointmentsPerPage}
            onChange={handlePerPageChange}
            className="form-select form-select-sm"
            style={{ width: "80px" }}
          >
            <option value="5">5</option>
            <option value="10">10</option>
            <option value="15">15</option>
            <option value="20">20</option>
          </select>
        </div>
        <ul className="pagination mb-0">
          {Array.from(
            {
              length: Math.ceil(
                filteredAppointments.length / appointmentsPerPage
              ),
            },
            (_, index) => (
              <li
                key={index}
                className={`page-item ${
                  currentPage === index + 1 ? "active" : ""
                }`}
                style={{ cursor: "pointer" }}
                onClick={() => paginate(index + 1)}
              >
                <span className="page-link">{index + 1}</span>
              </li>
            )
          )}
        </ul>
      </div>
      {selectedEvent && (
        <Modal show={showEventModal} onHide={() => setShowEventModal(false)}>
          <Modal.Header closeButton>
            <Modal.Title>Appointment Info</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <p>
              <strong>Reference #:</strong> {selectedEvent.reference_number}
            </p>
            {selectedEvent &&
              selectedEvent.date &&
              !isNaN(new Date(selectedEvent.date)) && (
                <p>
                  <strong>Date:</strong>{" "}
                  {format(new Date(selectedEvent.date), "MMMM dd, yyyy")}
                </p>
              )}

            {selectedEvent && selectedEvent.time && selectedEvent.end_time && (
              <p>
                <strong>Time:</strong>{" "}
                {format(
                  new Date(`1970-01-01T${selectedEvent.time}`),
                  "hh:mm a"
                )}{" "}
                to{" "}
                {format(
                  new Date(`1970-01-01T${selectedEvent.end_time}`),
                  "hh:mm a"
                )}
              </p>
            )}
            <p>
              <strong>Name:</strong> {selectedEvent.name}
            </p>
            <p>
              <strong>Contact #:</strong> {selectedEvent.contact}
            </p>
            <p>
              <strong>Email:</strong> {selectedEvent.email}
            </p>
            <p>
              <strong>Pet Name:</strong> {selectedEvent.pet_name}
            </p>
            <p>
              <strong>Species:</strong> {selectedEvent.pet_species}
            </p>
            <p>
              <strong>Breed:</strong> {selectedEvent.pet_breed}
            </p>
            <p>
              <strong>Service:</strong> {selectedEvent.service}
            </p>
            <p>
              <strong>Status:</strong> {selectedEvent.status}
            </p>
          </Modal.Body>
          <Modal.Footer>
            <button
              className="btn btn-secondary"
              onClick={() => setShowEventModal(false)}
            >
              Close
            </button>
          </Modal.Footer>
        </Modal>
      )}
    </div>
  );
}

export default DoneAppointments;
