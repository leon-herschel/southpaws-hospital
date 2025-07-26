import React, { useEffect, useState } from "react";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";
import "react-big-calendar/lib/css/react-big-calendar.css";
import {
  Calendar,
  dateFnsLocalizer,
} from "react-big-calendar";

import { format, parse, startOfWeek, getDay } from "date-fns";
import enUS from "date-fns/locale/en-US";

const locales = {
  "en-US": enUS,
};

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

  const statuses = ["Pending", "Confirmed", "Cancelled", "Done"];
  const cardColors = {
    Pending: "bg-secondary",
    Confirmed: "bg-primary",
    Cancelled: "bg-danger",
    Done: "bg-success",
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      const res = await axios.get("http://localhost/api/appointments.php");
      setAppointments(res.data.appointments || []);
      formatEvents(res.data.appointments || []);
    } catch (err) {
      console.error("Failed to fetch appointments", err);
    }
  };

  const formatEvents = (data) => {
    const formatted = data.map((appt) => {
      const start = new Date(`${appt.date}T${appt.time}`);
      const end = new Date(`${appt.date}T${appt.end_time}`);

      return {
        title: appt.name || "Appointment",
        start,
        end,
        status: appt.status || "Pending",
      };
    });
    setEvents(formatted);
  };

  const renderStatusBoxes = () => (
    <div className="d-flex justify-content-between mb-4">
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
    let backgroundColor;
    switch (event.status) {
      case "Confirmed":
        backgroundColor = "#0d6efd"; 
        break;
      case "Cancelled":
        backgroundColor = "#dc3545"; 
        break;
      case "Done":
        backgroundColor = "#198754"; 
        break;
      default:
        backgroundColor = "#6c757d"; 
    }

    return {
      style: {
        backgroundColor,
        color: "white",
        borderRadius: "5px",
        padding: "2px",
        border: "none",
      },
    };
  };

  return (
    <div className="container mt-4">
      <h1 className="mb-4" style={{ fontWeight: "bold" }}>Appointments</h1>

      {renderStatusBoxes()}

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
            min={new Date(2025, 0, 1, 8, 0)} // 8:00 AM
            max={new Date(2025, 0, 1, 18, 0)} // 6:00 PM
            style={{ height: "100%" }}
            messages={{
              noEventsInRange: "No appointments to show.",
            }}
            eventPropGetter={eventPropGetter} 
          />
        </div>
      </div>
    </div>
  );
};

export default Appointment;
