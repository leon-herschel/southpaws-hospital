import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useNavigate, useLocation } from "react-router-dom";
import { FaTrash, FaArrowLeft } from "react-icons/fa";
import { format } from "date-fns";
import { Modal, Pagination, OverlayTrigger, Tooltip } from "react-bootstrap";
import DateRangePicker from "../../AppointmentModule/Tables/DateRangePicker";

function CancelledAppointment() {
  const [cancelledAppointments, setCancelledAppointments] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [appointmentsPerPage, setAppointmentsPerPage] = useState(5);
  const [sortBy, setSortBy] = useState({ key: "", order: "" });
  const [searchTerm, setSearchTerm] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [appointmentToDelete, setAppointmentToDelete] = useState(null);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState("");
  const [dateRange, setDateRange] = useState({ startDate: null, endDate: null });

  const currentUserID = localStorage.getItem("userID");
  const currentUserEmail = localStorage.getItem("userEmail");
  const location = useLocation();

  useEffect(() => {
    if (location.state?.searchName) {
      setSearchTerm(location.state.searchName.toLowerCase());
    }
  }, [location.state]);

  const fetchCancelled = async () => {
    try {
      const res = await axios.get("http://localhost/api/appointments.php");
      let cancelled = res.data.appointments.filter(
        (a) => a.status === "Cancelled"
      );

      // Sort by date ASC
      cancelled.sort((b, a) => new Date(b.date) - new Date(a.date));

      setCancelledAppointments(cancelled);
    } catch (err) {
      console.log("Error fetching cancelled appointments", err);
    }
  };

  useEffect(() => {
    fetchCancelled();
  }, []);

  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const confirmBulkDelete = () => {
    if (selectedIds.length === 0) {
      toast.warn("Please select at least one appointment to delete.");
      return;
    }
    setShowBulkDeleteConfirm(true);
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

    const sorted = [...cancelledAppointments].sort((a, b) => {
      const valA = typeof a[key] === "string" ? a[key].toLowerCase() : a[key];
      const valB = typeof b[key] === "string" ? b[key].toLowerCase() : b[key];
      if (valA < valB) return order === "asc" ? -1 : 1;
      if (valA > valB) return order === "asc" ? 1 : -1;
      return 0;
    });

    setCancelledAppointments(sorted);
  };

  const getSortIcon = (key) => {
    if (sortBy.key === key) {
      return sortBy.order === "asc" ? "▲" : "▼";
    }
    return null;
  };

  const filteredAppointments = cancelledAppointments.filter((a) => {
    const matchSearch = Object.values(a).join(" ").toLowerCase().includes(searchTerm);

    if (dateRange.startDate && dateRange.endDate) {
      const apptDate = new Date(a.date);
      return (
        matchSearch &&
        apptDate >= dateRange.startDate &&
        apptDate <= dateRange.endDate
      );
    }

    return matchSearch;
  });

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

  const confirmSingleAppointmentDelete = (id) => {
    const appointment = cancelledAppointments.find((a) => a.id === id);
    if (!appointment) return;
    setAppointmentToDelete(appointment);
    setShowDeleteConfirm(true);
  };

  const handleDeleteAppointment = async () => {
    if (!appointmentToDelete) return;

    try {
      await axios.delete("http://localhost/api/appointments.php", {
        data: {
          id: appointmentToDelete.id,
          user_id: currentUserID,
          user_email: currentUserEmail,
          name: appointmentToDelete.name,
        },
      });

      toast.success(`Appointment for ${appointmentToDelete.name} deleted.`);
      fetchCancelled();
      setSelectedIds((prev) =>
        prev.filter((sid) => sid !== appointmentToDelete.id)
      );
    } catch (error) {
      console.error("Error deleting appointment:", error);
      toast.error("Failed to delete appointment.");
    } finally {
      setShowDeleteConfirm(false);
      setAppointmentToDelete(null);
    }
  };

  const handleBulkDelete = async () => {
    try {
      for (const id of selectedIds) {
        const appointment = cancelledAppointments.find((a) => a.id === id);
        if (!appointment) continue;

        await axios.delete("http://localhost/api/appointments.php", {
          data: {
            id: appointment.id,
            user_id: currentUserID,
            user_email: currentUserEmail,
            name: appointment.name,
          },
        });
      }

      toast.success("Selected appointments deleted successfully.");
      setSelectedIds([]);
      setDeleteConfirmationText(""); // <-- reset input here
      fetchCancelled();
    } catch (error) {
      console.error("Bulk delete error:", error);
      toast.error("An error occurred while deleting selected appointments.");
    } finally {
      setShowBulkDeleteConfirm(false);
    }
  };

  return (
    <div className="container mt-2">
      <button
        className="btn btn-outline-secondary d-inline-flex align-items-center gap-2 mb-3"
        onClick={() => navigate(-1)}
      >
        <FaArrowLeft /> Back
      </button>
      <h2 className="mb-3">Cancelled Appointments</h2>

      <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
        <div className="input-group" style={{ width: "25%" }}>
          <input
            type="text"
            className="form-control shadow-sm"
            onChange={(e) => setSearchTerm(e.target.value.toLowerCase())}
            placeholder="Search"
          />
        </div>

        <DateRangePicker
          startDate={dateRange.startDate}
          endDate={dateRange.endDate}
          onChange={setDateRange}
        />

        {selectedIds.length > 1 && (
          <button className="btn btn-danger" onClick={confirmBulkDelete}>
            Delete Selected
          </button>
        )}
      </div>

      <table className="table table-striped table-hover custom-table align-middle text-center">
        <thead className="table-light shadow-sm">
          <tr>
            <th style={{ width: "5%" }}>
              <input
                type="checkbox"
                className="form-check-input"
                onChange={(e) =>
                  setSelectedIds(
                    e.target.checked
                      ? cancelledAppointments.map((a) => a.id)
                      : []
                  )
                }
                checked={
                  selectedIds.length === cancelledAppointments.length &&
                  cancelledAppointments.length > 0
                }
              />
            </th>
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
              onClick={() => handleSort("pet_breed")}
              style={{ cursor: "pointer" }}
            >
              Pet {getSortIcon("pet_breed")}
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
          {cancelledAppointments.length === 0 ? (
            <tr>
              <td colSpan="11" className="text-center">
                No cancelled appointments.
              </td>
            </tr>
          ) : (
            currentAppointments.map((appt) => (
              <tr key={appt.id}>
                <td>
                  <input
                    type="checkbox"
                    className="form-check-input"
                    checked={selectedIds.includes(appt.id)}
                    onChange={() => toggleSelect(appt.id)}
                  />
                </td>
                <td>{appt.name}</td>
                <td>{appt.date}</td>
                <td>
                  {format(new Date(`1970-01-01T${appt.time}`), "hh:mm a")} -{" "}
                  {format(new Date(`1970-01-01T${appt.end_time}`), "hh:mm a")}
                </td>
                <td>{appt.contact}</td>
                <td>{appt.email}</td>
                <td>{appt.pet_breed}</td>
                <td>{appt.service}</td>
                <td>
                  <OverlayTrigger placement="top" overlay={<Tooltip>Delete</Tooltip>}>
                    <button
                      className="btn btn-md btn-danger"
                      onClick={() => confirmSingleAppointmentDelete(appt.id)}
                    >
                      <FaTrash />
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
      <Modal
        show={showDeleteConfirm}
        onHide={() => setShowDeleteConfirm(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Confirm Deletion</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>
            Are you sure you want to delete the appointment for{" "}
            <strong>{appointmentToDelete?.name}</strong>?
          </p>
        </Modal.Body>
        <Modal.Footer>
          <button
            className="btn btn-secondary"
            onClick={() => setShowDeleteConfirm(false)}
          >
            Cancel
          </button>
          <button className="btn btn-danger" onClick={handleDeleteAppointment}>
            Yes, Delete
          </button>
        </Modal.Footer>
      </Modal>

      <Modal
        show={showBulkDeleteConfirm}
        onHide={() => {
          setShowBulkDeleteConfirm(false);
          setDeleteConfirmationText(""); // reset input
        }}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Confirm Bulk Deletion</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>
            You are about to delete <strong>{selectedIds.length}</strong>{" "}
            selected appointment(s). <br />
            <span className="text-danger">This action cannot be undone!</span>
          </p>
          <p className="mt-3">
            Please type <strong>DELETE</strong> below to confirm:
          </p>
          <input
            type="text"
            className="form-control"
            value={deleteConfirmationText}
            onChange={(e) => setDeleteConfirmationText(e.target.value)}
            placeholder="Type DELETE to confirm"
          />
        </Modal.Body>
        <Modal.Footer>
          <button
            className="btn btn-secondary"
            onClick={() => {
              setShowBulkDeleteConfirm(false);
              setDeleteConfirmationText(""); // reset input
            }}
          >
            Cancel
          </button>
          <button
            className="btn btn-danger"
            disabled={deleteConfirmationText !== "DELETE"}
            onClick={() => {
              handleBulkDelete();
              setDeleteConfirmationText(""); // reset input after success
            }}
          >
            Yes, Delete All
          </button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default CancelledAppointment;
