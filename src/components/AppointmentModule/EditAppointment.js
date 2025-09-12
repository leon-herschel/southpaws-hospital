import React, { useState, useEffect, useRef } from "react";
import { Modal, Form } from "react-bootstrap";
import axios from "axios";
import { toast } from "react-toastify";

const EditAppointment = ({ show, onClose, eventData, onUpdated }) => {
  const [services, setServices] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const currentUserID = localStorage.getItem("userID");
  const currentUserEmail = localStorage.getItem("userEmail");
  const [doctors, setDoctors] = useState([]);
  const [showServiceDropdown, setShowServiceDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const [showDoneConfirm, setShowDoneConfirm] = useState(false);
  const [originalEmail, setOriginalEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingLimits, setBookingLimits] = useState({
    start: "08:00",
    end: "17:00",
  });

  useEffect(() => {
    axios
      .get("http://localhost/api/Settings/get_time_appointments.php")
      .then((res) => {
        if (
          res.data.status === "success" &&
          res.data.start_time &&
          res.data.end_time
        ) {
          setBookingLimits({
            start: res.data.start_time.slice(0, 5),
            end: res.data.end_time.slice(0, 5),
          });
        }
      })
      .catch((err) => console.error("Failed to fetch booking limits", err));
  }, []);

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
    first_name: "",
    last_name: "",
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
    doctor_id: "",
  });

  useEffect(() => {
    axios
      .get("http://localhost/api/get_services.php")
      .then((res) =>
        setServices(
          res.data.map((s) => ({
            ...s,
            name: s.name.trim(), // clean trailing/leading spaces
          }))
        )
      )
      .catch((err) => {
        console.error("Failed to load services:", err);
        toast.error("Failed to load available services.");
      });

    axios
      .get("http://localhost/api/get_doctors.php")
      .then((res) => setDoctors(res.data))
      .catch((err) => {
        console.error("Failed to load doctors:", err);
        toast.error("Failed to load doctors list.");
      });
  }, []);

  useEffect(() => {
    if (
      eventData &&
      eventData.start &&
      eventData.end &&
      !isNaN(new Date(eventData.start)) &&
      !isNaN(new Date(eventData.end))
    ) {
      const start = new Date(eventData.start);
      const end = new Date(eventData.end);

      const nameParts = (eventData.name || "").trim().split(/\s+/);
      const last_name = nameParts.length > 1 ? nameParts.pop() : "";
      const first_name = nameParts.join(" ");

      setFormData({
        id: eventData.id,
        first_name,
        last_name,
        contact: eventData.contact || "",
        email: eventData.email || "",
        service: eventData.service
          ? eventData.service
              .split(/\s*,\s*/)
              .map((s) => s.trim()) // ensure no trailing/leading spaces
              .filter(Boolean)
          : [""],
        date: start.toISOString().split("T")[0],
        time: start.toTimeString().substring(0, 5),
        end_time: end.toTimeString().substring(0, 5),
        status: eventData.status || "",
        pet_name: eventData.pet_name || "",
        pet_species: eventData.pet_species || "",
        pet_breed: eventData.pet_breed || "",
        doctor_id: eventData.doctor_id || "",
        reference_number: eventData.reference_number || "",
      });
      setOriginalEmail(eventData.email || "");
    } else {
      console.warn("Invalid start or end time:", eventData);
    }
  }, [eventData]);

  useEffect(() => {
    if (formData.date && formData.doctor_id) {
      axios
        .get(
          `http://localhost/api/get-booked-slots.php?date=${formData.date}&doctor_id=${formData.doctor_id}`
        )
        .then((res) => {
          setAvailableSlots(res.data.bookedRanges || []);
        })
        .catch((err) => {
          console.error("Failed to fetch booked slots", err);
          toast.error("Error loading booked slots.");
          setAvailableSlots([]);
        });
    }
  }, [formData.date, formData.doctor_id]);

  const formatTo12Hour = (timeStr) => {
    if (!timeStr) return "";
    const [hour, minute] = timeStr.split(":").map(Number);
    const suffix = hour >= 12 ? "PM" : "AM";
    const adjustedHour = hour % 12 || 12;
    return `${adjustedHour}:${minute.toString().padStart(2, "0")} ${suffix}`;
  };

  const handleChange = (e, index = null) => {
    const { name, value } = e.target;

    if (name === "status" && value === "Done") {
      setShowDoneConfirm(true);
      return;
    }

    if (name === "service" && index !== null) {
      const updatedServices = [...formData.service];
      updatedServices[index] = value;
      setFormData((prev) => ({ ...prev, service: updatedServices }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleUpdate = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    const { first_name, last_name, contact, time, end_time, email } = formData;
    const name = `${first_name} ${last_name}`.trim();

    // Contact validation
    if (!/^\d{11}$/.test(contact)) {
      toast.error("Contact number must be exactly 11 digits.");
      setIsSubmitting(false);
      return;
    }

    // Name validation
    if (!/^[A-Za-z\s]+$/.test(name)) {
      toast.error("Name should only contain letters and spaces.");
      setIsSubmitting(false);
      return;
    }

    // Time range validation
    const start = new Date(`1970-01-01T${time}`);
    const end = new Date(`1970-01-01T${end_time}`);
    const latestAllowedStart = new Date(`1970-01-01T${bookingLimits.start}`);
    const latestAllowedEnd = new Date(`1970-01-01T${bookingLimits.end}`);

    if (start < latestAllowedStart) {
      toast.error(
        `Start time must not be earlier than ${formatTo12Hour(bookingLimits.start)}`
      );
      setIsSubmitting(false);
      return;
    }

    if (end <= start) {
      toast.error("End time must be later than the start time");
      setIsSubmitting(false);
      return;
    }

    if (end > latestAllowedEnd) {
      toast.error(
        `End time must not be later than ${formatTo12Hour(bookingLimits.end)}`
      );
      setIsSubmitting(false);
      return;
    }

    if (isOverlapping(formData.time, formData.end_time)) {
      toast.error("This time slot overlaps with another appointment.");
      setIsSubmitting(false);
      return;
    }

    if (!formData.doctor_id) {
      toast.error("Please assign a doctor to this appointment.");
      setIsSubmitting(false);
      return;
    }

    const trimmedEmail = email?.trim() || "";
    const hasValidEmail = trimmedEmail && /\S+@\S+\.\S+/.test(trimmedEmail);

    if (trimmedEmail && !hasValidEmail) {
      toast.error("Please enter a valid email address.");
      return;
    }

    const updatedData = {
      ...formData,
      email: trimmedEmail || "no_email@noemail.com",
      name,
      doctor_id: formData.doctor_id,
      service: [
        ...new Set(formData.service.map((s) => s.trim()).filter(Boolean)),
      ].join(", "),
      user_id: currentUserID,
      user_email: currentUserEmail,
    };

    delete updatedData.first_name;
    delete updatedData.last_name;

    const hasNewEmail =
      hasValidEmail &&
      trimmedEmail.toLowerCase() !== originalEmail.toLowerCase();

    const updateAppointment = async (sendEmail = false) => {
      try {
        if (sendEmail) {
          try {
            const emailRes = await axios.post(
              "http://localhost/api/send_email.php",
              updatedData
            );
            if (emailRes.data.success) {
              toast.success("Confirmation email sent.");
            } else {
              toast.warn("Appointment updated, but email failed to send.");
            }
          } catch (err) {
            console.error("Email error", err);
            toast.warn("Appointment updated, but email failed to send.");
          }
        }

        await axios.put("http://localhost/api/appointments.php", updatedData);
        toast.success("Appointment updated successfully!");
        onUpdated();
        onClose();
      } catch (err) {
        console.error("Update failed", err);
        toast.error("Failed to update appointment.");
      } finally {
        setIsSubmitting(false);
      }
    };

    if (hasNewEmail) {
      toast.info(
        <div>
          <p>New email detected. Send confirmation email?</p>
          <div className="flex gap-2 mt-2">
            <button
              onClick={() => {
                toast.dismiss();
                updateAppointment(true);
              }}
              className="px-3 py-1 bg-green-600 text-green rounded"
            >
              Yes
            </button>
            <button
              onClick={() => {
                toast.dismiss();
                updateAppointment(false);
              }}
              className="px-3 py-1 bg-gray-600 text-red rounded"
            >
              No
            </button>
          </div>
        </div>,
        { autoClose: false }
      );
    } else {
      await updateAppointment(false);
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

  const addMinutesToTime = (timeStr, minutes) => {
    const [hours, mins] = timeStr.split(":").map(Number);
    const date = new Date(1970, 0, 1, hours, mins);
    date.setMinutes(date.getMinutes() + minutes);
    return date.toTimeString().slice(0, 5);
  };

  const getTotalDuration = (services, selected) => {
    return selected.reduce((total, serviceName) => {
      const service = services.find((s) => s.name.trim() === serviceName);
      if (!service?.duration) return total;
      const [h, m, s] = service.duration.split(":").map(Number);
      return total + h * 60 + m + Math.floor(s / 60);
    }, 0);
  };

  useEffect(() => {
    if (formData.time && formData.service.length > 0) {
      const totalMins = getTotalDuration(services, formData.service);
      if (totalMins > 0) {
        const suggestedEnd = addMinutesToTime(formData.time, totalMins);
        setFormData((prev) => ({ ...prev, end_time: suggestedEnd }));
      }
    }
  }, [formData.time, formData.service, services]);

  return (
    <Modal show={show} onHide={onClose} backdrop="static">
      <Modal.Header closeButton>
        <Modal.Title>Edit Appointment</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          {/* Client Details */}
          <h5>Client Details</h5>
          <div className="card mb-2 mt-2">
            <div className="card-body">
              <div className="row">
                <div className="col-md-6">
                  <Form.Group className="mb-3">
                    <Form.Label>First Name:</Form.Label>
                    <Form.Control
                      type="text"
                      name="first_name"
                      value={formData.first_name || ""}
                      onChange={handleChange}
                      required
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Last Name:</Form.Label>
                    <Form.Control
                      type="text"
                      name="last_name"
                      value={formData.last_name || ""}
                      onChange={handleChange}
                      required
                    />
                  </Form.Group>
                </div>

                <div className="col-md-6">
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

                  <Form.Group className="mb-3">
                    <Form.Label>Contact Number:</Form.Label>
                    <Form.Control
                      type="text"
                      name="contact"
                      value={formData.contact}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, "");
                        setFormData((prev) => ({ ...prev, contact: value }));
                      }}
                      required
                    />
                  </Form.Group>
                </div>
              </div>
            </div>
          </div>

          {/* Patient Details */}
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

              {/* Services Dropdown */}
              <hr className="mt-3" />
              <div className="mb-3 position-relative" ref={dropdownRef}>
                <label htmlFor="floatingServices">Services:</label>
                <input
                  type="text"
                  className="form-control"
                  id="floatingServices"
                  onClick={() => setShowServiceDropdown(!showServiceDropdown)}
                  readOnly
                  placeholder="Click to select services"
                  value=""
                />

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
                          checked={formData.service.includes(
                            service.name.trim()
                          )}
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

                {/* BADGES */}
                {formData.service.length > 0 && (
                  <div className="mt-2 d-flex flex-wrap gap-2">
                    {formData.service
                      .filter((serviceName) =>
                        services.some((s) => s.name.trim() === serviceName)
                      )
                      .map((serviceName) => {
                        const service = services.find(
                          (s) => s.name.trim() === serviceName
                        );
                        return (
                          <span
                            key={serviceName}
                            className="badge d-flex align-items-center"
                            style={{
                              gap: "6px",
                              backgroundColor: "#2a7447ff",
                              fontSize: "0.9rem",
                              padding: "8px 12px",
                              borderRadius: "12px",
                              color: "#fff",
                            }}
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
          </div>

          {/* Appointment Date & Time */}
          <h5 className="mt-3">Appointment Details</h5>
          <div className="card mb-2 mt-2">
            <div className="card-body">
              <div className="row">
                <div className="col-12">
                  <Form.Group className="mb-3">
                    <Form.Label>Assigned Doctor:</Form.Label>
                    <select
                      name="doctor_id"
                      className="form-control"
                      value={formData.doctor_id}
                      onChange={handleChange}
                    >
                      <option value="">-- Select Doctor --</option>
                      {doctors.map((doc) => (
                        <option key={doc.id} value={doc.id}>
                          Dr. {doc.first_name} {doc.last_name}
                        </option>
                      ))}
                    </select>
                  </Form.Group>
                  <div className="mb-3">
                    <label htmlFor="date">Date:</label>
                    <input
                      type="date"
                      id="date"
                      name="date"
                      className="form-control"
                      value={formData.date}
                      onChange={handleChange}
                      required
                      min={new Date().toISOString().split("T")[0]}
                      disabled={!formData.doctor_id}
                    />
                  </div>

                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label htmlFor="time">From:</label>
                      <input
                        type="time"
                        id="time"
                        name="time"
                        className="form-control"
                        value={formData.time}
                        onChange={handleChange}
                        required
                        disabled={!formData.date || !formData.doctor_id}
                      />
                    </div>

                    <div className="col-md-6 mb-3">
                      <label htmlFor="end_time">To:</label>
                      <input
                        type="time"
                        id="end_time"
                        name="end_time"
                        className="form-control"
                        value={formData.end_time}
                        onChange={handleChange}
                        required
                        disabled={!formData.date || !formData.doctor_id}
                      />
                    </div>

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
                        <option value="Cancelled">Cancelled</option>
                        <option value="Done">Done</option>
                      </select>
                    </Form.Group>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Form>
      </Modal.Body>

      <Modal
        show={showDoneConfirm}
        onHide={() => setShowDoneConfirm(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Confirm Status Change</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Setting this appointment to <strong>Done</strong> cannot be reversed.
          Are you sure you want to proceed?
        </Modal.Body>
        <Modal.Footer>
          <button
            className="btn btn-secondary"
            onClick={() => setShowDoneConfirm(false)}
          >
            Cancel
          </button>
          <button
            className="btn btn-danger"
            onClick={() => {
              setFormData((prev) => ({ ...prev, status: "Done" }));
              setShowDoneConfirm(false);
            }}
          >
            Yes, set to Done
          </button>
        </Modal.Footer>
      </Modal>

      <Modal.Footer>
        <button className="btn btn-secondary" onClick={onClose}>
          Cancel
        </button>
        <button
          className="btn btn-success"
          onClick={handleUpdate}
          disabled={isSubmitting}
        >
          {isSubmitting ? "Saving" : " Save Changes"}
        </button>
      </Modal.Footer>
    </Modal>
  );
};

export default EditAppointment;
