import React, { useState } from "react";
import axios from "axios";
import { Button } from "react-bootstrap";
import { toast } from "react-toastify";
import AddClientAndPatientModal from "../../Add/AddClientsModal";

function TagArrived({ onClose }) {
  const [referenceNumber, setReferenceNumber] = useState("");
  const [prefillInfo, setPrefillInfo] = useState(null);
  const [step, setStep] = useState("input");
  const [clientInfo, setClientInfo] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [showAddClientModal, setShowAddClientModal] = useState(false);
  const [selectedPet, setSelectedPet] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!referenceNumber.trim()) {
      toast.error("Reference number is required.");
      return;
    }

    try {
      const res = await axios.post("http://localhost/api/TagArrived/check-reference.php", {
        reference_number: referenceNumber,
      });

      if (res.data.valid) {
        setStep("prompt");
      } else {
        toast.error(res.data.message || "Invalid reference number.");
      }
    } catch {
      toast.error("Server error while checking reference number.");
    }
  };

  const handleExistingClient = async () => {
    try {
      const res = await axios.post("http://localhost/api/TagArrived/get-client-info.php", {
        reference_number: referenceNumber,
      });

      if (res.data.client) {
        const pets = res.data.pets || [];
        const appointmentPet = {
          name: (res.data.appointment_pet?.name || '').toLowerCase().trim(),
          species: (res.data.appointment_pet?.species || '').toLowerCase().trim(),
          breed: (res.data.appointment_pet?.breed || '').toLowerCase().trim()
        };

        console.log("Matching against appointmentPet:", appointmentPet);
        console.log("Checking against pets array:", pets);

        const matchedPet = pets.find((pet) =>
          pet?.name?.toLowerCase().trim() === appointmentPet?.name?.toLowerCase().trim() &&
          pet?.species?.toLowerCase().trim() === appointmentPet?.species?.toLowerCase().trim() &&
          pet?.breed?.toLowerCase().trim() === appointmentPet?.breed?.toLowerCase().trim()
        );

        setClientInfo({
          ...res.data.client,
          service: res.data.appointment_service,
          doctor: res.data.appointment_doctor,
          time: res.data.appointment_time,
          end_time: res.data.appointment_end_time,
          pets: pets,
          date: res.data.appointment_date,
        });

        if (matchedPet) {
          setSelectedPet(matchedPet); // auto-select matched pet
        }

        setStep("client");
      } else {
        toast.error(res.data.message || "Client info not found.");
      }
    } catch {
      toast.error("Error fetching client information.");
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateStr).toLocaleDateString(undefined, options);
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    const [hours, minutes] = timeStr.split(':');
    const date = new Date();
    date.setHours(parseInt(hours, 10));
    date.setMinutes(parseInt(minutes, 10));
    return date.toLocaleTimeString([], {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatTimeRange = (start, end) => {
    if (!start) return '—';
    const formattedStart = formatTime(start);
    const formattedEnd = end ? formatTime(end) : '';
    return `${formattedStart} ${formattedEnd ? `- ${formattedEnd}` : ''}`;
  };


  return (
    <div>
      {step === "input" && (
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            className="form-control"
            placeholder="Enter reference number"
            value={referenceNumber}
            onChange={(e) => setReferenceNumber(e.target.value)}
          />
          <div className="button-container">
            <button type="submit" className="button btn-gradient btn-success">
              Submit
           </button>
          </div>  
        </form>
      )}

      {step === "prompt" && (
        <div className="text-center">
          <p className="">Is this a new or regular client?</p>
          <Button variant="primary" className="me-2 btn-lg" onClick={handleExistingClient}>
            Regular
          </Button>
          <Button variant="success" className="btn-lg" onClick={async () => {
            try {
              const res = await axios.post("http://localhost/api/TagArrived/get-appointment-info.php", {
                reference_number: referenceNumber,
              });

              if (res.data && res.data.success) {
                setPrefillInfo({
                  name: res.data.name,
                  contact: res.data.contact,
                  email: res.data.email,
                  pet_name: res.data.pet_name,
                  pet_species: res.data.pet_species,
                  pet_breed: res.data.pet_breed
                });
              }

            } catch (err) {
              console.error("Failed to fetch appointment info", err);
            }

            setStep("newClient");
            setShowAddClientModal(true);
        }}>
          New
        </Button>
        </div>
      )}

      {step === "client" && clientInfo && (
        <div className="row">
          <div className="col-md-12">
            <h5 className="mb-3">Client Details</h5>
            <div className="card p-3 mb-4 shadow-sm">
              <p className="mb-1"><strong>Name:</strong> {clientInfo.name}</p>
              <p className="mb-1"><strong>Contact:</strong> {clientInfo.contact}</p>
              <p className="mb-1"><strong>Email:</strong> {clientInfo.email || '—'}</p>
            </div>

            {clientInfo.pets?.length > 0 && (
              <>
                <div className="row">
                  {clientInfo.pets.length > 1 && !selectedPet && (
                    <>
                      <p><strong>Select which pet is receiving the service:</strong></p>
                      <div className="mb-3">
                        {clientInfo.pets.map((pet, index) => (
                          <div key={index} className="form-check">
                            <input
                              className="form-check-input"
                              type="radio"
                              name="selectedPet"
                              value={index}
                              id={`pet-${index}`}
                              onChange={() => setSelectedPet(clientInfo.pets[index])}
                            />
                            <label className="form-check-label" htmlFor={`pet-${index}`}>
                              {pet.name} — {pet.species}, {pet.breed}
                            </label>
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  {(clientInfo.pets.length === 1 || selectedPet) && (
                    <div className="col-md-12">
                      <h5 className="mb-3">Patient Details</h5>
                      <div className="card p-3 mb-4 shadow-sm">
                        <p className="mb-1"><strong>Service:</strong> {clientInfo.service}</p>
                        <p className="mb-1"><strong>Name:</strong> {(selectedPet || clientInfo.pets[0]).name}</p>
                        <p className="mb-1"><strong>Species:</strong> {(selectedPet || clientInfo.pets[0]).species}</p>
                        <p className="mb-1"><strong>Breed:</strong> {(selectedPet || clientInfo.pets[0]).breed}</p>
                      </div>
                    </div>
                  )}

                  {(clientInfo.pets.length === 1 || selectedPet) && (
                    <div className="col-md-12">
                      <h5 className="mb-3">Appointment Details</h5>
                      <div className="card p-3 mb-4 shadow-sm">
                        <p className="mb-1"><strong>Service:</strong> {clientInfo.service || '—'}</p>
                        <p className="mb-1"><strong>Doctor:</strong> {clientInfo.doctor || '—'}</p>
                        <p className="mb-1"><strong>Date:</strong> {formatDate(clientInfo.date)}</p>
                        <p className="mb-1"><strong>Time:</strong> {formatTimeRange(clientInfo.time, clientInfo.end_time)}</p>
                      </div>
                    </div>
                  )}

                </div>
              </>
            )}

            {(clientInfo.pets.length === 1 || selectedPet) && (
              <div className="button-container">
                <Button
                  variant="primary"
                  className="button btn-gradient"
                  onClick={async () => {
                    setUpdating(true);
                    try {
                      const res = await axios.post("http://localhost/api/TagArrived/mark-arrived.php", {
                        reference_number: referenceNumber,
                      });

                      if (res.data.success) {
                        toast.success("Arrival confirmed!");
                        onClose();
                      } else {
                        toast.error(res.data.message || "Failed to update status.");
                      }
                    } catch {
                      toast.error("Server error while updating status.");
                    } finally {
                      setUpdating(false);
                    }
                  }}
                  disabled={updating}
                >
                  {updating ? "Confirming..." : "Confirm Arrival"}
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* New Client Modal */}
      <AddClientAndPatientModal
        show={showAddClientModal}
        handleClose={() => {
          setShowAddClientModal(false);
        }}
        onCategoryAdded={async () => {
          setShowAddClientModal(false); 

          // Fetch client and pet info again
          await handleExistingClient();
        }}
        prefillData={prefillInfo}
      />
    </div>
  );
}

export default TagArrived;
