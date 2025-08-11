import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Button, ProgressBar } from "react-bootstrap";
import { toast } from "react-toastify";

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

  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 5;

  const nextStep = () => setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 1));

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
        "http://localhost/api/ClientSide/booking_appointment.php",
        formToSend
      );

      if (res.data.success) {
        toast.success("Appointment submitted successfully!");
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
          /^\d{11}$/.test(formData.contact)
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

  return (
    <div className="container mt-4">
      <ProgressBar now={(currentStep / totalSteps) * 100} className="mb-4" />

      <form onSubmit={handleSubmit}>
        {/* STEP 1 - Personal Details */}
        {currentStep === 1 && (
          <>
            <h5>Personal Details</h5>
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
          </>
        )}

        {/* STEP 2 - Patient Details */}
        {currentStep === 2 && (
          <>
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
                        value={formData.pet_species}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* STEP 3 - Reason for Visit */}
        {currentStep === 3 && (
          <>
            <h5 className="mt-3">Reason for Visit</h5>
            <div className="card mb-2 mt-2">
              <div className="card-body">
                <label htmlFor="reasonForVisit">
                  Please describe the reason for your visit: <span className="text-danger">*</span>
                </label>
                <textarea
                  id="reason_for_visit"
                  name="reason_for_visit"
                  className="form-control"
                  rows="3"
                  placeholder="E.g., Annual vaccination, skin irritation, follow-up checkup..."
                  value={formData.reason_for_visit}
                  onChange={handleChange}
                  required
                ></textarea>
              </div>
            </div>
          </>
        )}

        {/* STEP 4 - Preferred Schedule */}
        {currentStep === 4 && (
          <>
            <h5 className="mt-3">Preferred Schedule</h5>
            <div className="card mb-2 mt-2">
              <div className="card-body">
                <div className="mb-3">
                  <label htmlFor="preferred_date">
                    Preferred Date: <span className="text-danger">*</span>
                  </label>
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
                </div>

                <div className="mb-3">
                  <label>
                    Preferred Time Range: <span className="text-danger">*</span>
                  </label>
                  <select
                    id="preferred_time"
                    name="preferred_time"
                    className="form-control"
                    value={formData.preferred_time}
                    onChange={handleChange}
                    required
                  >
                    <option value="">-- Select --</option>
                    <option value="Morning">Morning (8 AM - 12 PM)</option>
                    <option value="Afternoon">Afternoon (12 PM - 4 PM)</option>
                    <option value="Evening">Evening (4 PM - 8 PM)</option>
                  </select>
                </div>

                <div className="mb-3">
                  <label htmlFor="notes">Additional Notes:</label>
                  <textarea
                    id="notes"
                    name="notes"
                    className="form-control"
                    value={formData.notes}
                    onChange={handleChange}
                    placeholder="E.g., Available after 3 PM"
                  />
                </div>
              </div>
            </div>
          </>
        )}

        {/* STEP 5 - Review & Submit */}
        {currentStep === 5 && (
          <>
            <h5 className="mt-3">Review & Submit</h5>
            <div className="card mb-3 mt-2">
              <div className="card-body">

                {/* Personal Details */}
                <section className="mb-4">
                  <h6 className="text-primary border-bottom pb-2">Personal Details</h6>
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

                {/* Patient Details */}
                <section className="mb-4">
                  <h6 className="text-primary border-bottom pb-2">Patient Details</h6>
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

                {/* Reason for Visit */}
                <section className="mb-4">
                  <h6 className="text-primary border-bottom pb-2">Reason for Visit</h6>
                  <p>{formData.reason_for_visit}</p>
                </section>

                {/* Preferred Schedule */}
                <section>
                  <h6 className="text-primary border-bottom pb-2">Preferred Schedule</h6>
                  <div className="row">
                    <div className="col-md-6">
                      <p><strong>Preferred Date:</strong> {formData.preferred_date}</p>
                      <p><strong>Preferred Time Range:</strong> {formData.preferred_time}</p>
                    </div>
                    <div className="col-md-6">
                      {formData.notes && (
                        <p><strong>Additional Notes:</strong> {formData.notes}</p>
                      )}
                    </div>
                  </div>
                </section>

              </div>
            </div>
          </>
        )}

        {/* NAVIGATION BUTTONS */}
        <div className="d-flex justify-content-between mt-4">
          {currentStep > 1 && (
            <Button variant="secondary" onClick={prevStep}>
              Back
            </Button>
          )}
          {currentStep < totalSteps && (
            <Button variant="primary" onClick={nextStep} disabled={!isStepValid()}>
              Next
            </Button>
          )}
          {currentStep === totalSteps && (
            <Button
              variant="primary"
              type="submit"
              className="button btn-gradient"
              disabled={isLoading}
            >
              {isLoading ? "Booking..." : "Book"}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}

export default AddAppointments;
