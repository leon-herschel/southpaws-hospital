import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useNavigate, useLocation } from "react-router-dom";
import { FaArrowLeft, FaEdit, FaEye } from "react-icons/fa";
import { format, parseISO, isSameDay } from "date-fns";
import { Pagination, Modal, OverlayTrigger, Tooltip } from "react-bootstrap";
import EditAppointment from "../EditAppointment";
import DateRangePicker from "../../AppointmentModule/Tables/DateRangePicker";

function ConfirmedAppointments() {
  const [confirmedAppointments, setConfirmedAppointments] = useState([]);
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [appointmentsPerPage, setAppointmentsPerPage] = useState(5);
  const [sortBy, setSortBy] = useState({ key: "", order: "" });
  const [searchTerm, setSearchTerm] = useState("");
  const [showEditModal, setShowEditModal] = useState(false);
  const [editData, setEditData] = useState(null);
  const location = useLocation();
  const [showEventModal, setShowEventModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [filterDate, setFilterDate] = useState(null);
  const [dateRange, setDateRange] = useState({ startDate: null, endDate: null });

  useEffect(() => {
    if (location.state?.searchName) {
      setSearchTerm(location.state.searchName.toLowerCase());
    }
  }, [location.state]);

  const handleEventClick = (appointment) => {
    setSelectedEvent(appointment);
    setShowEventModal(true);
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const dateParam = params.get("date"); // expects YYYY-MM-DD
    if (dateParam) {
      setFilterDate(dateParam);
      setSearchTerm(""); 
    } else {
      setFilterDate(null);
    }
  }, [location.search]);

  const fetchConfirmed = async () => {
    try {
      const res = await axios.get("http://localhost/api/appointments.php");
      let confirmed = res.data.appointments.filter((a) => a.status === "Confirmed");

      // Sort by date ASC on initial load
      confirmed.sort((b, a) => new Date(b.date) - new Date(a.date));

      setConfirmedAppointments(confirmed);
    } catch (err) {
      console.log("Error fetching confirmed appointments", err);
    }
  };

  useEffect(() => {
    fetchConfirmed();
  }, []);

  const editSelected = (appointment) => {
    if (!appointment) return;
    prepareEditData(appointment);
  };
  const prepareEditData = (appointment) => {
    if (
      appointment &&
      appointment.date &&
      appointment.time &&
      appointment.end_time
    ) {
      const start = new Date(`${appointment.date}T${appointment.time}`);
      const end = new Date(`${appointment.date}T${appointment.end_time}`);
      setEditData({ ...appointment, start, end });
      setShowEditModal(true);
    } else {
      console.warn("Missing fields in appointment:", appointment);
      toast.error("Selected appointment is missing date/time information.");
    }
  };

  const handleModalClose = () => {
    setShowEditModal(false);
    setEditData(null);
  };

  const handleAppointmentUpdated = () => {
    fetchConfirmed(); // Refresh data after update
  };

  const handleFilter = (e) => {
    setSearchTerm(e.target.value.toLowerCase());
  };

  const handleSort = (key) => {
    let order = "asc";
    if (sortBy.key === key && sortBy.order === "asc") {
      order = "desc";
    }
    setSortBy({ key, order });

    const sorted = [...confirmedAppointments].sort((a, b) => {
      const valA = typeof a[key] === "string" ? a[key].toLowerCase() : a[key];
      const valB = typeof b[key] === "string" ? b[key].toLowerCase() : b[key];
      if (valA < valB) return order === "asc" ? -1 : 1;
      if (valA > valB) return order === "asc" ? 1 : -1;
      return 0;
    });

    setConfirmedAppointments(sorted);
  };

  const getSortIcon = (key) => {
    if (sortBy.key === key) {
      return sortBy.order === "asc" ? "▲" : "▼";
    }
    return null;
  };

  const baseList = confirmedAppointments.filter((a) => {
    const appointmentDate = new Date(a.date);

    if (filterDate && !dateRange.startDate && !dateRange.endDate) {
      return isSameDay(parseISO(a.date), parseISO(filterDate));
    }

    // If a date range is selected
    if (dateRange.startDate && dateRange.endDate) {
      return (
        appointmentDate >= new Date(dateRange.startDate) &&
        appointmentDate <= new Date(dateRange.endDate)
      );
    }

    return true;
  });

  const filteredAppointments = baseList.filter((a) =>
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
    <div className="container mt-2">
      <button
        className="btn btn-outline-secondary d-inline-flex align-items-center gap-2 mb-3"
        onClick={() => navigate(-1)}
      >
        <FaArrowLeft /> Back
      </button>
      <h2 className="mb-3">Confirmed Appointments</h2>
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
      {/* Search Bar */}
        <div className="input-group" style={{ width: "25%", minWidth: "220px" }}>
          <input
            type="text"
            className="form-control shadow-sm"
            onChange={handleFilter}
            placeholder="Search"
          />
        </div>

        {/* Date Range Picker */}
        <div style={{ minWidth: "250px" }}>
          <DateRangePicker
            startDate={dateRange.startDate}
            endDate={dateRange.endDate}
            onChange={setDateRange}
          />
        </div>
      </div>

      <table className="table table-striped table-hover custom-table align-middle text-center">
        <thead className="table-light shadow-sm">
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
            <th
              onClick={() => handleSort("doctor_name")}
              style={{ cursor: "pointer" }}
            >
              Doctor {getSortIcon("doctor_name")}
            </th>
            <th style={{ width: "15%" }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredAppointments.length === 0 ? (
            <tr>
              <td colSpan="11" className="text-center">
                No confirmed appointments.
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
                <td>{appt.pet_breed}</td>
                <td>{appt.service}</td>
                <td>{appt.doctor_name || "—"}</td>
                <td>
                  <OverlayTrigger placement="top" overlay={<Tooltip>View</Tooltip>}>
                    <button
                      className="btn btn-md btn-success me-2"
                      onClick={() => handleEventClick(appt)}
                      title="View Appointment Info"
                    >
                      <FaEye />
                    </button>
                  </OverlayTrigger>

                  <OverlayTrigger placement="top" overlay={<Tooltip>Edit</Tooltip>}>
                    <button
                      className="btn btn-md btn-primary"
                      onClick={() => editSelected(appt)}
                      title="Edit Appointment"
                    >
                      <FaEdit />
                    </button>
                  </OverlayTrigger>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <div className="d-flex justify-content-between mb-3">
      {/* Items per page selector */}
      <div className="d-flex align-items-center">
        <label className="me-2 fw-bold">Items per page:</label>
        <select
          value={appointmentsPerPage}
          onChange={handlePerPageChange}
          className="form-select form-select-sm shadow-sm"
          style={{ width: "80px" }}
        >
          <option value={5}>5</option>
          <option value={10}>10</option>
          <option value={15}>15</option>
          <option value={20}>20</option>
        </select>
      </div>

      {/* Pagination aligned right */}
      <Pagination className="mb-0">
        {/* Prev button */}
        <Pagination.Prev
          onClick={() => currentPage > 1 && paginate(currentPage - 1)}
          disabled={currentPage === 1}
        />

        {Array.from(
          { length: Math.ceil(filteredAppointments.length / appointmentsPerPage) },
          (_, index) => index + 1
        )
          .filter(
            (page) =>
              page === 1 ||
              page === Math.ceil(filteredAppointments.length / appointmentsPerPage) ||
              (page >= currentPage - 2 && page <= currentPage + 2)
          )
          .map((page, i, arr) => (
            <React.Fragment key={page}>
              {/* Ellipsis when skipping pages */}
              {i > 0 && arr[i] !== arr[i - 1] + 1 && <Pagination.Ellipsis disabled />}
              <Pagination.Item
                active={page === currentPage}
                onClick={() => paginate(page)}
              >
                {page}
              </Pagination.Item>
            </React.Fragment>
          ))}

        {/* Next button */}
        <Pagination.Next
          onClick={() =>
            currentPage < Math.ceil(filteredAppointments.length / appointmentsPerPage) &&
            paginate(currentPage + 1)
          }
          disabled={
            currentPage === Math.ceil(filteredAppointments.length / appointmentsPerPage)
          }
        />
      </Pagination>
    </div>

      {editData && (
        <EditAppointment
          show={showEditModal}
          onClose={handleModalClose}
          eventData={editData}
          onUpdated={handleAppointmentUpdated}
        />
      )}

      {/* View Appointment Modal */}
      <Modal show={showEventModal} onHide={() => setShowEventModal(false)}>
          <Modal.Header closeButton>
            <Modal.Title>Appointment Info</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {/* Personal Details */}
            <section className="mb-3">
              <h6 className="text-primary border-bottom pb-2">Personal Details</h6>
              <div className="row">
                <div className="col-md-6">
                  <p className="text-break"><strong>Name:</strong> {selectedEvent?.name}</p>
                  <p><strong>Contact #:</strong> {selectedEvent?.contact}</p>
                </div>
                <div className="col-md-6">
                  <p className="text-break"><strong>Email:</strong> {selectedEvent?.email || "N/A"}</p>
                </div>
              </div>
            </section>
  
            {/* Patient Details */}
            <section className="mb-3">
              <h6 className="text-primary border-bottom pb-2">Patient Details</h6>
              <div className="row">
                <div className="col-md-6">
                  <p><strong>Pet Name:</strong> {selectedEvent?.pet_name}</p>
                  <p><strong>Breed:</strong> {selectedEvent?.pet_breed}</p>
                </div>
                <div className="col-md-6">
                  <p><strong>Species:</strong> {selectedEvent?.pet_species}</p>
                </div>
              </div>
            </section>
  
            {/* Service */}
            <section className="mb-4">
              <h6 className="text-primary border-bottom pb-2">Service</h6>
              <p>{selectedEvent?.service || "—"}</p>
            </section>
  
            {/* Appointment Details */}
            <section>
              <h6 className="text-primary border-bottom pb-2">Appointment Details</h6>
              <div className="row">
                {/* Left column */}
                <div className="col-md-6">
                  {selectedEvent?.date && !isNaN(new Date(selectedEvent.date)) && (
                    <p>
                      <strong>Date:</strong>{" "}
                      {format(new Date(selectedEvent.date), "MMMM dd, yyyy")}
                    </p>
                  )}
                  {selectedEvent?.time && selectedEvent?.end_time && (
                    <p>
                      <strong>Time:</strong>{" "}
                      {format(new Date(`1970-01-01T${selectedEvent.time}`), "hh:mm a")} to{" "}
                      {format(new Date(`1970-01-01T${selectedEvent.end_time}`), "hh:mm a")}
                    </p>
                  )}
                </div>

                {/* Right column */}
                <div className="col-md-6">
                  <p><strong>Doctor:</strong> {selectedEvent?.doctor_name || "TBD"}</p>
                  <p><strong>Status:</strong> {selectedEvent?.status || "Pending"}</p>
                </div>
              </div>
            </section>

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
    </div>

  );
}

export default ConfirmedAppointments;
