import { useState, useEffect } from "react";
import axios from "axios";
import { OverlayTrigger, Tooltip } from "react-bootstrap";
import { FaQuestionCircle } from "react-icons/fa";
import { toast } from "react-toastify";

function Settings() {
  const [toggle, setToggle] = useState(true);
  const [loading, setLoading] = useState(true);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [logDays, setLogDays] = useState("");

  const handleLogSave = () => {
    if (!logDays || logDays <= 0) {
      toast.error("Please enter a valid number of days.");
      return;
    }

    axios
      .post("http://localhost/api/Settings/set_log_retention.php", { days: logDays })
      .then((res) => {
        if (res.data.status === "success") {
          toast.success("Log retention setting saved!");
        } else {
          toast.error(res.data.message || "Failed to save log retention setting.");
        }
      })
      .catch((err) => {
        toast.error("Server error: " + err.message);
      });
  };

  // Format DB time (HH:MM:SS → HH:MM)
  const formatTime = (timeStr) => {
    if (!timeStr) return "";
    return timeStr.slice(0, 5); // keep only HH:MM
  };

  const handleSave = () => {
    if (startTime >= endTime) {
      alert("End time must be later than start time!");
      return;
    }

    axios
      .post("http://localhost/api/Settings/set_time_appointments.php", {
        startTime,
        endTime,
      })
      .then((res) => {
        if (res.data.status === "success") {
          toast.success("Booking time updated!");
        } else {
          toast.error(res.data.message || "Failed to save booking time");
        }
      })
      .catch((err) => {
        toast.error("Server error: " + err.message);
      });
  };

  // Fetch booking status + saved time range
  useEffect(() => {
    const fetchData = async () => {
      try {
        // fetch toggle status
        const statusRes = await axios.get(
          "http://localhost/api/ClientSide/get-booking-status.php"
        );
        setToggle(statusRes.data.appointmentFormEnabled);

        // fetch time limits
        const timeRes = await axios.get(
          "http://localhost/api/Settings/get_time_appointments.php"
        );
          if (timeRes.data && timeRes.data.start_time && timeRes.data.end_time) {
            setStartTime(formatTime(timeRes.data.start_time));
            setEndTime(formatTime(timeRes.data.end_time));
        }

        const logRes = await axios.get("http://localhost/api/Settings/get_log_retention.php");
          if (logRes.data && logRes.data.days) {
            setLogDays(logRes.data.days);
        }
        
        setLoading(false);
      } catch (err) {
        console.error("Failed to fetch settings", err);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const toggleFunction = () => {
    const newStatus = !toggle;
    axios
      .post("http://localhost/api/ClientSide/update-booking-status.php", {
        appointmentFormEnabled: newStatus ? 1 : 0,
      })
      .then(() => setToggle(newStatus))
      .catch((err) => console.error("Toggle failed", err));
  };

  if (loading) return <p>Loading...</p>;

  const formatTo12Hour = (timeStr) => {
    if (!timeStr) return "";
    const [hour, minute] = timeStr.split(":");
    let h = parseInt(hour, 10);
    const ampm = h >= 12 ? "PM" : "AM";
    h = h % 12 || 12;
    return `${h}:${minute} ${ampm}`;
  };

  return (
    <div className="container light-style flex-grow-1 container-p-y">
      <h1 className="font-weight-bold py-3 mb-4">Settings</h1>

      {/* Online Appointments Setting */}
      <div className="card shadow-sm mb-4">
        <div className="card-header d-flex align-items-center justify-content-between">
          <h5 className="mb-0">
            Online Appointment{" "}
            <OverlayTrigger
              placement="right"
              overlay={
                <Tooltip>
                  Toggle this to enable or disable the appointment feature on the website
                </Tooltip>
              }
            >
              <span style={{ cursor: "pointer", color: "#6c757d" }}>
                <FaQuestionCircle />
              </span>
            </OverlayTrigger>
          </h5>
        </div>
        <div className="card-body">
          <div className="form-check form-switch">
            <input
              className="form-check-input"
              type="checkbox"
              id="appointmentToggle"
              checked={toggle}
              onChange={toggleFunction}
            />
            <label className="form-check-label" htmlFor="appointmentToggle">
              {toggle
                ? "Clients can currently book appointments via the website."
                : "Clients cannot book appointments via the website right now."}
            </label>
          </div>
        </div>
      </div>

      {/* Clinic Schedule Setting */}
      <div className="card shadow-sm mb-4">
        <div className="card-header d-flex align-items-center justify-content-between">
          <h5 className="mb-0">
            Clinic Schedule{" "}
            <OverlayTrigger
              placement="right"
              overlay={
                <Tooltip>
                  Set your clinic’s operating hours. Appointments can only be
                  booked within these times.
                </Tooltip>
              }
            >
              <span style={{ cursor: "pointer", color: "#6c757d" }}>
                <FaQuestionCircle />
              </span>
            </OverlayTrigger>
          </h5>
        </div>

        <div className="card-body">
          <p className="text-muted mb-4">
            Current Schedule:{" "}
            <strong>{startTime ? formatTo12Hour(startTime) : "Not set"}</strong>{" "}
            – <strong>{endTime ? formatTo12Hour(endTime) : "Not set"}</strong>
          </p>

          <div className="row g-3">
            <div className="col-md-6">
              <label htmlFor="startTime" className="form-label fw-semibold">
                Opening Time
              </label>
              <input
                type="time"
                id="startTime"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="form-control shadow-sm"
              />
            </div>

            <div className="col-md-6">
              <label htmlFor="endTime" className="form-label fw-semibold">
                Closing Time
              </label>
              <input
                type="time"
                id="endTime"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="form-control shadow-sm"
              />
            </div>
          </div>

          <div className="d-flex justify-content-end mt-4">
            <button className="btn btn-primary px-4" onClick={handleSave}>
              Save Schedule
            </button>
          </div>
        </div>
      </div>

      {/* Log Retention Settings */}
      <div className="card shadow-sm mb-4">
        <div className="card-header d-flex align-items-center justify-content-between">
          <h5 className="mb-0">
            Log Retention{" "}
            <OverlayTrigger
              placement="right"
              overlay={
                <Tooltip>
                  Set how many days logs should be kept. Older logs will be
                  automatically deleted every time the system runs.
                </Tooltip>
              }
            >
              <span style={{ cursor: "pointer", color: "#6c757d" }}>
                <FaQuestionCircle />
              </span>
            </OverlayTrigger>
          </h5>
        </div>

        <div className="card-body">
          <div className="row g-3 align-items-center">
            <div className="col-md-6">
              <label htmlFor="logDays" className="form-label fw-semibold">
                Retain logs for (days)
              </label>
              <input
                type="number"
                id="logDays"
                className="form-control shadow-sm"
                placeholder="e.g. 30"
                min="1"
                value={logDays}
                onChange={(e) => setLogDays(e.target.value)}
              />
            </div>

            <div className="col-md-6 d-flex justify-content-end align-items-end">
              <button
                className="btn btn-primary px-4"
                onClick={handleLogSave}
                disabled={!logDays}
              >
                Save Retention Period
              </button>
            </div>
          </div>

          <p className="text-muted mt-3">
            Logs older than the saved number of days will be automatically deleted.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Settings;
