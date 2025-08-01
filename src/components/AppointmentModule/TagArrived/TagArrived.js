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
        toast.error("Invalid reference number.");
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
        setClientInfo({
          ...res.data.client,
          service: res.data.appointment_service,
<<<<<<< HEAD
          time: res.data.appointment_time,
          end_time: res.data.appointment_end_time,
=======
>>>>>>> main
          pets: res.data.pets || [],
        });
        setStep("client");
      } else {
        toast.error("Client info not found.");
      }
    } catch {
      toast.error("Error fetching client information.");
    }
  };

  return (
    <div>
      {step === "input" && (
        <form onSubmit={handleSubmit}>
          <input
            type="text"
<<<<<<< HEAD
            className="form-control"
=======
            className="form-control mb-3"
>>>>>>> main
            placeholder="Enter reference number"
            value={referenceNumber}
            onChange={(e) => setReferenceNumber(e.target.value)}
          />
<<<<<<< HEAD
          <div className="button-container">
            <button type="submit" className="button btn-gradient btn-success">
              Submit
           </button>
          </div>  
=======
          <button type="submit" className="btn btn-success w-100">
            Submit
          </button>
>>>>>>> main
        </form>
      )}

      {step === "prompt" && (
        <div className="text-center">
          <p>Is the client existing or new?</p>
          <Button variant="primary" className="me-2" onClick={handleExistingClient}>
            Existing
          </Button>
          <Button variant="secondary" onClick={async () => {
            try {
              const res = await axios.post("http://localhost/api/TagArrived/get-appointment-info.php", {
                reference_number: referenceNumber,
              });

              if (res.data && res.data.success) {
                setPrefillInfo({
                  name: res.data.name,
                  contact: res.data.contact,
                  email: res.data.email,
<<<<<<< HEAD
                  pet_name: res.data.pet_name,
                  pet_species: res.data.pet_species,
                  pet_breed: res.data.pet_breed
=======
>>>>>>> main
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
        <div className="mt-2">
          <h5 className="mb-3">Client Details</h5>
          <div className="card p-3 mb-4 shadow-sm">
<<<<<<< HEAD
            <p className="mb-1"><strong>Name:</strong> {clientInfo.name}</p>
            <p className="mb-1"><strong>Contact:</strong> {clientInfo.contact}</p>
            <p className="mb-1"><strong>Email:</strong> {clientInfo.email || '—'}</p>
=======
            <div className="mb-2">
              <strong>Name:</strong>
              <div>{clientInfo.name}</div>
            </div>
            <div className="mb-2">
              <strong>Contact:</strong>
              <div>{clientInfo.contact}</div>
            </div>
            <div className="mb-2">
              <strong>Email:</strong>
              <div>{clientInfo.email || '—'}</div>
            </div>
          </div>

          <h5 className="mb-3">Appointment Info</h5>
          <div className="card p-3 mb-4 shadow-sm">
            <strong>Service:</strong> {clientInfo.service}
>>>>>>> main
          </div>

          {clientInfo.pets?.length > 0 && (
            <>
              <h5 className="mb-3">Patient(s) Information</h5>
              <div className="row">
                {clientInfo.pets.map((pet, index) => (
<<<<<<< HEAD
                  <div className="col-12" key={index}>
                    <div className="card mb-3 p-3 shadow-sm">
                      <p className="mb-1"><strong>Service:</strong> {clientInfo.service}</p>
=======
                  <div className="col-md-6" key={index}>
                    <div className="card mb-3 p-3 shadow-sm">
>>>>>>> main
                      <p className="mb-1"><strong>Name:</strong> {pet.name}</p>
                      <p className="mb-1"><strong>Species:</strong> {pet.species}</p>
                      <p className="mb-1"><strong>Breed:</strong> {pet.breed}</p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

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
        </div>
      )}

      {/* New Client Modal */}
      <AddClientAndPatientModal
        show={showAddClientModal}
<<<<<<< HEAD
        handleClose={() => {
          setShowAddClientModal(false);
        }}
        onCategoryAdded={async () => {
          setShowAddClientModal(false); 
=======
        handleClose={() => setShowAddClientModal(false)}
        onCategoryAdded={async () => {
          setShowAddClientModal(false); // Close modal
>>>>>>> main

          // Fetch client and pet info again
          await handleExistingClient();
        }}
        prefillData={prefillInfo}
      />
    </div>
  );
}

export default TagArrived;
