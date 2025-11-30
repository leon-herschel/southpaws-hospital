import React, { useState } from "react";
import axios from "axios";
import { Button, Popover } from "react-bootstrap";
import { toast } from "react-toastify";
import { format } from "date-fns";
import {
  FaPaw,
  FaUser,
  FaCalendarAlt,
  FaStethoscope,
  FaClipboardCheck,
  FaClock,
  FaCheckCircle,
  FaPhone,
  FaCalendarCheck,
  FaCheck,
} from "react-icons/fa";
import { useEffect } from "react";
import { Modal } from "react-bootstrap";

function AddAppointments() {
  const [formData, setFormData] = useState({
    reason_for_visit: "",
    preferred_date: "",
    preferred_time: "",
    firstName: "",
    lastName: "",
    name: "",
    contact: "",
    email: "",
    status: "Pending",
    notes: "",
    pets: [{ pet_name: "", pet_breed: "", pet_species: "" }],
  });
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 5;

  const nextStep = () =>
    setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 1));
  const [services, setServices] = useState([]);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const handleCloseModal = () => setShowSuccessModal(false);

  useEffect(() => {
    axios
      .get(`${API_BASE_URL}/api/services.php?archived=0`)
      .then((res) => {
        if (Array.isArray(res.data)) {
          setServices(res.data);
        }
      })
      .catch((err) => console.error("Error fetching services:", err));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "preferred_date") {
      const selectedDate = new Date(value);
      const day = selectedDate.getDay();

      if (day === 0 || day === 6) {
        toast.warning("Weekends are not allowed. Please select a weekday.");
        return;
      }
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePetChange = (index, e) => {
    const { name, value } = e.target;
    const updatedPets = [...formData.pets];
    updatedPets[index][name] = value;
    setFormData((prev) => ({ ...prev, pets: updatedPets }));
  };

  const addPet = () => {
    if (formData.pets.length < 4) {
      setFormData((prev) => ({
        ...prev,
        pets: [...prev.pets, { pet_name: "", pet_breed: "", pet_species: "" }],
      }));
    } else {
      toast.warning("Maximum 4 pets allowed per appointment.");
    }
  };

  const removePet = (index) => {
    const updatedPets = formData.pets.filter((_, i) => i !== index);
    setFormData((prev) => ({ ...prev, pets: updatedPets }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    // Basic validations
    if (!/^\d{11}$/.test(formData.contact)) {
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

    if (formData.email.trim() !== "") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        toast.error("Please enter a valid email address.");
        setIsLoading(false);
        return;
      }
    }

    const finalEmail = formData.email?.trim() || "no_email@noemail.com";

    const formToSend = {
      reason_for_visit: formData.reason_for_visit,
      preferred_date: formData.preferred_date,
      preferred_time: formData.preferred_time,
      name: `${formData.firstName.trim()} ${formData.lastName.trim()}`,
      contact: formData.contact,
      email: finalEmail,
      status: formData.status,
      notes: formData.notes,
      pets: formData.pets,
    };

    try {
      const res = await axios.post(
        `${API_BASE_URL}/api/ClientSide/booking_appointment.php`,
        formToSend
      );

      if (res.data.success) {
        setShowSuccessModal(true);
        setFormData({
          reason_for_visit: "",
          preferred_date: "",
          preferred_time: "",
          firstName: "",
          lastName: "",
          name: "",
          contact: "",
          email: "",
          status: "Pending",
          pet_name: "",
          pet_breed: "",
          pet_species: "",
        });
        setCurrentStep(1);
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

  const isStepValid = () => {
    switch (currentStep) {
      case 1: // Step 1: Personal Details
        return (
          formData.firstName.trim() !== "" &&
          formData.lastName.trim() !== "" &&
          /^\d{11}$/.test(formData.contact) &&
          /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())
        );
      case 2: // Step 2: Patient Details
        return formData.pets.every(
          (pet) =>
            pet.pet_name.trim() !== "" &&
            pet.pet_breed.trim() !== "" &&
            pet.pet_species.trim() !== ""
        );
      case 3: // Step 3: Reason for Visit
        return formData.reason_for_visit.trim() !== "";
      case 4: // Step 4: Appointment Preferences
        return (
          formData.preferred_date.trim() !== "" &&
          formData.preferred_time.trim() !== ""
        );
      case 5:
        return true;
      default:
        return false;
    }
  };

  const servicesPopover = (
    <Popover id="services-popover">
      <Popover.Header as="h3">Available Services</Popover.Header>
      <Popover.Body>
        {services.length > 0 ? (
          <div style={{ maxHeight: "200px", overflowY: "auto" }}>
            <ul
              className="mb-0 ps-3 text-start"
              style={{ listStyleType: "disc" }}
            >
              {services.map((s, i) => (
                <li key={i}>{s.name}</li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="mb-0">No services available</p>
        )}
      </Popover.Body>
    </Popover>
  );

  const stepIcons = [
    FaUser,
    FaPaw,
    FaStethoscope,
    FaCalendarAlt,
    FaClipboardCheck,
  ];
  const stepTitles = [
    "Personal Details",
    "Patient Details",
    "Reason for Visit",
    "Preferred Schedule",
    "Review & Submit",
  ];

  return (
    <div className="appointment-form-container">
      {/* Progress Bar */}
      <div className="progress-container mb-4">
        <div className="d-flex justify-content-between position-relative">
          {stepIcons.map((Icon, index) => (
            <div key={index} className="step-indicator text-center">
              <div
                className={`step-circle ${
                  currentStep > index + 1 ? "completed" : ""
                } ${currentStep === index + 1 ? "active" : ""}`}
              >
                <Icon size={18} className="step-icon" />
              </div>
              <small className="step-label d-none d-md-block">
                {stepTitles[index]}
              </small>
            </div>
          ))}
          <div className="progress-bar-background">
            <div
              className="progress-bar-fill"
              style={{
                width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%`,
              }}
            ></div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {/* STEP 1 - Personal Details */}
        {currentStep === 1 && (
          <div className="step-content">
            <div className="card border-0 shadow-sm">
              <div className="card-body p-4">
                <div className="row g-3">
                  <div className="col-md-6">
                    <div className="form-floating">
                      <input
                        type="text"
                        id="firstName"
                        name="firstName"
                        className="form-control"
                        value={formData.firstName}
                        onChange={handleChange}
                        autoComplete="on"
                        placeholder="First Name"
                        required
                      />
                      <label htmlFor="firstName" className="text-muted">
                        First Name <span className="text-danger">*</span>
                      </label>
                    </div>
                  </div>

                  <div className="col-md-6">
                    <div className="form-floating">
                      <input
                        type="text"
                        id="lastName"
                        name="lastName"
                        className="form-control"
                        value={formData.lastName}
                        onChange={handleChange}
                        autoComplete="family-name"
                        placeholder="Last Name"
                        required
                      />
                      <label htmlFor="lastName" className="text-muted">
                        Last Name <span className="text-danger">*</span>
                      </label>
                    </div>
                  </div>

                  <div className="col-md-6">
                    <div className="form-floating">
                      <input
                        type="tel"
                        id="contact"
                        name="contact"
                        className="form-control"
                        value={formData.contact}
                        onChange={handleChange}
                        placeholder="Contact Number"
                        required
                      />
                      <label htmlFor="contact" className="text-muted">
                        Contact Number <span className="text-danger">*</span>
                      </label>
                    </div>
                    {formData.contact && !/^\d{11}$/.test(formData.contact) && (
                      <small className="text-danger">
                        Contact number must be 11 digits.
                      </small>
                    )}
                  </div>

                  <div className="col-md-6">
                    <div className="form-floating">
                      <input
                        type="email"
                        id="email"
                        name="email"
                        className="form-control"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="Email Address"
                        required
                      />
                      <label htmlFor="email" className="text-muted">
                        Email Address <span className="text-danger">*</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2 - Patient Details */}
        {currentStep === 2 && (
          <div className="step-content">
            <div className="card border-0 shadow-sm">
              <div className="card-body p-4">
                {formData.pets.length > 1 && (
                  <p className="text-muted mb-3">
                    <strong>Note:</strong> All pets in this appointment must
                    receive the same service. If each pet need different
                    services, please create separate appointments.
                  </p>
                )}
                {formData.pets.map((pet, index) => (
                  <div key={index} className="mb-4 border p-3 rounded">
                    {formData.pets.length > 1 && (
                      <h6 className="mb-3">Pet {index + 1}</h6>
                    )}
                    <div className="row g-3">
                      <div className="col-md-4">
                        <div className="form-floating">
                          <input
                            type="text"
                            name="pet_name"
                            className="form-control"
                            value={pet.pet_name}
                            onChange={(e) => handlePetChange(index, e)}
                            placeholder="Pet Name"
                            required
                          />
                          <label>
                            Pet Name <span className="text-danger">*</span>
                          </label>
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="form-floating">
                          <input
                            type="text"
                            name="pet_breed"
                            className="form-control"
                            list="breedOptions"
                            value={pet.pet_breed}
                            onChange={(e) => handlePetChange(index, e)}
                            placeholder="Breed"
                            required
                          />
                          <label>
                            Breed <span className="text-danger">*</span>
                          </label>
                          <datalist id="breedOptions">
                            <option value="Siberian Husky" />
                            <option value="Golden Retriever" />
                            <option value="German Shepherd" />
                            <option value="Chow Chow" />
                            <option value="Shih Tzu" />
                          </datalist>
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="form-floating">
                          <input
                            type="text"
                            name="pet_species"
                            className="form-control"
                            list="speciesOptions"
                            value={pet.pet_species}
                            onChange={(e) => handlePetChange(index, e)}
                            placeholder="Species"
                            required
                          />
                          <label>
                            Species <span className="text-danger">*</span>
                          </label>
                          <datalist id="speciesOptions">
                            <option value="Canine" />
                            <option value="Feline" />
                          </datalist>
                        </div>
                      </div>
                    </div>
                    <div className="mt-2 text-end">
                      {formData.pets.length > 1 && (
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => removePet(index)}
                        >
                          Remove Pet
                        </Button>
                      )}
                    </div>
                  </div>
                ))}

                {formData.pets.length < 4 && (
                  <Button variant="primary" onClick={addPet}>
                    + Add Another Pet
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* STEP 3 - Reason for Visit */}
        {currentStep === 3 && (
          <div className="step-content">
            <div className="card border-0 shadow-sm">
              <div className="card-body p-4">
                <label className="text-muted mb-2">
                  Reason for Visit <span className="text-danger">*</span>
                </label>

                {/* Services Checkboxes */}
                <div className="mb-3 d-flex flex-wrap gap-2">
                  {[
                    "Consultation",
                    "Vaccination",
                    "Deworming",
                    "Tick & Flea",
                    "Lab Test",
                  ].map((service) => (
                    <div key={service} className="form-check form-check-inline">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id={service}
                        value={service}
                        checked={formData.reason_for_visit.includes(service)}
                        onChange={(e) => {
                          const selected = e.target.value;
                          let updatedText = formData.reason_for_visit
                            .split(", ")
                            .filter(Boolean);

                          if (e.target.checked) {
                            updatedText.push(selected);
                          } else {
                            updatedText = updatedText.filter(
                              (s) => s !== selected
                            );
                          }

                          setFormData((prev) => ({
                            ...prev,
                            reason_for_visit: updatedText.join(", "),
                          }));
                        }}
                      />
                      <label className="form-check-label" htmlFor={service}>
                        {service}
                      </label>
                    </div>
                  ))}
                </div>

                {/* Textarea */}
                <textarea
                  id="reason_for_visit"
                  name="reason_for_visit"
                  className="form-control"
                  style={{ height: "120px", borderRadius: "0.8rem" }}
                  placeholder="Describe the reason for your visit (optional additional notes)"
                  value={formData.reason_for_visit}
                  onChange={handleChange}
                ></textarea>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4 - Preferred Schedule */}
        {currentStep === 4 && (
          <div className="step-content">
            <div className="card border-0 shadow-sm">
              <div className="card-body p-4">
                <div className="row g-3">
                  <div className="col-md-6">
                    <div className="form-floating">
                      <input
                        type="date"
                        id="preferred_date"
                        name="preferred_date"
                        className="form-control"
                        value={formData.preferred_date}
                        onChange={handleChange}
                        required
                        min={new Date().toISOString().split("T")[0]}
                      />
                      <label htmlFor="preferred_date" className="text-muted">
                        Preferred Date <span className="text-danger">*</span>
                      </label>
                    </div>
                  </div>

                  <div className="col-md-6">
                    <div className="form-floating">
                      <select
                        id="preferred_time"
                        name="preferred_time"
                        className="form-control"
                        value={formData.preferred_time}
                        onChange={handleChange}
                        required
                      >
                        <option value="">Select Time</option>
                        <option value="Morning">
                          Morning (8:00 AM - 12:00 PM)
                        </option>
                        <option value="Afternoon">
                          Afternoon (1:00 PM - 5:00 PM)
                        </option>
                      </select>
                      <label htmlFor="preferred_time" className="text-muted">
                        Preferred Time <span className="text-danger">*</span>
                      </label>
                    </div>
                  </div>

                  <div className="col-12">
                    <div className="form-floating">
                      <textarea
                        id="notes"
                        name="notes"
                        className="form-control"
                        style={{ height: "100px", borderRadius: "0.8rem" }}
                        placeholder="Additional notes or special requests"
                        value={formData.notes}
                        onChange={handleChange}
                      ></textarea>
                      <label htmlFor="notes" className="text-muted">
                        Additional Notes
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 5 - Review & Submit */}
        {currentStep === 5 && (
          <div className="step-content">
            <div className="card border-0 shadow-sm">
              <div className="card-body p-4">
                <div className="review-sections">
                  <section className="review-section mb-4">
                    <h6 className="section-title text-primary border-bottom pb-2">
                      <FaUser className="me-2" />
                      Personal Details
                    </h6>
                    <div className="row">
                      <div className="col-md-6">
                        <p>
                          <strong>First Name:</strong> {formData.firstName}
                        </p>
                        <p>
                          <strong>Last Name:</strong> {formData.lastName}
                        </p>
                      </div>
                      <div className="col-md-6">
                        <p>
                          <strong>Contact Number:</strong> {formData.contact}
                        </p>
                        <p>
                          <strong>Email:</strong> {formData.email || "N/A"}
                        </p>
                      </div>
                    </div>
                  </section>

                  <section className="review-section mb-4">
                    <h6 className="section-title text-primary border-bottom pb-2">
                      <FaPaw className="me-2" />
                      Patient Details
                    </h6>
                    {formData.pets.map((pet, index) => (
                      <div key={index} className="row mb-3">
                        <div className="col-md-6">
                          <p>
                            <strong>
                              {formData.pets.length > 1
                                ? `Pet ${index + 1} Name:`
                                : "Pet Name:"}
                            </strong>{" "}
                            {pet.pet_name || "—"}
                          </p>
                          <p>
                            <strong>Breed:</strong> {pet.pet_breed || "—"}
                          </p>
                        </div>
                        <div className="col-md-6">
                          <p>
                            <strong>Species:</strong> {pet.pet_species || "—"}
                          </p>
                        </div>
                      </div>
                    ))}
                  </section>

                  <section className="review-section mb-4">
                    <h6 className="section-title text-primary border-bottom pb-2">
                      <FaStethoscope className="me-2" />
                      Reason for Visit
                    </h6>
                    <p className="mb-0">{formData.reason_for_visit}</p>
                  </section>

                  <section className="review-section">
                    <h6 className="section-title text-primary border-bottom pb-2">
                      <FaCalendarAlt className="me-2" />
                      Preferred Schedule
                    </h6>
                    <div className="row">
                      <div className="col-md-6">
                        <p>
                          <strong>Preferred Date:</strong>{" "}
                          {formData.preferred_date
                            ? format(
                                new Date(formData.preferred_date),
                                "MMMM dd, yyyy"
                              )
                            : "—"}
                        </p>
                      </div>
                      <div className="col-md-6">
                        <p>
                          <strong>Preferred Time:</strong>{" "}
                          {formData.preferred_time}
                        </p>
                      </div>
                      {formData.notes && (
                        <div className="col-12">
                          <p>
                            <strong>Additional Notes:</strong> {formData.notes}
                          </p>
                        </div>
                      )}
                    </div>
                  </section>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* NAVIGATION BUTTONS */}
        <div className="navigation-buttons mt-4">
          <div
            className={`d-flex ${
              currentStep === 1
                ? "justify-content-end"
                : "justify-content-between"
            }`}
          >
            {currentStep > 1 && (
              <Button
                variant="outline-secondary"
                size="lg"
                onClick={prevStep}
                className="px-5"
              >
                <i className="fas fa-arrow-left me-2"></i>
                Back
              </Button>
            )}
            {currentStep < totalSteps && (
              <Button
                variant="primary"
                onClick={nextStep}
                disabled={!isStepValid()}
                className="px-5"
                size="lg"
              >
                Next
                <i className="fas fa-arrow-right ms-2"></i>
              </Button>
            )}
            {currentStep === totalSteps && (
              <Button
                variant="success"
                type="submit"
                disabled={isLoading}
                className="px-4"
                size="lg"
              >
                {isLoading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" />
                    Submitting...
                  </>
                ) : (
                  <>Submit Appointment</>
                )}
              </Button>
            )}
          </div>
        </div>
      </form>

      <Modal
        show={showSuccessModal}
        onHide={handleCloseModal}
        centered
        backdrop="static"
        keyboard={false}
      >
        <Modal.Body className="text-center p-5">
          <div className="mb-4">
            <div className="success-icon-container mx-auto mb-3">
              <FaClipboardCheck size={32} className="text-success" />
            </div>
            <h4 className="text-success mb-3">
              Appointment Request Submitted!
            </h4>
            <p className="text-muted mb-4">
              Thank you for your appointment request. We've received your
              information and will contact you shortly to confirm your booking.
            </p>
          </div>

          <div className="next-steps bg-light rounded p-4 mb-4">
            <h6 className="text-primary mb-3">
              <FaClock className="me-2" />
              What Happens Next?
            </h6>
            <ul className="list-unstyled text-start small text-muted mb-0">
              <li className="mb-2">
                <FaCheckCircle className="text-success me-2" />
                We'll review your request
              </li>
              <li className="mb-2">
                <FaPhone className="text-primary me-2" />
                Contact you within 24 hours
              </li>
              <li className="mb-0">
                <FaCalendarCheck className="text-info me-2" />
                Confirm details via email or text
              </li>
            </ul>
          </div>

          <Button variant="success" onClick={handleCloseModal} className="px-5">
            <FaCheck className="me-2" />
            Got It!
          </Button>
        </Modal.Body>
      </Modal>
    </div>
  );
}

export default AddAppointments;
