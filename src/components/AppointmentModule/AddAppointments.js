import React, { useState, useEffect } from "react";
import axios from "axios";
import { Button } from "react-bootstrap";
import { AiOutlineDelete } from "react-icons/ai";

const AddAppointments = ({ onClose }) => {
  const [formData, setFormData] = useState({
    service: [""],
    date: "",
    time: "",
    name: "",
    contact: "",
    end_time: "",
    status: "Confirmed",
    reference_number: "",
  });

  const [message, setMessage] = useState("");
  const [services, setServices] = useState([]);
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
    setFormData((prevData) => ({
      ...prevData,
      reference_number: generateReferenceNumber(),
    }));
  }, []);

  const generateReferenceNumber = () => {
    const now = new Date();
    const yy = now.getFullYear().toString().slice(-2);
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const random = Math.floor(1000 + Math.random() * 9000); 
    return `REF-${yy}${mm}${dd}-${random}`;
  };

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
    const latestAllowedStart = new Date(`1970-01-01T08:00`);
    const latestAllowedEnd = new Date(`1970-01-01T17:00`);

    if (start < latestAllowedStart) {
      setMessage("Start time must not be earlier than 8AM");
      setIsLoading(false);
      return;
    }

    if (end <= start) {
      setMessage("End time must be later than the start time");
      setIsLoading(false);
      return;
    }

    if (end > latestAllowedEnd) {
      setMessage("End time must not be later than 5PM");
      setIsLoading(false);
      return;
    }

    const formToSend = {
      ...formData,
      service: formData.service.filter((s) => s !== "").join(", "),
      reference_number: formData.reference_number,
    };

    try {
      const res = await axios.post(
        "http://localhost/api/add_appointments.php",
        formToSend
      );

      if (res.data.success) {
        setMessage("Appointment submitted successfully!");
        setFormData({
          service: [""],
          date: "",
          time: "",
          name: "",
          contact: "",
          end_time: "",
          status: "Confirmed",
          reference_number: generateReferenceNumber(),
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
        {/* SERVICES */}
        <div className="mb-3">
          <label>Services:</label>
          {formData.service.map((selected, idx) => {
            const alreadySelected = formData.service.filter(
              (_, i) => i !== idx
            );
            return (
              <div key={idx} className="d-flex align-items-center mb-2 gap-2">
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
                    <AiOutlineDelete />
                  </button>
                )}
              </div>
            );
          })}

          <button
            type="button"
            className="btn btn-outline-primary btn-sm mb-2"
            onClick={addAnotherService}
          >
            + Add Another Service
          </button>
        </div>

        <div className="row">
          <div className="col-md-6">
            <div className="mb-3">
              <label htmlFor="date">Date:</label>
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

            <div className="mb-3">
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

            <div className="mb-3">
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
          </div>

          <div className="col-md-6">
            <div className="mb-3">
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

            <div className="mb-3">
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

            <div className="mb-3">
              <label htmlFor="reference_code">Reference Number:</label>
              <input
                type="text"
                id="reference_number"
                name="reference_number"
                className="form-control"
                value={formData.reference_number}
                readOnly
              />
            </div>
          </div>
        </div>

        {/* SUBMIT BUTTON */}
        <div className="button-container">
          <Button
            variant="primary"
            type="submit"
            className="button btn-gradient"
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
