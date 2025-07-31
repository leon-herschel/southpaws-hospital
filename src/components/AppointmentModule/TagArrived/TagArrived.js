import React, { useState } from "react";
import axios from "axios";
import { Button } from "react-bootstrap";
import { toast } from "react-toastify";
import AddClientAndPatientModal from "../../Add/AddClientsModal";

function TagArrived({ onClose }) {
  const [referenceNumber, setReferenceNumber] = useState("REF-");
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

  const handleConfirmArrivalAfterNewClient = async () => {
    try {
      const res = await axios.post("http://localhost/api/TagArrived/mark-done.php", {
        reference_number: referenceNumber,
      });

      if (res.data.success) {
        toast.success("Arrival confirmed.");
        setStep("done");
      } else {
        toast.error(res.data.message || "Failed to update status.");
      }
    } catch {
      toast.error("Server error while confirming new client.");
    }
  };

  return (
    <div>
      {step === "input" && (
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            className="form-control mb-3"
            placeholder="Enter reference number"
            value={referenceNumber}
            onChange={(e) => setReferenceNumber(e.target.value)}
          />
          <button type="submit" className="btn btn-success w-100">
            Submit
          </button>
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
        <div>
          <h5>Client Information</h5>
          <p><strong>Name:</strong> {clientInfo.name}</p>
          <p><strong>Contact:</strong> {clientInfo.contact}</p>
          <p><strong>Service:</strong> {clientInfo.service}</p>

          {clientInfo.pets?.length > 0 && (
            <div className="mt-3">
              <h6>Pet(s) Information:</h6>
              <ul className="list-group">
                {clientInfo.pets.map((pet, index) => (
                  <li key={index} className="list-group-item">
                    <strong>Name:</strong> {pet.name} <br />
                    <strong>Species:</strong> {pet.species} <br />
                    <strong>Breed:</strong> {pet.breed}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <Button
            variant="success"
            className="mt-3"
            onClick={async () => {
              setUpdating(true);
              try {
                const res = await axios.post("http://localhost/api/TagArrived/mark-done.php", {
                  reference_number: referenceNumber,
                });

                if (res.data.success) {
                  toast.success("Arrival confirmed.");
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
            {updating ? "Updating..." : "Confirm Arrival"}
          </Button>
        </div>
      )}

      {/* New Client Modal */}
      <AddClientAndPatientModal
        show={showAddClientModal}
        handleClose={() => {
          setShowAddClientModal(false);
          onClose();
        }}
        onCategoryAdded={() => {}}
        prefillData={prefillInfo}
      />
    </div>
  );
}

export default TagArrived;
