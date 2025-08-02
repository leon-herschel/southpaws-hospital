import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

const PendingAppointments = () => {
  const [pendingAppointments, setPendingAppointments] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [appointmentsPerPage, setAppointmentsPerPage] = useState(5);
  const [sortBy, setSortBy] = useState({ key: "", order: "" });

  const fetchPending = async () => {
    try {
      const res = await axios.get("http://localhost/api/appointments.php");
      setPendingAppointments(
        res.data.appointments.filter((a) => a.status === "Pending")
      );
    } catch (err) {
      console.error("Error fetching pending appointments", err);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const confirmSelected = async () => {
    try {
      for (let id of selectedIds) {
        const appt = pendingAppointments.find((a) => a.id === id);
        await axios.put("http://localhost/api/appointments.php", {
          ...appt,
          status: "Confirmed",
        });
      }
      toast.success("Selected appointments confirmed!");
      setSelectedIds([]);
      fetchPending();
    } catch (err) {
      toast.error("Error confirming appointments");
    }
  };

  const rejectSelected = async () => {
    try {
      for (let id of selectedIds) {
        await axios.delete("http://localhost/api/appointments.php", {
          data: { id },
        });
      }
      toast.success("Selected appointments deleted!");
      setSelectedIds([]);
      fetchPending();
    } catch (err) {
      toast.error("Error deleting appointments");
    }
  };

  const confirmOne = async (id) => {
    try {
      const appt = pendingAppointments.find((a) => a.id === id);
      await axios.put("http://localhost/api/appointments.php", {
        ...appt,
        status: "Confirmed",
      });
      toast.success("Appointment confirmed!");
      fetchPending();
    } catch (err) {
      toast.error("Error confirming appointment");
    }
  };

  const rejectOne = async (id) => {
    try {
      await axios.delete("http://localhost/api/appointments.php", {
        data: { id },
      });
      toast.success("Appointment rejected!");
      fetchPending();
    } catch (err) {
      toast.error("Error rejecting appointment");
    }
  };

  const handleSort = (key) => {
    let order = "asc";
    if (sortBy.key === key && sortBy.order === "asc") {
      order = "desc";
    }
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
    if (sortBy.key === key) {
      return sortBy.order === "asc" ? "▲" : "▼";
    }
    return null;
  };

  const indexOfLast = currentPage * appointmentsPerPage;
  const indexOfFirst = indexOfLast - appointmentsPerPage;
  const currentAppointments = pendingAppointments.slice(
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
      <button className="btn btn-primary mb-3" onClick={() => navigate(-1)}>
        Back
      </button>
      <h2 className="mb-3">Pending Appointments</h2>

      {selectedIds.length > 0 && (
        <div className="mb-3">
          <button className="btn btn-success me-2" onClick={confirmSelected}>
            Confirm Selected
          </button>
          <button className="btn btn-danger" onClick={rejectSelected}>
            Reject Selected
          </button>
        </div>
      )}

      <table className="table table-striped align-middle text-center">
        <thead>
          <tr>
            <th style={{ width: "5%" }}>
              <input
                type="checkbox"
                className="form-check-input"
                onChange={(e) =>
                  setSelectedIds(
                    e.target.checked ? pendingAppointments.map((a) => a.id) : []
                  )
                }
                checked={
                  selectedIds.length === pendingAppointments.length &&
                  pendingAppointments.length > 0
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
              onClick={() => handleSort("service")}
              style={{ cursor: "pointer" }}
            >
              Service {getSortIcon("service")}
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
            <th style={{ width: "15%" }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {pendingAppointments.length === 0 ? (
            <tr>
              <td colSpan="11" className="text-center">
                No pending appointments.
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
                <td>{appt.service}</td>
                <td>{appt.date}</td>
                <td>
                  {appt.time} - {appt.end_time}
                </td>
                <td>{appt.contact}</td>
                <td>{appt.email}</td>
                <td>{appt.pet_name}</td>
                <td>{appt.pet_species}</td>
                <td>{appt.pet_breed}</td>
                <td>
                  <button
                    className="btn btn-sm btn-success me-2"
                    onClick={() => confirmOne(appt.id)}
                  >
                    Confirm
                  </button>
                  <button
                    className="btn btn-sm btn-danger"
                    onClick={() => rejectOne(appt.id)}
                  >
                    Reject
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
                pendingAppointments.length / appointmentsPerPage
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
    </div>
  );
};

export default PendingAppointments;
