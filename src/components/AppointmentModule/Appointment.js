import React, { useEffect, useState } from "react";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import enUS from "date-fns/locale/en-US";
import AddAppointments from "./AddAppointments";
import TagArrived from "./TagArrived";
import { Modal } from "react-bootstrap";
import {  toast } from "react-toastify";
import EditAppointment from "./EditAppointment";
import { useNavigate } from "react-router-dom";

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
  const [events, setEvents] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showTagModal, setShowTagModal] = useState(false);
  const [serviceColors, setServiceColors] = useState({});
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
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
        };
      });
    setEvents(formatted);
  };



  const renderStatusBoxes = () => (
    <div className="d-flex justify-content-between mt-4 mb-4">
      {statuses.map((status, idx) => (
        <div
          className={`card text-white text-center mx-1 ${cardColors[status]}`}
          style={{ flex: 1, cursor: status === "Pending" ? "pointer" : "default" }}
          key={idx}
          onClick={() => {
            if (status === "Pending") navigate("/appointment/pending");
          }}
        >
          <div className="card-body">
            <h5 className="card-title">{status}</h5>
            <p className="card-text">
              {
                appointments.filter(
                  (appt) =>
                    appt.status &&
                    appt.status.toLowerCase() === status.toLowerCase()
                ).length
              }
            </p>
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

  const handleStatusUpdate = async (eventData) => {
    try {
      await axios.put("http://localhost/api/appointments.php", {
        id: eventData.id,
        status: eventData.status,
      });
      toast.success("Appointment status updated!");
      setShowEventModal(false);
      fetchAppointments();
    } catch (err) {
      console.error("Update failed", err);
      toast.error("Failed to update status. Please try again.");
    }
  };

  const handleDeleteAppointment = async () => {
    try {
      await axios.delete("http://localhost/api/appointments.php", {
        data: { id: selectedEvent.id },
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
      <h1 style={{ textAlign: "left", fontWeight: "bold" }}>Appointments</h1>

      {renderStatusBoxes()}

      <div className="d-flex justify-content-end align-items-center mb-4 gap-2">
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

      <div className="card">
        <div className="card-body" style={{ height: "80vh" }}>
          <Calendar
            localizer={localizer}
            events={events}
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

      {selectedEvent && (<Modal show={showEventModal} onHide={() => setShowEventModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Appointment Info</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p><strong>Reference #:</strong> {selectedEvent.reference_number}</p>
          <p><strong>Service:</strong> {selectedEvent.service}</p>
          <p><strong>Date:</strong> {format(selectedEvent.start, 'MMMM dd, yyyy')}</p>
          <p><strong>Time:</strong> {format(selectedEvent.start, 'hh:mm a')} to {format(selectedEvent.end, 'hh:mm a')}</p>
          <p><strong>Name:</strong> {selectedEvent.name}</p>
          <p><strong>Contact #:</strong> {selectedEvent.contact}</p>
          <p><strong>Email:</strong> {selectedEvent.email}</p>
          <p><strong>Status:</strong> {selectedEvent.status}</p>
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
          <button
            className="btn btn-primary me-2"
            onClick={() => {
              setShowEditModal(true);
              setShowEventModal(false);
            }}
          >
            Edit
          </button>
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

    <Modal show={showDeleteConfirm} onHide={() => setShowDeleteConfirm(false)} centered>
      <Modal.Header closeButton>
        <Modal.Title>Confirm Deletion</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p>Are you sure you want to delete this appointment?</p>
      </Modal.Body>
      <Modal.Footer>
        <button className="btn btn-secondary" onClick={() => setShowDeleteConfirm(false)}>
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
