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

  // Format DB time (HH:MM:SS → HH:MM)
  const formatTime = (timeStr) => {
    if (!timeStr) return "";
    return timeStr.slice(0, 5); // keep only HH:MM
  };

  // ✅ Save booking time
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

  // ✅ Fetch booking status + saved time range
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
                  Toggle this to enable or disable the client appointment
                  website.
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

      {/* Time Limit for Booking */}
      <div className="card shadow-sm mb-4">
        <div className="card-header d-flex align-items-center justify-content-between">
          <h5 className="mb-0">
            Time Limit for Booking{" "}
            <OverlayTrigger
              placement="right"
              overlay={
                <Tooltip>
                  Click this to set the time limits in appointments.
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
          <h5>
            Current Time Limit: <strong>{startTime || "Not set"}</strong> to{" "}
            <strong>{endTime || "Not set"}</strong>
          </h5>

          <div className="mb-3">
            <label htmlFor="AmTime">FROM:</label>
            <input
              type="time"
              id="AmTime"
              name="AmTime"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="form-control"
            />
          </div>

          <div className="mb-3">
            <label htmlFor="PmTime">TO:</label>
            <input
              type="time"
              id="PmTime"
              name="PmTime"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="form-control"
            />
          </div>

          <button className="btn btn-primary" onClick={handleSave}>
            Save Time Limit
          </button>
        </div>
      </div>
    </div>
  );
}

export default Settings;
