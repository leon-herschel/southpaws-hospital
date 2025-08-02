import { useState, useEffect } from "react";
import axios from "axios";

function Settings() {
  const [toggle, setToggle] = useState(true);

  useEffect(() => {
    axios
      .get("http://localhost/api/ClientSide/get-booking-status.php")
      .then((res) => {
        setToggle(res.data.appointmentFormEnabled); // ← use the correct field
      })
      .catch((err) => {
        console.error("Failed to fetch booking status", err);
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

  return (
    <div>
      <h2>Settings</h2>
      <button onClick={toggleFunction}>
        {toggle ? "Disable Appointments" : "Enable Appointments"}
      </button>
    </div>
  );
}

export default Settings;
