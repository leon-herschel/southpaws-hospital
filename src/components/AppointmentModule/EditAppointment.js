import React, { useState, useEffect, useRef } from "react";
import { Modal, Form } from "react-bootstrap";
import axios from "axios";
import { toast } from "react-toastify";
import { AiOutlineDelete } from "react-icons/ai";

const EditAppointment = ({ show, onClose, eventData, onUpdated }) => {
  const [services, setServices] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const currentUserID = localStorage.getItem("userID");
  const currentUserEmail = localStorage.getItem("userEmail");

  const [showServiceDropdown, setShowServiceDropdown] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowServiceDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const [formData, setFormData] = useState({
    id: "",
    name: "",
    contact: "",
    email: "",
    service: [""],
    date: "",
    time: "",
    end_time: "",
    status: "",
    pet_name: "",
    pet_species: "",
    pet_breed: "",
  });

  useEffect(() => {
    axios
      .get("http://localhost/api/get_services.php")
      .then((res) => setServices(res.data))
      .catch((err) => {
        console.error("Failed to load services:", err);
        toast.error("Failed to load available services.");
      });
  }, []);

  useEffect(() => {
    if (eventData && eventData.id) {
      setFormData({
        id: eventData.id,
        name: eventData.name,
        contact: eventData.contact,
        email: eventData.email || "",
        service: eventData.service
          ? eventData.service.split(", ").map((s) => s.trim())
          : [""],
        date: eventData.start.toISOString().split("T")[0],
        time: eventData.start.toTimeString().substring(0, 5),
        end_time: eventData.end.toTimeString().substring(0, 5),
        status: eventData.status,
        pet_name: eventData.pet_name || "",
        pet_species: eventData.pet_species || "",
        pet_breed: eventData.pet_breed || "",
      });
    }
  }, [eventData]);

  useEffect(() => {
    if (formData.date) {
      axios
        .get(`http://localhost/api/get-booked-slots.php?date=${formData.date}`)
        .then((res) => {
          setAvailableSlots(res.data.bookedRanges || []);
        })
        .catch((err) => {
          console.error("Failed to fetch booked slots", err);
          toast.error("Error loading booked slots.");
          setAvailableSlots([]);
        });
    }
  }, [formData.date]);

  const handleChange = (e, index = null) => {
    const { name, value } = e.target;

    if (name === "service" && index !== null) {
      const updatedServices = [...formData.service];
      updatedServices[index] = value;
      setFormData((prev) => ({ ...prev, service: updatedServices }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleUpdate = async () => {
    const { name, contact, time, end_time } = formData;

    // Contact validation
    if (!/^\d{11}$/.test(contact)) {
      toast.error("Contact number must be exactly 11 digits.");
      return;
    }

    // Name validation
    if (!/^[A-Za-z\s]+$/.test(name)) {
      toast.error("Name should only contain letters and spaces.");
      return;
    }

    // Time range validation
    const start = new Date(`1970-01-01T${time}`);
    const end = new Date(`1970-01-01T${end_time}`);
    const latestAllowedStart = new Date(`1970-01-01T08:00`);
    const latestAllowedEnd = new Date(`1970-01-01T17:00`);

    if (start < latestAllowedStart) {
      toast.error("Start time must not be earlier than 8AM");
      return;
    }

    if (end <= start) {
      toast.error("End time must be later than the start time");
      return;
    }

    if (end > latestAllowedEnd) {
      toast.error("End time must not be later than 5PM");
      return;
    }

    if (isOverlapping(formData.time, formData.end_time)) {
      toast.error("This time slot overlaps with another appointment.");
      return;
    }

    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      toast.error("Please enter a valid email address.");
      return;
    }

    const updatedData = {
      ...formData,
      service: formData.service.filter((s) => s !== "").join(", "),
      user_id: currentUserID,
      user_email: currentUserEmail,
    };

    try {
      await axios.put("http://localhost/api/appointments.php", updatedData);
      toast.success("Appointment updated successfully!");
      onUpdated();
      onClose();
    } catch (err) {
      console.error("Update failed", err);
      toast.error("Failed to update appointment.");
    }
  };

  const isOverlapping = (start, end) => {
    const startTime = new Date(`1970-01-01T${start}`);
    const endTime = new Date(`1970-01-01T${end}`);

    return availableSlots.some((slot) => {
      if (String(slot.id) === String(formData.id)) return false;

      const bookedStart = new Date(`1970-01-01T${slot.time}`);
      const bookedEnd = new Date(`1970-01-01T${slot.end_time}`);

      return startTime < bookedEnd && endTime > bookedStart;
    });
  };

  return (
    <Modal show={show} onHide={onClose} backdrop="static">
      <Modal.Header closeButton>
        <Modal.Title>Edit Appointment</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          <div className="row">
            <div className="col-md-6">
              <Form.Group className="mb-3">
                <Form.Label>Date:</Form.Label>
                <Form.Control
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  required
                  min={new Date().toISOString().split("T")[0]}
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>From:</Form.Label>
                <Form.Control
                  type="time"
                  name="time"
                  value={formData.time}
                  onChange={handleChange}
                  required
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>To:</Form.Label>
                <Form.Control
                  type="time"
                  name="end_time"
                  value={formData.end_time}
                  onChange={handleChange}
                  required
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Status:</Form.Label>
                <select
                  name="status"
                  className="form-control"
                  value={formData.status}
                  onChange={handleChange}
                  required
                >
                  <option value="Confirmed">Confirmed</option>
                  <option value="Pending">Pending</option>
                  <option value="Cancelled">Cancelled</option>
                  <option value="Done">Done</option>
                </select>
              </Form.Group>
            </div>

            <div className="col-md-6">
              <Form.Group className="mb-3">
                <Form.Label>Name:</Form.Label>
                <Form.Control
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Contact Number:</Form.Label>
                <Form.Control
                  type="text"
                  name="contact"
                  value={formData.contact}
                  onChange={(e) => {
                    // Prevent non-digits from being typed
                    const value = e.target.value.replace(/\D/g, "");
                    setFormData((prev) => ({ ...prev, contact: value }));
                  }}
                  required
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Email:</Form.Label>
                <Form.Control
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </Form.Group>
            </div>
          </div>

          <h5 className="mt-3">Patient Details</h5>
          <div className="card mb-2 mt-2">
            <div className="card-body">
              <div className="row">
                <div className="col-md-6">
                  <div className="mb-3">
                    <label htmlFor="pet_name">Pet Name:</label>
                    <input
                      type="text"
                      id="pet_name"
                      name="pet_name"
                      className="form-control"
                      value={formData.pet_name}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label htmlFor="pet_breed">Breed:</label>
                    <input
                      type="text"
                      id="pet_breed"
                      name="pet_breed"
                      className="form-control"
                      value={formData.pet_breed}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className="col-md-6">
                  <div className="mb-3">
                    <label htmlFor="pet_species">Species:</label>
                    <input
                      type="text"
                      id="pet_species"
                      name="pet_species"
                      className="form-control"
                      value={formData.pet_species}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            <hr className="mt-3" />

            <div
              className="form-floating mb-3 position-relative"
              ref={dropdownRef}
            >
              {/* INPUT that opens the dropdown */}
              <input
                type="text"
                className="form-control"
                id="floatingServices"
                onClick={() => setShowServiceDropdown(!showServiceDropdown)}
                readOnly
                placeholder="Select Services"
                value=""
              />
              <label htmlFor="floatingServices">Select Services</label>
              {/* DROPDOWN */}
              {showServiceDropdown && (
                <div
                  className="border rounded p-2 position-absolute bg-white shadow"
                  style={{
                    zIndex: 10,
                    top: "100%",
                    left: 0,
                    right: 0,
                    maxHeight: "200px",
                    overflowY: "auto",
                  }}
                >
                  {services.map((service) => (
                    <div className="form-check" key={service.id}>
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id={`service-${service.id}`}
                        value={service.name}
                        checked={formData.service.includes(service.name)}
                        onChange={(e) => {
                          const isChecked = e.target.checked;
                          const updated = isChecked
                            ? [...formData.service, service.name]
                            : formData.service.filter(
                                (s) => s !== service.name
                              );

                          setFormData((prev) => ({
                            ...prev,
                            service: updated,
                          }));
                        }}
                      />
                      <label
                        className="form-check-label"
                        htmlFor={`service-${service.id}`}
                      >
                        {service.name} - ₱{service.price}
                      </label>
                    </div>
                  ))}

                  <div className="text-end mt-2">
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-secondary"
                      onClick={() => setShowServiceDropdown(false)}
                    >
                      Done
                    </button>
                  </div>
                </div>
              )}
              {/* BADGES for selected services */}
              {formData.service.length > 0 && (
                <div className="mt-2 d-flex flex-wrap gap-2">
                  {formData.service
                    .filter((serviceName) => {
                      return (
                        serviceName &&
                        services.some((s) => s.name === serviceName)
                      );
                    })
                    .map((serviceName) => {
                      const service = services.find(
                        (s) => s.name === serviceName
                      );

                      return (
                        <span
                          key={serviceName}
                          className="badge bg-dark d-flex align-items-center"
                          style={{ gap: "6px" }}
                        >
                          {service.name} -₱{service.price}
                          <button
                            type="button"
                            className="btn-close btn-close-white btn-sm"
                            aria-label="Remove"
                            style={{
                              fontSize: "0.7rem",
                              padding: 0,
                              marginLeft: "4px",
                            }}
                            onClick={() => {
                              setFormData((prev) => ({
                                ...prev,
                                service: prev.service.filter(
                                  (s) => s !== serviceName
                                ),
                              }));
                            }}
                          ></button>
                        </span>
                      );
                    })}
                </div>
              )}
              {/* TOTAL PRICE */}
              {formData.service.length > 0 && (
                <div className="mt-2">
                  <strong>Total Price:</strong> ₱
                  {formData.service.reduce((total, serviceName) => {
                    const service = services.find(
                      (s) => s.name === serviceName
                    );
                    return total + (service?.price || 0);
                  }, 0)}
                </div>
              )}
            </div>
          </div>
        </Form>
      </Modal.Body>

      <Modal.Footer>
        <button className="btn btn-secondary" onClick={onClose}>
          Cancel
        </button>
        <button className="btn btn-success" onClick={handleUpdate}>
          Save Changes
        </button>
      </Modal.Footer>
    </Modal>
  );
};

export default EditAppointment;
