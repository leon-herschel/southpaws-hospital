import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useNavigate, useLocation } from "react-router-dom";
import { FaArrowLeft, FaEye } from "react-icons/fa";
import AddAppointments from "../AddAppointments";
import { Modal } from "react-bootstrap";
import { format } from "date-fns";
import { Pagination, OverlayTrigger, Tooltip } from "react-bootstrap";

const PendingAppointments = () => {
  const [pendingAppointments, setPendingAppointments] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [appointmentsPerPage, setAppointmentsPerPage] = useState(5);
  const [sortBy, setSortBy] = useState({ key: "", order: "" });
  const [searchTerm, setSearchTerm] = useState("");
  const [viewingAppointment, setViewingAppointment] = useState(null);
  const navigate = useNavigate();
  const [showAddAppointment, setShowAddAppointment] = useState(false);
  const [prefillData, setPrefillData] = useState(null);
  const [showRejectConfirm, setShowRejectConfirm] = useState(false);
  const [pendingToDeleteId, setPendingToDeleteId] = useState(null);
  const currentUserID = localStorage.getItem("userID");
  const currentUserEmail = localStorage.getItem("userEmail");
  const location = useLocation();
  
    useEffect(() => {
      if (location.state?.searchName) {
        setSearchTerm(location.state.searchName.toLowerCase());
      }
    }, [location.state]);

  const fetchPending = async () => {
    try {
      const res = await axios.get("http://localhost/api/pending_appointments.php");
      setPendingAppointments(res.data.appointments || []);
    } catch (err) {
      console.error("Error fetching pending appointments", err);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  // Confirm single appointment
  const confirmOne = async (id) => {
    try {
      const appt = pendingAppointments.find((a) => a.id === id);

      // Directly open AddAppointments modal with prefill data
      setPrefillData({
        name: appt.name,
        contact: appt.contact,
        email: appt.email || "",
        pet_name: appt.pet_name,
        pet_breed: appt.pet_breed,
        pet_species: appt.pet_species,
      });
      setPendingToDeleteId(id);
      setViewingAppointment(null); 
      setShowAddAppointment(true); 
    } catch (err) {
      toast.error("Error opening Add Appointment modal");
    }
  };

  const handleRejectClick = (id) => {
    setPendingToDeleteId(id);
    setShowRejectConfirm(true);
  };

  // Actual reject API call triggered by confirmation modal
  const confirmReject = async () => {
    if (!pendingToDeleteId) return;
    try {
      const appt = pendingAppointments.find((a) => a.id === pendingToDeleteId);
      await axios.delete("http://localhost/api/pending_appointments.php", {
        data: {
          id: pendingToDeleteId,
          name: appt?.name,
          user_id: currentUserID,
          user_email: currentUserEmail,
        },
      });
      toast.success("Appointment rejected!");
      setViewingAppointment(null);
      fetchPending();
    } catch (err) {
      toast.error("Error rejecting appointment");
    } finally {
      setShowRejectConfirm(false);
      setPendingToDeleteId(null);
    }
  };

  // Cancel rejection (close modal)
  const cancelReject = () => {
    setShowRejectConfirm(false);
    setPendingToDeleteId(null);
  };

  // Sorting
  const handleSort = (key) => {
    let order = "asc";
    if (sortBy.key === key && sortBy.order === "asc") order = "desc";
    setSortBy({ key, order });

    const sorted = [...pendingAppointments].sort((a, b) => {
      const valA = typeof a[key] === "string" ? a[key].toLowerCase() : a[key];
      const valB = typeof b[key] === "string" ? b[key].toLowerCase() : b[key];
      if (valA < valB) return order === "asc" ? -1 : 1;
      if (valA > valB) return order === "asc" ? 1 : -1;
      return 0;
    });

    setPendingAppointments(sorted);
  };

  const getSortIcon = (key) => {
    if (sortBy.key === key) return sortBy.order === "asc" ? "▲" : "▼";
    return null;
  };

  const filteredAppointments = pendingAppointments.filter((a) =>
    Object.values(a).join(" ").toLowerCase().includes(searchTerm)
  );

  const indexOfLast = currentPage * appointmentsPerPage;
  const indexOfFirst = indexOfLast - appointmentsPerPage;
  const currentAppointments = filteredAppointments.slice(indexOfFirst, indexOfLast);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  const handlePerPageChange = (e) => {
    setCurrentPage(1);
    setAppointmentsPerPage(Number(e.target.value));
  };

  // View modal close
  const closeModal = () => setViewingAppointment(null);

  const handleAddModalClose = async () => {
    setShowAddAppointment(false);
    
    // Delete the pending appointment
    if (pendingToDeleteId) {
      try {
        await axios.delete("http://localhost/api/pending_appointments.php", {
          data: { id: pendingToDeleteId },
        });
      } catch (error) {
        toast.error("Failed to remove pending appointment.");
      }
      setPendingToDeleteId(null);
    }

    fetchPending(); 
  };

  return (
    <div className="container mt-3">
      <button
        className="btn btn-outline-secondary d-inline-flex align-items-center gap-2 mb-3"
        onClick={() => navigate(-1)}
      >
        <FaArrowLeft /> Back
      </button>
      <h2 className="mb-3">Pending Appointments</h2>

      <div className="input-group" style={{ width: "25%" }}>
        <input
          type="text"
          className="form-control shadow-sm"
          onChange={(e) => setSearchTerm(e.target.value.toLowerCase())}
          placeholder="Search"
        />
      </div>

      <table className="table table-striped table-hover custom-table align-middle text-center">
        <thead className="table-light shadow-sm">
          <tr>
            <th onClick={() => handleSort("name")} style={{ cursor: "pointer" }}>
              Name {getSortIcon("name")}
            </th>
            <th>Contact</th>
            <th onClick={() => handleSort("preferred_date")} style={{ cursor: "pointer" }}>
              Preferred Date {getSortIcon("preferred_date")}
            </th>
            <th onClick={() => handleSort("preferred_time")} style={{ cursor: "pointer" }}>
              Preferred Time {getSortIcon("preferred_time")}
            </th>
            <th style={{ width: "10%" }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {currentAppointments.length === 0 ? (
            <tr>
              <td colSpan="5" className="text-center">
                No pending appointments.
              </td>
            </tr>
          ) : (
            currentAppointments.map((appt) => (
              <tr key={appt.id}>
                <td>{appt.name}</td>
                <td>{appt.contact}</td>
                <td>{appt.preferred_date}</td>
                <td>{appt.preferred_time}</td>
                <td>
                  <OverlayTrigger placement="top" overlay={<Tooltip>Review</Tooltip>}>
                    <button
                      className="btn btn-md btn-success"
                      onClick={() => setViewingAppointment(appt)}
                    >
                      <FaEye />
                    </button>
                  </OverlayTrigger>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Pagination */}
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
      {/* Modal */}
      {viewingAppointment && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          role="dialog"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          onClick={closeModal}
        >
          <div
            className="modal-dialog modal-md"
            role="document"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-content">
              <div className="modal-header">
                <h4 className="modal-title">Review Appointment Request</h4>
                <button type="button" className="btn-close" onClick={closeModal} />
              </div>
              <div className="modal-body">
                <section className="mb-3">
                  <h6 className="text-primary border-bottom pb-2">Personal Details</h6>
                  <div className="row">
                    <div className="col-md-6">
                      <p><strong>Name:</strong> {viewingAppointment.name}</p>
                      <p><strong>Contact:</strong> {viewingAppointment.contact}</p>
                    </div>
                    <div className="col-md-6">
                      <p><strong>Email:</strong> {viewingAppointment.email || "N/A"}</p>
                    </div>
                  </div>
                </section>

                <section className="mb-3">
                  <h6 className="text-primary border-bottom pb-2">Patient Details</h6>
                  <div className="row">
                    <div className="col-md-6">
                      <p><strong>Pet Name:</strong> {viewingAppointment.pet_name}</p>
                      <p><strong>Breed:</strong> {viewingAppointment.pet_breed}</p>
                    </div>
                    <div className="col-md-6">
                      <p><strong>Species:</strong> {viewingAppointment.pet_species}</p>
                    </div>
                  </div>
                </section>

                <section className="mb-4">
                  <h6 className="text-primary border-bottom pb-2">Reason for Visit</h6>
                  <p>{viewingAppointment.reason_for_visit}</p>
                </section>

                <section>
                  <h6 className="text-primary border-bottom pb-2">Preferred Schedule</h6>
                  <div>
                    <p>
                      <strong>Preferred Date:</strong>{" "}
                      {viewingAppointment.preferred_date
                        ? format(new Date(viewingAppointment.preferred_date), "MMMM dd, yyyy")
                        : "—"}
                    </p>
                      <p><strong>Preferred Time:</strong> {viewingAppointment.preferred_time}</p>
                    </div>
                      {viewingAppointment.notes && (
                        <p><strong>Additional Notes:</strong> {viewingAppointment.notes}</p>
                      )}
                </section>
              </div>
              <div className="modal-footer">
                <button
                  className="btn btn-success"
                  onClick={() => confirmOne(viewingAppointment.id)}
                > Confirm
                </button>
                <button
                  className="btn btn-danger"
                  onClick={() => handleRejectClick(viewingAppointment.id)}
                >
                  Reject
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Confirmation Modal */}
      <Modal show={showRejectConfirm} onHide={cancelReject} centered>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Rejection</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to reject this appointment? This action cannot be undone.
        </Modal.Body>
        <Modal.Footer>
          <button className="btn btn-secondary" onClick={cancelReject}>
            Cancel
          </button>
          <button className="btn btn-danger" onClick={confirmReject}>
            Yes, Reject
          </button>
        </Modal.Footer>
      </Modal>

      {/* Add Appointment Modal */}
      <Modal
        show={showAddAppointment}
        onHide={() => setShowAddAppointment(false)}
        size="md"
        backdrop="static"
        keyboard={false}
      >
        <Modal.Header closeButton>
          <Modal.Title>Add Appointment</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <AddAppointments
            onClose={handleAddModalClose}
            prefill={prefillData}
          />
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default PendingAppointments;
