import React, { useEffect, useState } from "react";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import enUS from "date-fns/locale/en-US";
import AddAppointments from "./AddAppointments";
import { Modal } from "react-bootstrap";

const locales = { "en-US": enUS };

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales,
});

const Appointment = () => {
  const [appointments, setAppointments] = useState([]);
  const [events, setEvents] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [serviceColors, setServiceColors] = useState({});


  const statuses = ["Pending", "Confirmed", "Cancelled", "Done"];
  const cardColors = {
    Pending: "bg-secondary",
    Confirmed: "bg-primary",
    Cancelled: "bg-danger",
    Done: "bg-success",
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
    const formatted = data.map((appt) => {
      const start = new Date(`${appt.date}T${appt.time}`);
      const end = new Date(`${appt.date}T${appt.end_time}`);
      return {
        title: appt.name || "Appointment",
        start,
        end,
        status: appt.status || "Pending",
        service: appt.service || "", 
      };
    });
    setEvents(formatted);
  };

  const renderStatusBoxes = () => (
    <div className="d-flex justify-content-between mt-4 mb-4">
      {statuses.map((status, idx) => (
        <div
          className={`card text-white text-center mx-1 ${cardColors[status]}`}
          style={{ flex: 1 }}
          key={idx}
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
    const firstService = (event.service || "").split(",")[0].trim().toLowerCase();
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


  return (
    <div className="container mt-2">
      <h1 style={{ textAlign: "left", fontWeight: "bold" }}>Appointments</h1>

      {renderStatusBoxes()}

      <div className="d-flex justify-content-end align-items-center mb-4">
        <button
          className="btn btn-primary"
          onClick={() => setShowModal(true)}
          style={{
            backgroundImage: "linear-gradient(to right, #006cb6, #31b44b)",
            color: "#ffffff",
            borderColor: "#006cb6",
            fontWeight: "bold",
          }}
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
    </div>
  );
};

export default Appointment;
