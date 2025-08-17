import React, { useEffect, useState } from "react";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import enUS from "date-fns/locale/en-US";
import AddAppointments from "./AddAppointments";
import TagArrived from "./TagArrived/TagArrived";
import { Modal } from "react-bootstrap";
import { toast } from "react-toastify";
import EditAppointment from "./EditAppointment";
import { useNavigate } from "react-router-dom";
import {
  FaClock,
  FaCheckCircle,
  FaTimesCircle,
  FaCheckDouble,
} from "react-icons/fa";
import Notifications from "./Notifications";
const locales = { "en-US": enUS };

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales,
});

const Appointment = () => {
  const statuses = ["Pending", "Confirmed", "Cancelled", "Done"];
  const cardColors = {
    Pending: "bg-secondary",
    Confirmed: "bg-primary",
    Cancelled: "bg-danger",
    Done: "bg-success",
  };
  const [appointments, setAppointments] = useState([]);
  const [pendingAppointments, setPendingAppointments] = useState([]);
  const [events, setEvents] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showTagModal, setShowTagModal] = useState(false);
  const [serviceColors, setServiceColors] = useState({});
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState("All");
  const doctorOptions = [
    "All",
    ...new Set(appointments.map((a) => a.doctor_name).filter(Boolean)),
  ].map((name) => (name === "All" ? name : `Dr. ${name}`));
  const filteredEvents =
    selectedDoctor === "All"
      ? events
      : events.filter((e) => `Dr. ${e.doctor_name}` === selectedDoctor);
  const navigate = useNavigate();

  const handleEventClick = (event) => {
    setSelectedEvent(event);
    setShowEventModal(true);
  };

  const fetchAppointments = async () => {
    try {
      const res = await axios.get("http://localhost/api/appointments.php");
      setAppointments(res.data.appointments || []);
      formatEvents(res.data.appointments || []);
    } catch (err) {
      console.error("Failed to fetch appointments", err);
    }
  };

  const fetchPendingAppointments = async () => {
    try {
      const res = await axios.get(
        "http://localhost/api/pending_appointments.php"
      );
      setPendingAppointments(res.data.appointments || []);
    } catch (err) {
      console.error("Failed to fetch pending appointments", err);
    }
  };

  const fetchServiceColors = async () => {
    try {
      const res = await axios.get("http://localhost/api/service-colors.php");
      setServiceColors(res.data);
    } catch (err) {
      console.error("Failed to fetch service colors", err);
    }
  };

  useEffect(() => {
    fetchAppointments();
    fetchPendingAppointments();
    fetchServiceColors();
  }, []);

  const formatEvents = (data) => {
    const formatted = data
      .filter((appt) => appt.status !== "Pending") // HIDE PENDING
      .map((appt) => {
        const start = new Date(`${appt.date}T${appt.time}`);
        const end = new Date(`${appt.date}T${appt.end_time}`);
        return {
          id: appt.id,
          title: appt.name || "Appointment",
          start,
          end,
          status: appt.status || "Pending",
          service: appt.service || "",
          reference_number: appt.reference_number || "",
          name: appt.name || "",
          contact: appt.contact || "",
          email: appt.email || "",
          pet_name: appt.pet_name || "",
          pet_breed: appt.pet_breed || "",
          pet_species: appt.pet_species || "",
          doctor_id: appt.doctor_id || "",
          doctor_name: appt.doctor_name || "",
        };
      });
    setEvents(formatted);
  };

  const statusIcons = {
    Pending: <FaClock size={34} />,
    Confirmed: <FaCheckCircle size={34} />,
    Cancelled: <FaTimesCircle size={34} />,
    Done: <FaCheckDouble size={34} />,
  };

  const renderStatusBoxes = () => (
    <div className="d-flex justify-content-between mt-4 mb-4 gap-3">
      {statuses.map((status, idx) => (
        <div
          className={`card text-white ${cardColors[status]} status-card`}
          style={{
            flex: 1,
            cursor:
              status === "Pending" || "Confirmed" || "Cancelled" || "Done"
                ? "pointer"
                : "default",
            minWidth: "180px",
          }}
          key={idx}
          onClick={() => {
            if (
              ["Pending", "Confirmed", "Cancelled", "Done"].includes(status)
            ) {
              navigate(`/appointment/${status.toLowerCase()}`);
            }
          }}
        >
          <div className="card-body d-flex justify-content-between align-items-center">
            <div>
              <h3 className="mb-0 fw-bold">
                {status === "Pending"
                  ? pendingAppointments.length
                  : appointments.filter(
                      (appt) =>
                        appt.status &&
                        appt.status.toLowerCase() === status.toLowerCase()
                    ).length}
              </h3>
              <p className="mb-0">{status}</p>
            </div>
            <div className="ms-3">{statusIcons[status]}</div>
          </div>
        </div>
      ))}
    </div>
  );

  const eventPropGetter = (event) => {
    if (event.status === "Cancelled") {
      return {
        style: {
          backgroundColor: "#dc3545",
          color: "white",
          borderRadius: "5px",
          padding: "2px",
          border: "none",
        },
      };
    }
    const firstService = (event.service || "")
      .split(",")[0]
      .trim()
      .toLowerCase();
    const backgroundColor = serviceColors[firstService] || "#6c757d";

    return {
      style: {
        backgroundColor,
        color: "black",
        borderRadius: "5px",
        padding: "2px",
        border: "none",
      },
    };
  };

  const handleDeleteAppointment = async () => {
    try {
      const userId = localStorage.getItem("userID");
      const userEmail = localStorage.getItem("userEmail");

      await axios.delete("http://localhost/api/appointments.php", {
        data: {
          id: selectedEvent.id,
          user_id: userId,
          name: selectedEvent.name,
          user_email: userEmail,
        },
      });

      toast.success("Appointment deleted successfully!");
      setShowEventModal(false);
      setShowDeleteConfirm(false);
      fetchAppointments();
    } catch (err) {
      console.error("Delete failed", err);
      toast.error("Failed to delete appointment. Please try again.");
    }
  };

  return (
    <div className="container mt-2">
      <div className="container mt-2 d-flex align-items-center justify-content-between p-0">
        <h1 style={{ fontWeight: "bold"}}>Appointments</h1>
        <Notifications />
      </div>
      {renderStatusBoxes()}

      <div className="d-flex justify-content-between align-items-center mb-4 gap-2">
        <div>
          <select
            className="form-select w-auto"
            value={selectedDoctor}
            onChange={(e) => setSelectedDoctor(e.target.value)}
          >
            {doctorOptions.map((doc, index) => (
              <option key={index} value={doc}>
                {doc}
              </option>
            ))}
          </select>
        </div>

        <div className="d-flex gap-2">
          <button
            className="btn btn-primary me-2 btn-gradient"
            onClick={() => setShowTagModal(true)}
          >
            Tag as Arrived
          </button>

          <button
            className="btn btn-primary btn-gradient"
            onClick={() => setShowModal(true)}
          >
            Add Appointment
          </button>
        </div>
      </div>

      <div className="card">
        <div className="card-body" style={{ height: "80vh" }}>
          <Calendar
            localizer={localizer}
            events={filteredEvents}
            startAccessor="start"
            endAccessor="end"
            defaultView="week"
            views={["month", "week", "day"]}
            step={30}
            timeslots={2}
            min={new Date(2025, 0, 1, 8, 0)}
            max={new Date(2025, 0, 1, 18, 0)}
            style={{ height: "100%" }}
            messages={{
              noEventsInRange: "No appointments to show.",
            }}
            eventPropGetter={eventPropGetter}
            onSelectEvent={handleEventClick}
          />
        </div>
      </div>

      {showModal && (
        <Modal
          show={showModal}
          onHide={() => setShowModal(false)}
          size="md"
          backdrop="static"
          keyboard={false}
        >
          <Modal.Header closeButton>
            <Modal.Title>Add Appointment</Modal.Title>
          </Modal.Header>

          <Modal.Body>
            <AddAppointments
              onClose={() => {
                setShowModal(false);
                fetchAppointments();
              }}
            />
          </Modal.Body>
        </Modal>
      )}

      {showTagModal && (
        <Modal
          show={showTagModal}
          onHide={() => setShowTagModal(false)}
          size="md"
          backdrop="static"
          keyboard={false}
        >
          <Modal.Header closeButton>
            <Modal.Title>Tag Arrived</Modal.Title>
          </Modal.Header>

          <Modal.Body>
            <TagArrived
              onClose={() => {
                setShowTagModal(false);
                fetchAppointments();
              }}
            />
          </Modal.Body>
        </Modal>
      )}

      {selectedEvent && (
        <Modal show={showEventModal} onHide={() => setShowEventModal(false)}>
          <Modal.Header closeButton>
            <Modal.Title>Appointment Info</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {/* Personal Details */}
            <section className="mb-3">
              <h6 className="text-primary border-bottom pb-2">
                Personal Details
              </h6>
              <div className="row">
                <div className="col-md-6">
                  <p>
                    <strong>Name:</strong> {selectedEvent.name}
                  </p>
                  <p>
                    <strong>Contact #:</strong> {selectedEvent.contact}
                  </p>
                </div>
                <div className="col-md-6">
                  <p>
                    <strong>Email:</strong> {selectedEvent.email || "N/A"}
                  </p>
                </div>
              </div>
            </section>

            {/* Patient Details */}
            <section className="mb-3">
              <h6 className="text-primary border-bottom pb-2">
                Patient Details
              </h6>
              <div className="row">
                <div className="col-md-6">
                  <p>
                    <strong>Pet Name:</strong> {selectedEvent.pet_name}
                  </p>
                  <p>
                    <strong>Breed:</strong> {selectedEvent.pet_breed}
                  </p>
                </div>
                <div className="col-md-6">
                  <p>
                    <strong>Species:</strong> {selectedEvent.pet_species}
                  </p>
                </div>
              </div>
            </section>

            {/* Service */}
            <section className="mb-4">
              <h6 className="text-primary border-bottom pb-2">Service</h6>
              <p>{selectedEvent.service || "—"}</p>
            </section>

            {/* Appointment Details */}
            <section>
              <h6 className="text-primary border-bottom pb-2">
                Appointment Details
              </h6>
              <div className="row">
                <div className="col-md-6">
                  <p>
                    <strong>Reference #:</strong>{" "}
                    {selectedEvent.reference_number || "—"}
                  </p>
                  <p>
                    <strong>Date:</strong>{" "}
                    {selectedEvent.start
                      ? format(selectedEvent.start, "MMMM dd, yyyy")
                      : "—"}
                  </p>
                  <p>
                    <strong>Time:</strong>{" "}
                    {selectedEvent.start && selectedEvent.end
                      ? `${format(selectedEvent.start, "hh:mm a")} to ${format(
                          selectedEvent.end,
                          "hh:mm a"
                        )}`
                      : "—"}
                  </p>
                </div>
                <div className="col-md-6">
                  <p>
                    <strong>Doctor:</strong>{" "}
                    {selectedEvent.doctor_name || "TBD"}
                  </p>
                  <p>
                    <strong>Status:</strong> {selectedEvent.status || "Pending"}
                  </p>
                </div>
              </div>
            </section>
          </Modal.Body>
          <Modal.Footer>
            {selectedEvent?.status === "Cancelled" && (
              <button
                className="btn btn-danger me-auto"
                onClick={() => setShowDeleteConfirm(true)}
              >
                Delete
              </button>
            )}
            <button
              className="btn btn-secondary"
              onClick={() => setShowEventModal(false)}
            >
              Close
            </button>

            {selectedEvent.status !== "Done" &&
              selectedEvent.status !== "Arrived" && (
                <button
                  className="btn btn-primary me-2"
                  onClick={() => {
                    setShowEditModal(true);
                    setShowEventModal(false);
                  }}
                >
                  Edit
                </button>
              )}
          </Modal.Footer>
        </Modal>
      )}

      {selectedEvent && (
        <EditAppointment
          show={showEditModal}
          onClose={() => setShowEditModal(false)}
          eventData={selectedEvent}
          onUpdated={fetchAppointments}
        />
      )}

      <Modal
        show={showDeleteConfirm}
        onHide={() => setShowDeleteConfirm(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Confirm Deletion</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Are you sure you want to delete this appointment?</p>
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
    </div>
  );
};

export default Appointment;
