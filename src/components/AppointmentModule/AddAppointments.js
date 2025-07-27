import React from "react";
import { useState, useEffect } from "react";
import axios from "axios";
import { Button } from "react-bootstrap";

const AddAppointments = ({ onClose }) => {
  const [formData, setFormData] = useState({
    service: [""],
    date: "",
    time: "",
    name: "",
    contact: "",
    end_time: "",
    status: "Confirmed",
  });

  const [message, setMessage] = useState("");
  const [services, setServices] = useState([]);
  const [serviceSelectRef, setServiceSelectRef] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

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

  const handleChange = (e, index = null) => {
    const { name, value } = e.target;

    if (name === "service" && index !== null) {
      const updatedServices = [...formData.service];
      updatedServices[index] = value;
      setFormData((prevData) => ({
        ...prevData,
        service: updatedServices,
      }));
    } else {
      setFormData((prevData) => ({
        ...prevData,
        [name]: value,
      }));
    }
  };

  const addAnotherService = () => {
    setFormData((prevData) => ({
      ...prevData,
      service: [...prevData.service, ""],
    }));
  };

  const removeService = (index) => {
    setFormData((prevData) => {
      const updated = [...prevData.service];
      updated.splice(index, 1);
      return { ...prevData, service: updated };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    const { time, name, contact, end_time } = formData;

    if (!/^\d{11}$/.test(contact)) {
      setMessage("Contact number must be exactly 11 digits.");
      setIsLoading(false);
      return;
    }

    if (!/^[A-Za-z\s]+$/.test(name)) {
      setMessage("Name should only contain letters and spaces.");
      setIsLoading(false);
      return;
    }

    const start = new Date(`1970-01-01T${time}`);
    const end = new Date(`1970-01-01T${end_time}`);
    const latestAllowedEnd = new Date(`1970-01-01T17:00`);

    if (end <= start) {
      setMessage("End time must be later than the start time");
      setIsLoading(false);
      return;
    }

    if (end > latestAllowedEnd) {
      setMessage("End time must not be later than 5pm");
      setIsLoading(false);
      return;
    }

    const formToSend = {
      ...formData,
      service: formData.service.filter((s) => s !== "").join(", "),
    };

    try {
      console.log("Submitting data:", formData);
      const res = await axios.post(
        "http://localhost/api/add_appointments.php",
        formToSend
      );

      if (res.data.success) {
        setMessage("Appointment submitted successfully!");
        setFormData({
          service: [],
          date: "",
          time: "",
          name: "",
          contact: "",
          end_time: "",
          status: "Confirmed",
        });
        if (onClose) onClose();
      } else {
        setMessage(res.data.error || "Something went wrong.");
      }
    } catch (error) {
      console.error("Submission Error:", error.response?.data || error.message);
      setMessage(
        error.response?.data?.error ||
          "Failed to submit. Please check your server."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      {message && <div className="alert alert-info">{message}</div>}
      <form onSubmit={handleSubmit}>
        <div>
          <label>Services:</label>
          {formData.service.map((selected, idx) => {
            const alreadySelected = formData.service.filter(
              (_, i) => i !== idx
            );
            return (
              <div key={idx} className="d-flex mb-2 align-items-center gap-2">
                <select
                  name="service"
                  className="form-control"
                  value={selected}
                  onChange={(e) => handleChange(e, idx)}
                  required
                >
                  <option value="">-- Select a service --</option>
                  {services.map((s) => (
                    <option
                      key={s.id}
                      value={s.name}
                      disabled={alreadySelected.includes(s.name)}
                    >
                      {s.name}
                    </option>
                  ))}
                </select>

                {formData.service.length > 1 && (
                  <button
                    type="button"
                    className="btn btn-outline-danger btn-sm"
                    onClick={() => removeService(idx)}
                  >
                    X
                  </button>
                )}
              </div>
            );
          })}

          <button
            type="button"
            className="btn btn-outline-primary btn-sm"
            onClick={addAnotherService}
          >
            + Add Another Service
          </button>
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
          <label htmlFor="time">From:</label>
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
          <label htmlFor="end_time">To:</label>
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

        <div className="button-container">
          <Button
            variant="primary"
            type="submit"
            className="button"
            disabled={isLoading}
          >
            {isLoading ? "Adding..." : "Add"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default AddAppointments;
