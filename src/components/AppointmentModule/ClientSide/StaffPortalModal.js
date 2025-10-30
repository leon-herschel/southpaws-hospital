import { useState } from "react";
import axios from "axios";
import { FaEye, FaEyeSlash } from "react-icons/fa";

function StaffPortalModal() {
  const [passkey, setPasskey] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await axios.post(
        `${API_BASE_URL}/api/ClientSide/verify-pass.php`,
        { passkey }
      );

      if (res.data.success) {
        window.location.href = res.data.redirect; // Redirect to HMS login page
      } else {
        setError(res.data.message || "Invalid passkey");
      }
    } catch (err) {
      setError("Server error. Try again later.");
    }

    setLoading(false);
  };

  return (
    <div
      className="modal fade"
      id="staffPortalModal"
      tabIndex="-1"
      aria-hidden="true"
    >
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content p-3">
          <div className="modal-header">
            <h5 className="modal-title">Staff Portal Access</h5>
            <button
              type="button"
              className="btn-close"
              data-bs-dismiss="modal"
              aria-label="Close"
            ></button>
          </div>

          <div className="modal-body">
            <form onSubmit={handleSubmit}>
              <div className="mb-3 position-relative">
                <label className="form-label">Enter Passkey</label>
                <div className="position-relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    className="form-control pe-5"
                    value={passkey}
                    onChange={(e) => setPasskey(e.target.value)}
                    required
                  />
                  <span
                    className="position-absolute top-50 end-0 translate-middle-y pe-3"
                    style={{ cursor: "pointer" }}
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <FaEyeSlash size={20} /> : <FaEye size={20}/>}
                  </span>
                </div>
              </div>

              {error && <div className="text-danger mb-2">{error}</div>}

              <button
                type="submit"
                className="btn btn-primary w-100"
                disabled={loading}
              >
                {loading ? "Verifying..." : "Submit"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default StaffPortalModal;
