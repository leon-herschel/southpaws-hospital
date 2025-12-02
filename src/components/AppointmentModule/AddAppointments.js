import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Button, Modal } from "react-bootstrap";
import { FaPlus } from "react-icons/fa";
import { toast } from "react-toastify";
import AddServicesModal from "../Add/AddServicesModal";
import AddUserModal from "../Add/AddUserModal";

const AddAppointments = ({ onClose, prefill, hideMultiPet }) => {
  const [formData, setFormData] = useState({
    service: [],
    date: "",
    time: "",
    firstName: "",
    lastName: "",
    name: "",
    contact: "",
    email: "",
    end_time: "",
    status: "Confirmed",
    reference_number: "",
    pet_name: "",
    pet_breed: "",
    pet_species: "",
    doctor_id: "",
  });

  const [repeatClient, setRepeatClient] = useState(false);
  const [multiPet, setMultiPet] = useState(false);
  const [services, setServices] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [showServiceDropdown, setShowServiceDropdown] = useState(false);
  const currentUserID = localStorage.getItem("userID");
  const currentUserEmail = localStorage.getItem("userEmail");
  const servicesInputRef = useRef(null);
  const [doctors, setDoctors] = useState([]);
  const dropdownRef = useRef(null);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [pendingFormData, setPendingFormData] = useState(null);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [toggleAddServicesModal, setToggleAddServicesModal] = useState(false);
  const [addNewDoctorModal, setAddNewDoctorModal] = useState(false);
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

  const [bookingLimits, setBookingLimits] = useState({
    start: "08:00",
    end: "17:00",
  });

  const fetchServices = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/services.php`);
      setServices(response.data);
    } catch (error) {
      console.error("Error fetching services:", error);
    }
  };

  const fetchDoctors = async () => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/get_doctors.php`
      );
      setDoctors(response.data);
    } catch (error) {
      console.error("Error fetching doctors:", error);
    }
  };
  // load doctors initially
  useEffect(() => {
    fetchDoctors();
  }, []);

  useEffect(() => {
    axios
      .get(`${API_BASE_URL}/api/Settings/get_time_appointments.php`)
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

  useEffect(() => {
    axios
      .get(`${API_BASE_URL}/api/get_services.php`)
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

    axios
      .get(`${API_BASE_URL}/api/get_doctors.php`)
      .then((res) => {
        setDoctors(res.data);
      })
      .catch((err) => {
        console.error("Failed to load doctors:", err);
      });
  }, []);

  useEffect(() => {
    const todayIso = () => new Date().toISOString().split("T")[0];

    const deriveTimeFromPreferred = (preferred) => {
      const start = bookingLimits.start || "08:00";
      const end = bookingLimits.end || "17:00";

      const startHour = Number(start.split(":")[0]);
      if (!preferred) return start;

      if (preferred.toLowerCase() === "morning") {
        return start;
      }

      if (preferred.toLowerCase() === "afternoon") {
        if (startHour < 13) {
          const endHour = Number(end.split(":")[0]);
          if (13 <= endHour) return "13:00";
          return start;
        } else {
          return start;
        }
      }

      return start;
    };

    if (!prefill) return;

    const parts = prefill.name ? prefill.name.trim().split(" ") : ["", ""];
    const firstName = parts[0] || "";
    const lastName = parts.slice(1).join(" ") || "";

    let computedDate = prefill.preferred_date || "";
    const today = todayIso();
    if (!computedDate || computedDate < today) {
      computedDate = today;
    }

    const computedTime = deriveTimeFromPreferred(prefill.preferred_time);

    setFormData((prev) => ({
      ...prev,
      date: prefill.date || computedDate || prev.date,
      time: prefill.time || computedTime || prev.time,
      name: prefill.name || prev.name,
      contact: prefill.contact || prev.contact,
      email: prefill.email || prev.email,
      pet_name: prefill.pet_name || prev.pet_name,
      pet_breed: prefill.pet_breed || prev.pet_breed,
      pet_species: prefill.pet_species || prev.pet_species,
      firstName,
      lastName,
    }));

    if (formData.doctor_id) {
      (async () => {
        try {
          const res = await axios.get(
            `${API_BASE_URL}/api/get-booked-slots.php?date=${computedDate}&doctor_id=${formData.doctor_id}`
          );
          setAvailableSlots(res.data.bookedRanges || []);
        } catch (err) {
          console.error("Failed fetching booked slots for prefill", err);
        }
      })();
    }
  }, [prefill, bookingLimits]);

  const generateReferenceNumber = () => {
    const letters = Array.from({ length: 3 }, () =>
      String.fromCharCode(65 + Math.floor(Math.random() * 26))
    ).join("");
    const numbers = Math.floor(1000 + Math.random() * 9000);
    return `${letters}-${numbers}`;
  };

  const isOverlapping = (start, end) => {
    const startTime = new Date(`1970-01-01T${start}`);
    const endTime = new Date(`1970-01-01T${end}`);

    return availableSlots.some((slot) => {
      const bookedStart = new Date(`1970-01-01T${slot.time}`);
      const bookedEnd = new Date(`1970-01-01T${slot.end_time}`);

      return startTime < bookedEnd && endTime > bookedStart;
    });
  };

  const formatTo12Hour = (timeStr) => {
    if (!timeStr) return "";
    const [hour, minute] = timeStr.split(":").map(Number);
    const suffix = hour >= 12 ? "PM" : "AM";
    const adjustedHour = hour % 12 || 12;
    return `${adjustedHour}:${minute.toString().padStart(2, "0")} ${suffix}`;
  };

  const handleChange = async (e, index = null) => {
    const { name, value } = e.target;

    if (name === "date") {
      setFormData((prevData) => ({
        ...prevData,
        date: value,
        time: "",
        end_time: "",
      }));

      try {
        const res = await axios.get(
          `${API_BASE_URL}/api/get-booked-slots.php?date=${value}&doctor_id=${formData.doctor_id}`
        );
        setAvailableSlots(res.data.bookedRanges || []);
      } catch (err) {
        console.error("Failed to fetch booked slots", err);
        toast.error("Error loading booked slots.");
        setAvailableSlots([]);
      }
      return;
    }

    if (name === "time" || name === "end_time") {
      const newFormData = {
        ...formData,
        [name]: value,
      };

      if (newFormData.time && newFormData.end_time) {
        const overlaps = isOverlapping(newFormData.time, newFormData.end_time);
        if (overlaps) {
          toast.error("This time slot overlaps with an existing booking.");
          setFormData((prev) => ({ ...prev, time: "", end_time: "" }));
          return;
        }
      }

      setFormData((prev) => ({ ...prev, [name]: value }));
      return;
    }

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    const { time, contact, end_time } = formData;

    if (!/^\d{11}$/.test(contact)) {
      toast.error("Contact number must be exactly 11 digits.");
      setIsLoading(false);
      return;
    }

    if (
      !/^[A-Za-z\s]+$/.test(formData.firstName) ||
      !/^[A-Za-z\s]+$/.test(formData.lastName)
    ) {
      toast.error("Name should only contain letters and spaces.");
      setIsLoading(false);
      return;
    }

    const start = new Date(`1970-01-01T${time}`);
    const end = new Date(`1970-01-01T${end_time}`);
    const latestAllowedStart = new Date(`1970-01-01T${bookingLimits.start}`);
    const latestAllowedEnd = new Date(`1970-01-01T${bookingLimits.end}`);

    if (start < latestAllowedStart) {
      toast.error(
        `Start time must not be earlier than ${formatTo12Hour(
          bookingLimits.start
        )}`
      );
      setIsLoading(false);
      return;
    }

    if (end <= start) {
      toast.error("End time must be later than the start time");
      setIsLoading(false);
      return;
    }

    if (end > latestAllowedEnd) {
      toast.error(
        `End time must not be later than ${formatTo12Hour(bookingLimits.end)}`
      );
      setIsLoading(false);
      return;
    }

    try {
      const res = await axios.get(
        `${API_BASE_URL}/api/get-booked-slots.php?date=${formData.date}&doctor_id=${formData.doctor_id}`
      );
      const currentSlots = res.data.bookedRanges || [];

      const overlaps = currentSlots.some((slot) => {
        const bookedStart = new Date(`1970-01-01T${slot.time}`);
        const bookedEnd = new Date(`1970-01-01T${slot.end_time}`);
        const newStart = new Date(`1970-01-01T${formData.time}`);
        const newEnd = new Date(`1970-01-01T${formData.end_time}`);
        return newStart < bookedEnd && newEnd > bookedStart;
      });

      if (overlaps) {
        toast.error("This time slot is already booked.");
        setIsLoading(false);
        return;
      }
    } catch (err) {
      console.error("Failed to recheck booked slots", err);
    }

    if (isOverlapping(formData.time, formData.end_time)) {
      toast.error("This time slot is already booked.");
      setIsLoading(false);
      return;
    }

    const finalEmail = formData.email?.trim() || "no_email@noemail.com";
    const shouldSendEmail = finalEmail && finalEmail !== "no_email@noemail.com";

    const formToSend = {
      ...formData,
      email: finalEmail,
      service: formData.service.filter((s) => s !== "").join(", "),
      reference_number: formData.reference_number,
      name: `${formData.firstName.trim()} ${formData.lastName.trim()}`,
      user_id: currentUserID,
      user_email: currentUserEmail,
      doctor_id: formData.doctor_id,
    };

    if (shouldSendEmail) {
      setPendingFormData(formToSend);
      setShowEmailModal(true);
      setIsLoading(false);
      return;
    }

    handleFinalSubmit(formToSend, false);
  };

  const handleFinalSubmit = async (formToSend, sendEmail) => {
    try {
      let emailStatus = null;

      if (sendEmail) {
        try {
          const emailRes = await axios.post(
            `${API_BASE_URL}/api/send_email.php`,
            formToSend
          );
          emailStatus = emailRes.data.success ? "success" : "fail";
        } catch (err) {
          console.error("Email error", err);
          emailStatus = "fail";
        }
      }

      const res = await axios.post(
        `${API_BASE_URL}/api/add_appointments.php`,
        formToSend
      );

      if (res.data.success) {
        if (sendEmail) {
          if (emailStatus === "success") {
            toast.success("Appointment submitted & confirmation email sent.");
          } else {
            toast.warn("Appointment submitted, but email could not be sent.");
          }
        } else {
          toast.success("Appointment submitted successfully!");
        }

        // Reset logic depending on whether "repeat client" is checked
        if (repeatClient) {
          // Keep client & appointment details — reset only pet + service fields
          setFormData((prev) => ({
            ...prev,
            pet_name: "",
            pet_breed: "",
            pet_species: "",
            service: [],
            reference_number: generateReferenceNumber(),
          }));

        } else {
          // Full reset
          setFormData({
            firstName: "",
            lastName: "",
            contact: "",
            email: "",
            pet_name: "",
            pet_breed: "",
            pet_species: "",
            service: [],
            doctor_id: "",
            date: "",
            time: "",
            end_time: "",
            reference_number: generateReferenceNumber(),
          });

          if (onClose) onClose();
        }

      } else {
        toast.error(res.data.error || "Something went wrong.");
      }
    } catch (error) {
      console.error("Submission Error:", error.response?.data || error.message);
      toast.error(
        error.response?.data?.error ||
          "Failed to submit. Please check your server."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const addMinutesToTime = (timeStr, minutes) => {
    const [hours, mins] = timeStr.split(":").map(Number);
    const date = new Date(1970, 0, 1, hours, mins);
    date.setMinutes(date.getMinutes() + minutes);
    return date.toTimeString().slice(0, 5);
  };

  const getTotalDuration = () => {
    return formData.service.reduce((total, serviceName) => {
      const service = services.find((s) => s.name === serviceName);
      if (!service?.duration) return total;

      const [h, m, s] = service.duration.split(":").map(Number);
      return total + h * 60 + m + Math.floor(s / 60);
    }, 0);
  };

  useEffect(() => {
    if (formData.time && formData.service.length > 0) {
      const totalMins = getTotalDuration();
      const suggestedEnd = addMinutesToTime(formData.time, totalMins);
      setFormData((prev) => ({ ...prev, end_time: suggestedEnd }));
    }
  }, [formData.time, formData.service]);

  return (
    <>
      <div>
        <form onSubmit={handleSubmit}>
          <h5>Client Details</h5>
          <div className="card mb-2 mt-2">
            <div className="card-body">
              <div className="row">
                <div className="col-md-6">
                  <div className="mb-3">
                    <label htmlFor="firstName">
                      First Name: <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      id="firstName"
                      name="firstName"
                      className="form-control"
                      value={formData.firstName}
                      onChange={handleChange}
                      autoComplete="on"
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label htmlFor="lastName">
                      Last Name: <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      id="lastName"
                      name="lastName"
                      className="form-control"
                      value={formData.lastName}
                      onChange={handleChange}
                      autoComplete="family-name"
                      required
                    />
                  </div>
                </div>

                <div className="col-md-6">
                  <div className="mb-3">
                    <label htmlFor="contact">
                      Contact Number: <span className="text-danger">*</span>
                    </label>
                    <input
                      type="number"
                      id="contact"
                      name="contact"
                      className="form-control"
                      value={formData.contact}
                      onChange={handleChange}
                      autoComplete="off"
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label htmlFor="email">Email:</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      className="form-control"
                      value={formData.email}
                      onChange={handleChange}
                      autoComplete="off"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <h5 className="mt-3">Patient Details</h5>
          <div className="card mb-2 mt-2">
            <div className="card-body">
              <div className="row">
                <div className="col-md-6">
                  <div className="mb-3">
                    <label htmlFor="pet_name">
                      Pet Name: <span className="text-danger">*</span>
                    </label>
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
                    <label htmlFor="pet_breed">
                      Breed: <span className="text-danger">*</span>
                    </label>
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
                    <label htmlFor="pet_species">
                      Species: <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      id="pet_species"
                      name="pet_species"
                      className="form-control"
                      list="speciesOptions"
                      value={formData.pet_species}
                      onChange={handleChange}
                      required
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          servicesInputRef.current?.focus();
                          setShowServiceDropdown(true);
                        }
                      }}
                    />

                    <datalist id="speciesOptions">
                      <option value="Canine" />
                      <option value="Feline" />
                    </datalist>
                  </div>
                </div>

                <hr className="mt-3" />

                <div className="d-flex align-items-center mb-2">
                  <label htmlFor="floatingServices" className="mb-0">
                    Services: <span className="text-danger">*</span>
                  </label>
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    className="ms-2"
                    onClick={() => setToggleAddServicesModal(true)}
                  >
                    <FaPlus />
                  </Button>
                </div>

                {/* Add Service Modal */}
                <AddServicesModal
                  show={toggleAddServicesModal}
                  handleClose={() => setToggleAddServicesModal(false)}
                  onServicesAdded={fetchServices}
                  navigateOnSuccess={false}
                />

                <div className="mb-3 position-relative" ref={dropdownRef}>
                  {/* INPUT that opens the dropdown */}
                  <input
                    type="text"
                    className="form-control"
                    id="floatingServices"
                    ref={servicesInputRef}
                    onClick={() => setShowServiceDropdown(!showServiceDropdown)}
                    placeholder="Click to select services"
                    value=""
                    autoComplete="off"
                  />
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
          </div>

          <h5 className="mt-3">Appointment Details</h5>
          <div className="card mb-2 mt-2">
            <div className="card-body">
              <div className="row">
                <div className="col-12">
                  <div className="mb-3">
                    <label htmlFor="doctor_id">
                      Assigned Doctor: <span className="text-danger">*</span>
                    </label>

                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      className="ms-2"
                      onClick={() => setAddNewDoctorModal(true)}
                    >
                      <FaPlus />
                    </Button>

                    {/* Show Add Doctor Modal */}
                    <AddUserModal
                      show={addNewDoctorModal}
                      handleClose={() => setAddNewDoctorModal(false)}
                      onUsersAdded={fetchDoctors}
                    />

                    <select
                      id="doctor_id"
                      name="doctor_id"
                      className="form-control"
                      value={formData.doctor_id}
                      onChange={handleChange}
                      required
                    >
                      <option value="">-- Select Doctor --</option>
                      {doctors.map((doc) => (
                        <option key={doc.id} value={doc.id}>
                          Dr. {doc.first_name} {doc.last_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mb-3">
                    <label htmlFor="date">
                      Date: <span className="text-danger">*</span>
                    </label>
                    <input
                      type="date"
                      id="date"
                      name="date"
                      className="form-control"
                      value={formData.date}
                      onChange={handleChange}
                      autoComplete="off"
                      required
                      min={new Date().toISOString().split("T")[0]}
                      disabled={!formData.doctor_id}
                    />
                  </div>

                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label htmlFor="time">
                        From: <span className="text-danger">*</span>
                      </label>
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
                      <label htmlFor="end_time">
                        To: <span className="text-danger">*</span>
                      </label>
                      <input
                        type="time"
                        id="end_time"
                        name="end_time"
                        className="form-control"
                        value={formData.end_time}
                        onChange={handleChange}
                        autoComplete="off"
                        required
                        disabled={!formData.date || !formData.doctor_id}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <input
            type="hidden"
            name="reference_number"
            value={formData.reference_number}
          />

          {!hideMultiPet && (
            <div className="form-check mb-2">
              <input
                type="checkbox"
                className="form-check-input"
                id="multiPet"
                checked={multiPet}
                onChange={() => {
                  setMultiPet(!multiPet);
                  setRepeatClient(!multiPet);
                }}
              />
              <label className="form-check-label" htmlFor="multiPet">
                Add another appointment for this client
              </label>
            </div>
          )}

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

      {/* EMAIL CONFIRMATION MODAL */}
      <Modal
        show={showEmailModal}
        onHide={() => setShowEmailModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Send Confirmation Email</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          An email was found for this client. Do you want to send a confirmation
          email?
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            disabled={isSendingEmail}
            onClick={() => {
              setRepeatClient(multiPet);
              setShowEmailModal(false);
              handleFinalSubmit(pendingFormData, false); // save without email
            }}
          >
            No
          </Button>
          <Button
            variant="primary"
            disabled={isSendingEmail}
            onClick={async () => {
              setRepeatClient(multiPet);
              setIsSendingEmail(true);
              await handleFinalSubmit(pendingFormData, true);
              setIsSendingEmail(false);
              setShowEmailModal(false);
            }}
          >
            {isSendingEmail ? "Sending..." : "Yes, Send Email"}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default AddAppointments;
