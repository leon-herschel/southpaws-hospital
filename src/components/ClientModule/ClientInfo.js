import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Button } from "react-bootstrap";
import { toast } from "react-toastify";

function AddAppointments() {
  const [formData, setFormData] = useState({
    service: [""],
    date: "",
    time: "",
    firstName: "",
    lastName: "",
    name: "",
    contact: "",
    email: "",
    end_time: "",
    status: "Pending",
    reference_number: "",
    pet_name: "",
    pet_breed: "",
    pet_species: "",
  });

  const [services, setServices] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [availableSlots, setAvailableSlots] = useState([]);
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
          `http://localhost/api/get-booked-slots.php?date=${value}`
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

    const { time, name, contact, end_time } = formData;

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
    const latestAllowedStart = new Date(`1970-01-01T08:00`);
    const latestAllowedEnd = new Date(`1970-01-01T17:00`);

    if (start < latestAllowedStart) {
      toast.error("Start time must not be earlier than 8AM");
      setIsLoading(false);
      return;
    }

    if (end <= start) {
      toast.error("End time must be later than the start time");
      setIsLoading(false);
      return;
    }

    if (end > latestAllowedEnd) {
      toast.error("End time must not be later than 5PM");
      setIsLoading(false);
      return;
    }

    if (isOverlapping(formData.time, formData.end_time)) {
      toast.error("This time slot is already booked.");
      setIsLoading(false);
      return;
    }

    const finalEmail = formData.email?.trim() || "no_email@noemail.com";

    const formToSend = {
      ...formData,
      email: finalEmail,
      service: formData.service.filter((s) => s !== "").join(", "),
      reference_number: formData.reference_number,
      name: `${formData.firstName.trim()} ${formData.lastName.trim()}`,
    };

    try {
      const res = await axios.post(
        "http://localhost/api/ClientSide/booking_appointment.php",
        formToSend
      );

      if (res.data.success) {
        toast.success("Appointment submitted successfully!");
        setFormData({
          service: [""],
          date: "",
          time: "",
          firstName: "",
          lastName: "",
          name: "",
          contact: "",
          email: "",
          end_time: "",
          status: "Pending",
          reference_number: generateReferenceNumber(),
          pet_name: "",
          pet_breed: "",
          pet_species: "",
        });
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

  return (
      <div>
        <form onSubmit={handleSubmit}>
          <h5>Personal Details</h5>
            <div className="card mb-2 mt-2">
              <div className="card-body">
                <div className="row">
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label htmlFor="firstName">First Name:</label>
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
                      <label htmlFor="lastName">Last Name:</label>
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
                      />
                    </div>
  
                    <div className="mb-3">
                      <label htmlFor="email">Email (optional):</label>
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
  
                <hr className="mt-3" />
  
                <label htmlFor="floatingServices">Services:</label>
                <div
                  className="mb-3 position-relative"
                  ref={dropdownRef}
                >
                  {/* INPUT that opens the dropdown */}
                  <input
                    type="text"
                    className="form-control"
                    id="floatingServices"
                    onClick={() => setShowServiceDropdown(!showServiceDropdown)}
                    readOnly
                    placeholder="Click to select services"
                    value=""
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
                      min={new Date().toISOString().split("T")[0]}
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
                        disabled={!formData.date}
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
                        autoComplete="off"
                        required
                        disabled={!formData.date}
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
  
          {/* SUBMIT BUTTON */}
          <div className="button-container">
            <Button
              variant="primary"
              type="submit"
              className="button btn-gradient"
              disabled={isLoading}
            >
              {isLoading ? "Booking..." : "Book"}
            </Button>
          </div>
        </form>
      </div>
    );
}

export default AddAppointments;
