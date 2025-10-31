import React, { useState } from "react";
import axios from "axios";
import { Button, OverlayTrigger, Popover } from "react-bootstrap";
import { toast } from "react-toastify";
import { format } from "date-fns";
import { FaQuestionCircle, FaPaw, FaUser, FaCalendarAlt, FaStethoscope, FaClipboardCheck } from "react-icons/fa";
import { useEffect } from "react";

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
    pet_name: "",
    pet_breed: "",
    pet_species: "",
    notes: "",
  });
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 5;

  const nextStep = () => setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 1));
  const [services, setServices] = useState([]);

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
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
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
      pet_name: formData.pet_name,
      pet_breed: formData.pet_breed,
      pet_species: formData.pet_species,
      notes: formData.notes,
    };

    try {
      const res = await axios.post(
        `${API_BASE_URL}/api/ClientSide/booking_appointment.php`,
        formToSend
      );

      if (res.data.success) {
        toast.success("Appointment request submitted! Please note that your request is still under review. Kindly monitor your phone or email for confirmation.");
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
        return (
          formData.pet_name.trim() !== "" &&
          formData.pet_breed.trim() !== "" &&
          formData.pet_species.trim() !== ""
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
            <ul className="mb-0 ps-3 text-start" style={{ listStyleType: "disc" }}>
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

  const stepIcons = [FaUser, FaPaw, FaStethoscope, FaCalendarAlt, FaClipboardCheck];
  const stepTitles = ["Personal Details", "Patient Details", "Reason for Visit", "Preferred Schedule", "Review & Submit"];

  return (
    <div className="appointment-form-container">
      {/* Progress Bar */}
      <div className="progress-container mb-4">
        <div className="d-flex justify-content-between position-relative">
          {stepIcons.map((Icon, index) => (
            <div key={index} className="step-indicator text-center">
              <div className={`step-circle ${currentStep > index + 1 ? 'completed' : ''} ${currentStep === index + 1 ? 'active' : ''}`}>
                <Icon size={18} className="step-icon" />
              </div>
              <small className="step-label d-none d-md-block">{stepTitles[index]}</small>
            </div>
          ))}
          <div className="progress-bar-background">
            <div 
              className="progress-bar-fill" 
              style={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` }}
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
                      <small className="text-danger">Contact number must be 11 digits.</small>
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
                <div className="row g-3">
                  <div className="col-md-6">
                    <div className="form-floating">
                      <input
                        type="text"
                        id="pet_name"
                        name="pet_name"
                        className="form-control"
                        value={formData.pet_name}
                        onChange={handleChange}
                        placeholder="Pet Name"
                        required
                      />
                      <label htmlFor="pet_name" className="text-muted">
                        Pet Name <span className="text-danger">*</span>
                      </label>
                    </div>
                  </div>

                  <div className="col-md-6">
                    <div className="form-floating">
                      <input
                        type="text"
                        id="pet_breed"
                        name="pet_breed"
                        className="form-control"
                        value={formData.pet_breed}
                        list="breedOptions"
                        onChange={handleChange}
                        placeholder="Breed"
                        required
                      />
                      <label htmlFor="pet_breed" className="text-muted">
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

                  <div className="col-12">
                    <div className="form-floating">
                      <input
                        type="text"
                        id="pet_species"
                        name="pet_species"
                        className="form-control"
                        value={formData.pet_species}
                        list="speciesOptions"
                        onChange={handleChange}
                        placeholder="Species"
                        required
                      />
                      <label htmlFor="pet_species" className="text-muted">
                        Species <span className="text-danger">*</span>
                      </label>
                      <datalist id="speciesOptions">
                        <option value="Canine" />
                        <option value="Feline" />
                      </datalist>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3 - Reason for Visit */}
        {currentStep === 3 && (
          <div className="step-content">
            <div className="card border-0 shadow-sm">
              <div className="card-body p-4">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <label htmlFor="reason_for_visit" className="text-muted">
                    Reason for Visit <span className="text-danger">*</span>
                  </label>

                  <OverlayTrigger trigger="click" placement="right" overlay={servicesPopover} rootClose>
                    <Button
                      variant="outline-primary"
                      size="sm"
                      className="d-flex align-items-center gap-1"
                    >
                      <FaQuestionCircle />
                      <span>Available Services</span>
                    </Button>
                  </OverlayTrigger>
                </div>

                <textarea
                  id="reason_for_visit"
                  name="reason_for_visit"
                  className="form-control"
                  style={{ height: "120px", borderRadius: "0.8rem"}}
                  placeholder="Describe the reason for your visit (e.g., Annual vaccination, skin irritation, follow-up checkup)"
                  value={formData.reason_for_visit}
                  onChange={handleChange}
                  required
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
                        <option value="Morning">Morning (8:00 AM - 12:00 PM)</option>
                        <option value="Afternoon">Afternoon (1:00 PM - 5:00 PM)</option>
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
                        style={{ height: "100px", borderRadius: "0.8rem"}}
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
                        <p><strong>First Name:</strong> {formData.firstName}</p>
                        <p><strong>Last Name:</strong> {formData.lastName}</p>
                      </div>
                      <div className="col-md-6">
                        <p><strong>Contact Number:</strong> {formData.contact}</p>
                        <p><strong>Email:</strong> {formData.email || "N/A"}</p>
                      </div>
                    </div>
                  </section>

                  <section className="review-section mb-4">
                    <h6 className="section-title text-primary border-bottom pb-2">
                      <FaPaw className="me-2" />
                      Patient Details
                    </h6>
                    <div className="row">
                      <div className="col-md-6">
                        <p><strong>Pet Name:</strong> {formData.pet_name}</p>
                        <p><strong>Breed:</strong> {formData.pet_breed}</p>
                      </div>
                      <div className="col-md-6">
                        <p><strong>Species:</strong> {formData.pet_species}</p>
                      </div>
                    </div>
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
                            ? format(new Date(formData.preferred_date), "MMMM dd, yyyy")
                            : "—"}
                        </p>
                      </div>
                      <div className="col-md-6">
                        <p><strong>Preferred Time:</strong> {formData.preferred_time}</p>
                      </div>
                      {formData.notes && (
                        <div className="col-12">
                          <p><strong>Additional Notes:</strong> {formData.notes}</p>
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
          <div className={`d-flex ${currentStep === 1 ? "justify-content-end" : "justify-content-between"}`}>
            {currentStep > 1 && (
              <Button variant="outline-secondary" size='lg' onClick={prevStep} className="px-5">
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
                size='lg'
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
                  <>
                    Submit Appointment
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}

export default AddAppointments;