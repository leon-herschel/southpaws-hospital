import React from "react";
import { useState, useEffect } from "react";
import axios from "axios";

function AddAppointments() {
  const [formData, setFormData] = useState({
    service: "",
    date: "",
    time: "",
    name: "",
    contact: "",
    end_time: "",
  });

  const [message, setMessage] = useState("");
  const [services, setServices] = useState([]);

  useEffect(() => {
    axios
      .get("http://localhost/api/get_services.php")
      .then((res) => {
        setServices(res.data);
      })
      .catch((err) => {
        console.error("Failed to load services:", err);
      });
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };
  const handleSubmit = async (e) => {
    e.preventDefault();

    const { time, name, contact, end_time } = formData;

    //contact number must be 11-digit
    if (!/^\d{11}$/.test(contact)) {
      setMessage("Contact number must be exactly 11 digits.");
      return;
    }

    //No special characters for name
    if (!/^[A-Za-z\s]+$/.test(name)) {
      setMessage("Name should only contain letters and spaces.");
      return;
    }

    //End time must be later than the set time
    const start = new Date(`1970-01-01T${time}`);
    const end = new Date(`1970-01-01T${end_time}`);
    if (end <= start) {
      setMessage("End time must be later than the start time");
      return;
    }

    try {
      const res = await axios.post(
        "http://localhost/api/add_appointments.php",
        formData
      );

      if (res.data.success) {
        setMessage("Appointment submitted successfully!");
        setFormData({
          service: "",
          date: "",
          time: "",
          name: "",
          contact: "",
          end_time: "",
        });
      } else {
        setMessage(res.data.error || "Something went wrong.");
      }
    } catch (error) {
      console.error("Submission Error:", error.response?.data || error.message);
      setMessage(
        error.response?.data?.error ||
          "Failed to submit. Please check your server."
      );
    }
  };

  return (
    <div>
      <h2> ADD APPOINTMENT </h2>
      {message && <div className="alert alert-info">{message}</div>}
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="service">Service:</label>
          <select
            id="service"
            name="service"
            className="form-control"
            value={formData.service}
            onChange={handleChange}
            required
          >
            <option value="">-- Select a service --</option>
            {services.map((s) => (
              <option key={s.id} value={s.name}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="date"> Date:</label>
          <input
            type="date"
            id="date"
            name="date"
            className="form-control"
            value={formData.date}
            onChange={handleChange}
            autoComplete="off"
            required
          />
        </div>

        <div>
          <label htmlFor="time">Time:</label>
          <input
            type="time"
            id="time"
            name="time"
            className="form-control"
            value={formData.time}
            onChange={handleChange}
            autoComplete="off"
            required
          />
        </div>

        <div>
          <label htmlFor="name">Name:</label>
          <input
            type="text"
            id="name"
            name="name"
            className="form-control"
            value={formData.name}
            onChange={handleChange}
            autoComplete="on"
            required
          />
        </div>

        <div>
          <label htmlFor="contact">Contact Number:</label>
          <input
            type="number"
            id="contact"
            name="contact"
            className="form-control"
            value={formData.contact}
            onChange={handleChange}
            autoComplete="off"
            required
            style={{
              MozAppearance: "textfield",
              WebkitAppearance: "none",
              margin: 0,
            }}
          />
        </div>

        <div>
          <label htmlFor="end_time">End Time:</label>
          <input
            type="time"
            id="end_time"
            name="end_time"
            className="form-control"
            value={formData.end_time}
            onChange={handleChange}
            autoComplete="off"
            required
          />
        </div>

        <button type="submit">Submit </button>
      </form>
    </div>
  );
}

export default AddAppointments;
