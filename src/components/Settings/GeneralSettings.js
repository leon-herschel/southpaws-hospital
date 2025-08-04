import { useState, useEffect } from "react";
import axios from "axios";
import { OverlayTrigger, Tooltip } from "react-bootstrap";
import { FaQuestionCircle } from "react-icons/fa";

function Settings() {
  const [toggle, setToggle] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get("http://localhost/api/ClientSide/get-booking-status.php")
      .then((res) => {
        setToggle(res.data.appointmentFormEnabled);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch booking status", err);
        setLoading(false);
      });
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
                  Toggle this to enable or disable the client appointment website.
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

      {/* Future settings can go here */}
    </div>
  );
}

export default Settings;
