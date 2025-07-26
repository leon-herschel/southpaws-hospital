import React from "react";
import { useState } from "react";
import axios from "axios";

function AddAppointments() {
  const [formData, setFormData] = useState({
    service: "",
    date: "",
    time: "",
    name: "",
    contact: "",
    created_at: "",
    end_time: "",
  });

  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };
  const handleSubmit = async (e) => {
    e.preventDefault();

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
          created_at: "",
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
          <label htmlFor="service"> Service: </label>
          <input
            type="text"
            id="service"
            name="service"
            className="form-control"
            value={formData.service}
            onChange={handleChange}
            autoComplete="on"
            required
          />
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
          <label htmlFor="created_at">Time Created:</label>
          <input
            type="time"
            id="created_at"
            name="created_at"
            className="form-control"
            value={formData.created_at}
            onChange={handleChange}
            autoComplete="off"
            required
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
