import { useState, useEffect } from "react";
import axios from "axios";
import { OverlayTrigger, Tooltip } from "react-bootstrap";
import { FaQuestionCircle } from "react-icons/fa";
import { toast } from "react-toastify";

function Settings() {
  const [toggle, setToggle] = useState(true);
  const [loading, setLoading] = useState(true);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [logDays, setLogDays] = useState("");
  const [mission, setMission] = useState("");
  const [vision, setVision] = useState("");
  const [bgFile, setBgFile] = useState(null);
  const [bgPreview, setBgPreview] = useState(null);
  const [bgCurrent, setBgCurrent] = useState("");
  const [homepageFile, setHomepageFile] = useState(null);
  const [homepagePreview, setHomepagePreview] = useState(null);
  const [homepageCurrent, setHomepageCurrent] = useState("");
  const [introHeader, setIntroHeader] = useState("");
  const [introParagraph, setIntroParagraph] = useState("");
  const [aboutParagraph, setAboutParagraph] = useState("");
  const [values, setValues] = useState("");
  const [footerDescription, setFooterDescription] = useState("");
  const [footerAddress, setFooterAddress] = useState("");
  const [footerMapLink, setFooterMapLink] = useState("");
  const [footerNumber, setFooterNumber] = useState("");
  const [footerFbLink, setFooterFbLink] = useState("");
  const [footerFbText, setFooterFbText] = useState("");
  const [footerWeekdays, setFooterWeekdays] = useState("");
  const [footerHours, setFooterHours] = useState("");
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

  // Preview homepage selected file
  useEffect(() => {
    if (homepageFile) {
      const reader = new FileReader();
      reader.onloadend = () => setHomepagePreview(reader.result);
      reader.readAsDataURL(homepageFile);
    } else {
      setHomepagePreview("");
    }
  }, [homepageFile]);

  // Preview about us selected file
  useEffect(() => {
    if (bgFile) {
      const reader = new FileReader();
      reader.onloadend = () => setBgPreview(reader.result);
      reader.readAsDataURL(bgFile);
    } else {
      setBgPreview("");
    }
  }, [bgFile]);

  // Upload handler
  const handlePhotoUpload = async () => {
    if (!bgFile) return true;

    setLoading(true);
    const formData = new FormData();
    formData.append("photo", bgFile);

    try {
      const res = await axios.post(
        `${API_BASE_URL}/api/ClientSide/update_public_content.php`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      if (res.data.success) {
        setBgCurrent(res.data.file_path);
        setBgFile(null);
        setBgPreview(null);
        return true;
      } else {
        toast.error(res.data.error || "Upload failed.");
        return false;
      }
    } catch (err) {
      console.error(err);
      toast.error("Server error during upload.");
      return false;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    axios
      .get(`${API_BASE_URL}/api/ClientSide/get_public_content.php`)
      .then((res) => {
        if (res.data.success) {
          setMission(res.data.mission || "");
          setVision(res.data.vision || "");
          setBgCurrent(res.data.background_photo || "");
          setHomepageCurrent(res.data.homepage_cover_photo || "");
          setIntroHeader(res.data.intro_header || "");
          setIntroParagraph(res.data.intro_paragraph || "");
          setAboutParagraph(res.data.about_paragraph || "");
          setValues(res.data.values || "");
          setFooterDescription(res.data.footer_description || "");
          setFooterAddress(res.data.footer_address || "");
          setFooterMapLink(res.data.footer_map_link || "");
          setFooterNumber(res.data.footer_number || "");
          setFooterFbLink(res.data.footer_fb_link || "");
          setFooterFbText(res.data.footer_fb_text || "");
          setFooterWeekdays(res.data.footer_weekdays || "");
          setFooterHours(res.data.footer_hours || "");
        }
      })
      .catch((err) => console.error(err));
  }, []);

  const handleHomepageUpload = async () => {
    if (!homepageFile) return true;

    setLoading(true);
    const formData = new FormData();
    formData.append("photo", homepageFile);
    formData.append("type", "homepage_cover_photo");

    try {
      const res = await axios.post(
        `${API_BASE_URL}/api/ClientSide/update_public_content.php`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      if (res.data.success) {
        setHomepageCurrent(res.data.file_path);
        setHomepageFile(null);
        setHomepagePreview(null);
        return true;
      } else {
        toast.error(res.data.error || "Upload failed.");
        return false;
      }
    } catch (err) {
      console.error(err);
      toast.error("Server error during upload.");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleContentSave = async (type, content) => {
    setLoading(true);
    try {
      await axios.post(
        `${API_BASE_URL}/api/ClientSide/update_public_content.php`,
        { type, content }
      );
      return true;
    } catch (err) {
      console.error(err);
      toast.error("Failed to update content.");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleLogSave = () => {
    if (!logDays || logDays <= 0) {
      toast.error("Please enter a valid number of days.");
      return;
    }

    axios
      .post(`${API_BASE_URL}/api/Settings/set_log_retention.php`, {
        days: logDays,
      })
      .then((res) => {
        if (res.data.status === "success") {
          toast.success("Log retention setting saved!");
        } else {
          toast.error(
            res.data.message || "Failed to save log retention setting."
          );
        }
      })
      .catch((err) => {
        toast.error("Server error: " + err.message);
      });
  };

  // Format DB time (HH:MM:SS → HH:MM)
  const formatTime = (timeStr) => {
    if (!timeStr) return "";
    return timeStr.slice(0, 5); // keep only HH:MM
  };

  const handleSave = () => {
    if (startTime >= endTime) {
      alert("End time must be later than start time!");
      return;
    }

    axios
      .post(`${API_BASE_URL}/api/Settings/set_time_appointments.php`, {
        startTime,
        endTime,
      })
      .then((res) => {
        if (res.data.status === "success") {
          toast.success("Booking time updated!");
        } else {
          toast.error(res.data.message || "Failed to save booking time");
        }
      })
      .catch((err) => {
        toast.error("Server error: " + err.message);
      });
  };

  // Fetch booking status + saved time range
  useEffect(() => {
    const fetchData = async () => {
      try {
        // fetch toggle status
        const statusRes = await axios.get(
          `${API_BASE_URL}/api/ClientSide/get-booking-status.php`
        );
        setToggle(statusRes.data.appointmentFormEnabled);

        // fetch time limits
        const timeRes = await axios.get(
          `${API_BASE_URL}/api/Settings/get_time_appointments.php`
        );
        if (timeRes.data && timeRes.data.start_time && timeRes.data.end_time) {
          setStartTime(formatTime(timeRes.data.start_time));
          setEndTime(formatTime(timeRes.data.end_time));
        }

        const logRes = await axios.get(
          `${API_BASE_URL}/api/Settings/get_log_retention.php`
        );
        if (logRes.data && logRes.data.days) {
          setLogDays(logRes.data.days);
        }

        setLoading(false);
      } catch (err) {
        console.error("Failed to fetch settings", err);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const toggleFunction = () => {
    const newStatus = !toggle;
    axios
      .post(`${API_BASE_URL}/api/ClientSide/update-booking-status.php`, {
        appointmentFormEnabled: newStatus ? 1 : 0,
      })
      .then(() => setToggle(newStatus))
      .catch((err) => console.error("Toggle failed", err));
  };

  if (loading) return <p>Loading...</p>;

  const formatTo12Hour = (timeStr) => {
    if (!timeStr) return "";
    const [hour, minute] = timeStr.split(":");
    let h = parseInt(hour, 10);
    const ampm = h >= 12 ? "PM" : "AM";
    h = h % 12 || 12;
    return `${h}:${minute} ${ampm}`;
  };

  return (
    <div className="container light-style flex-grow-1 container-p-y">
      <h1 className="font-weight-bold py-3 mb-4">Settings</h1>

      {/* Online Appointments Setting */}
      <div className="card shadow-sm mb-4">
        <div className="card-header d-flex align-items-center justify-content-between">
          <h5 className="mb-0">
            Online Appointment{" "}
            <OverlayTrigger
              placement="right"
              overlay={
                <Tooltip>
                  Toggle this to enable or disable the appointment feature on
                  the website
                </Tooltip>
              }
            >
              <span style={{ cursor: "pointer", color: "#6c757d" }}>
                <FaQuestionCircle />
              </span>
            </OverlayTrigger>
          </h5>
        </div>
        <div className="card-body">
          <div className="form-check form-switch">
            <input
              className="form-check-input"
              type="checkbox"
              id="appointmentToggle"
              checked={toggle}
              onChange={toggleFunction}
            />
            <label className="form-check-label" htmlFor="appointmentToggle">
              {toggle
                ? "Clients can currently book appointments via the website."
                : "Clients cannot book appointments via the website right now."}
            </label>
          </div>
        </div>
      </div>

      {/* Clinic Schedule Setting */}
      <div className="card shadow-sm mb-4">
        <div className="card-header d-flex align-items-center justify-content-between">
          <h5 className="mb-0">
            Clinic Schedule{" "}
            <OverlayTrigger
              placement="right"
              overlay={
                <Tooltip>
                  Set your clinic’s operating hours. Appointments can only be
                  booked within these times.
                </Tooltip>
              }
            >
              <span style={{ cursor: "pointer", color: "#6c757d" }}>
                <FaQuestionCircle />
              </span>
            </OverlayTrigger>
          </h5>
        </div>

        <div className="card-body">
          <p className="text-muted mb-4">
            Current Schedule:{" "}
            <strong>{startTime ? formatTo12Hour(startTime) : "Not set"}</strong>{" "}
            – <strong>{endTime ? formatTo12Hour(endTime) : "Not set"}</strong>
          </p>

          <div className="row g-3">
            <div className="col-md-6">
              <label htmlFor="startTime" className="form-label fw-semibold">
                Opening Time
              </label>
              <input
                type="time"
                id="startTime"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="form-control shadow-sm"
              />
            </div>

            <div className="col-md-6">
              <label htmlFor="endTime" className="form-label fw-semibold">
                Closing Time
              </label>
              <input
                type="time"
                id="endTime"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="form-control shadow-sm"
              />
            </div>
          </div>

          <div className="d-flex justify-content-end mt-4">
            <button className="btn btn-primary px-4" onClick={handleSave}>
              Save Schedule
            </button>
          </div>
        </div>
      </div>

      {/* Log Retention Settings */}
      <div className="card shadow-sm mb-4">
        <div className="card-header d-flex align-items-center justify-content-between">
          <h5 className="mb-0">
            Log Retention{" "}
            <OverlayTrigger
              placement="right"
              overlay={
                <Tooltip>
                  Set how many days logs should be kept. Older logs will be
                  automatically deleted every time the system runs.
                </Tooltip>
              }
            >
              <span style={{ cursor: "pointer", color: "#6c757d" }}>
                <FaQuestionCircle />
              </span>
            </OverlayTrigger>
          </h5>
        </div>

        <div className="card-body">
          <div className="row g-3 align-items-center">
            <div className="col-md-6">
              <label htmlFor="logDays" className="form-label fw-semibold">
                Retain logs for (days)
              </label>
              <input
                type="number"
                id="logDays"
                className="form-control shadow-sm"
                placeholder="e.g. 30"
                min="1"
                value={logDays}
                onChange={(e) => setLogDays(e.target.value)}
              />
            </div>

            <div className="col-md-6 d-flex justify-content-end align-items-end">
              <button
                className="btn btn-primary px-4"
                onClick={handleLogSave}
                disabled={!logDays}
              >
                Save Changes
              </button>
            </div>
          </div>

          <p className="text-muted mt-3">
            Logs older than the saved number of days will be automatically
            deleted.
          </p>
        </div>
      </div>

      {/* Website Content Editor */}
      <div className="card shadow-sm mb-4">
        <div className="card-header d-flex align-items-center justify-content-between">
          <h5 className="mb-0">
            Website Content Editor{" "}
            <OverlayTrigger
              placement="right"
              overlay={
                <Tooltip>
                  Manage all text, images, and information displayed on your
                  website.
                </Tooltip>
              }
            >
              <span style={{ cursor: "pointer", color: "#6c757d" }}>
                <FaQuestionCircle />
              </span>
            </OverlayTrigger>
          </h5>
        </div>

        <div className="card-body p-0">
          {/* Tabs Navigation */}
          <ul className="nav nav-tabs" role="tablist">
            <li className="nav-item">
              <button
                className="nav-link active"
                data-bs-toggle="tab"
                data-bs-target="#homepage-tab"
                type="button"
                role="tab"
              >
                Homepage
              </button>
            </li>
            <li className="nav-item">
              <button
                className="nav-link"
                data-bs-toggle="tab"
                data-bs-target="#about-tab"
                type="button"
                role="tab"
              >
                About Us
              </button>
            </li>
            <li className="nav-item">
              <button
                className="nav-link"
                data-bs-toggle="tab"
                data-bs-target="#footer-tab"
                type="button"
                role="tab"
              >
                Footer
              </button>
            </li>
          </ul>

          {/* Tabs Content */}
          <div className="tab-content">
            {/* Homepage Tab */}
            <div
              className="tab-pane fade show active"
              id="homepage-tab"
              role="tabpanel"
            >
              <div className="p-3">
                <div className="mb-3">
                  <label className="form-label fw-semibold">Header</label>
                  <input
                    type="text"
                    className="form-control mb-2 shadow-sm"
                    value={introHeader}
                    onChange={(e) => setIntroHeader(e.target.value)}
                  />
                </div>

                <div className="mb-4">
                  <label className="form-label fw-semibold">Paragraph</label>
                  <textarea
                    className="form-control mb-2 shadow-sm"
                    rows="3"
                    value={introParagraph}
                    onChange={(e) => setIntroParagraph(e.target.value)}
                  />
                </div>

                <div className="mb-4">
                  <label className="form-label fw-semibold">
                    Homepage Photo
                  </label>
                  <small className="text-muted d-block mb-2">
                    Recommended: Landscape image (e.g., 1920×1080px) for best
                    appearance
                  </small>
                  <input
                    type="file"
                    accept="image/*"
                    className="form-control mb-3"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        // size limit check (2MB)
                        if (file.size > 2 * 1024 * 1024) {
                          toast.error("Image size must be less than 2MB");
                          e.target.value = "";
                          return;
                        }
                        setHomepageFile(file);
                      }
                    }}
                  />

                  {/* Image Preview */}
                  <div className="text-start">
                    {homepagePreview ? (
                      <img
                        src={homepagePreview}
                        alt="Preview"
                        className="img-fluid rounded shadow-sm mb-3"
                        style={{
                          maxWidth: "700px",
                          maxHeight: "700px",
                          width: "auto",
                          height: "auto",
                        }}
                      />
                    ) : homepageCurrent ? (
                      <img
                        src={`${API_BASE_URL}/api/public/${homepageCurrent}`}
                        alt="Current"
                        className="img-fluid rounded shadow-sm mb-3"
                        style={{
                          maxWidth: "700px",
                          maxHeight: "700px",
                          width: "auto",
                          height: "auto",
                        }}
                      />
                    ) : null}
                  </div>
                </div>

                <div className="text-end">
                  <button
                    className="btn btn-primary px-4"
                    onClick={async () => {
                      const success1 = await handleContentSave(
                        "intro_header",
                        introHeader
                      );
                      const success2 = await handleContentSave(
                        "intro_paragraph",
                        introParagraph
                      );

                      let photoSuccess = true;
                      if (homepageFile) {
                        photoSuccess = await handleHomepageUpload();
                      }

                      if (success1 && success2 && photoSuccess) {
                        toast.success("Homepage content updated successfully!");
                      }
                    }}
                  >
                    {loading ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </div>
            </div>

            {/* About Us Tab */}
            <div className="tab-pane fade" id="about-tab" role="tabpanel">
              <div className="p-3">
                <div className="mb-3">
                  <label className="form-label fw-semibold">
                    About Paragraph
                  </label>
                  <textarea
                    className="form-control mb-2 shadow-sm"
                    rows="3"
                    value={aboutParagraph}
                    onChange={(e) => setAboutParagraph(e.target.value)}
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">Mission</label>
                  <textarea
                    className="form-control mb-2 shadow-sm"
                    rows="3"
                    value={mission}
                    onChange={(e) => setMission(e.target.value)}
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">Vision</label>
                  <textarea
                    className="form-control mb-2 shadow-sm"
                    rows="3"
                    value={vision}
                    onChange={(e) => setVision(e.target.value)}
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">
                    Values (separate by |)
                  </label>
                  <input
                    type="text"
                    className="form-control mb-2 shadow-sm"
                    value={values}
                    onChange={(e) => setValues(e.target.value)}
                  />
                  <small className="text-muted">
                    Separate multiple values with the | character
                  </small>
                </div>

                {/* About Us Photo Section */}
                <div className="mb-4">
                  <label className="form-label fw-semibold">
                    About Us Photo
                  </label>
                  <small className="text-muted d-block mb-2">
                    Recommended: Square image 700x700px for optimal display
                  </small>
                  <input
                    type="file"
                    accept="image/*"
                    className="form-control mb-3"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        // Check file size (max 2MB)
                        if (file.size > 2 * 1024 * 1024) {
                          toast.error("Image size must be less than 2MB");
                          e.target.value = "";
                          return;
                        }
                        setBgFile(file);
                      }
                    }}
                  />

                  {/* Image Preview */}
                  <div className="text-start">
                    {bgPreview ? (
                      <div className="d-inline-block position-relative">
                        <img
                          src={bgPreview}
                          alt="Preview"
                          className="img-fluid rounded shadow-sm mb-3"
                          style={{
                            maxWidth: "700px",
                            maxHeight: "700px",
                            width: "auto",
                            height: "auto",
                          }}
                        />
                      </div>
                    ) : bgCurrent ? (
                      <div className="d-inline-block position-relative">
                        <img
                          src={`${API_BASE_URL}/api/public/${bgCurrent}`}
                          alt="Current"
                          className="img-fluid rounded shadow-sm mb-3"
                          style={{
                            maxWidth: "700px",
                            maxHeight: "700px",
                            width: "auto",
                            height: "auto",
                          }}
                        />
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="text-end">
                  <button
                    className="btn btn-primary px-4"
                    onClick={async () => {
                      const success1 = await handleContentSave(
                        "mission",
                        mission
                      );
                      const success2 = await handleContentSave(
                        "vision",
                        vision
                      );
                      const success3 = await handleContentSave(
                        "about_paragraph",
                        aboutParagraph
                      );
                      const success4 = await handleContentSave(
                        "values",
                        values
                      );

                      let photoSuccess = true;
                      if (bgFile) {
                        photoSuccess = await handlePhotoUpload();
                      }

                      if (
                        success1 &&
                        success2 &&
                        success3 &&
                        success4 &&
                        photoSuccess
                      ) {
                        toast.success("About Us content updated successfully!");
                      }
                    }}
                    disabled={loading}
                  >
                    {loading ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </div>
            </div>

            {/* Footer Tab */}
            <div className="tab-pane fade" id="footer-tab" role="tabpanel">
              <div className="p-3">
                {/* Clinic Information */}
                <div className="row mb-4">
                  <div className="col-12">
                    <h6 className="fw-bold border-bottom pb-2 mb-3">
                      Clinic Information
                    </h6>
                  </div>
                  <div className="col-12 mb-3">
                    <label className="form-label fw-semibold">
                      Description
                    </label>
                    <textarea
                      className="form-control shadow-sm"
                      rows="2"
                      value={footerDescription}
                      onChange={(e) => setFooterDescription(e.target.value)}
                      placeholder="Brief company description that appears under the logo"
                    />
                    <small className="text-muted">
                      This appears below your company logo in the footer
                    </small>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="row mb-4">
                  <div className="col-12">
                    <h6 className="fw-bold border-bottom pb-2 mb-3">
                      Contact Information
                    </h6>
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label fw-semibold">
                      Phone Number
                    </label>
                    <input
                      type="text"
                      className="form-control shadow-sm"
                      value={footerNumber}
                      onChange={(e) => setFooterNumber(e.target.value)}
                      placeholder="e.g., +1 (555) 123-4567"
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label fw-semibold">Address</label>
                    <input
                      type="text"
                      className="form-control shadow-sm"
                      value={footerAddress}
                      onChange={(e) => setFooterAddress(e.target.value)}
                      placeholder="Full street address"
                    />
                  </div>

                  <div className="col-md-6 mb-3">
                    <label className="form-label fw-semibold">
                      Facebook Page Link
                    </label>
                    <input
                      type="text"
                      className="form-control shadow-sm"
                      value={footerFbLink}
                      onChange={(e) => setFooterFbLink(e.target.value)}
                      placeholder="https://facebook.com/yourpage"
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label fw-semibold">
                      Facebook Display Text
                    </label>
                    <input
                      type="text"
                      className="form-control shadow-sm"
                      value={footerFbText}
                      onChange={(e) => setFooterFbText(e.target.value)}
                      placeholder="e.g., Follow us on Facebook"
                    />
                  </div>

                  <div className="col-12 mb-3">
                    <label className="form-label fw-semibold">
                      Google Map Link
                    </label>
                    <input
                      type="text"
                      className="form-control shadow-sm"
                      value={footerMapLink}
                      onChange={(e) => setFooterMapLink(e.target.value)}
                      placeholder="https://maps.google.com/..."
                    />
                    <small className="text-muted">
                      Link that opens your location in Google Maps
                    </small>
                  </div>
                </div>

                {/* Business Hours */}
                <div className="row mb-4">
                  <div className="col-12">
                    <h6 className="fw-bold border-bottom pb-2 mb-3">
                      Business Hours
                    </h6>
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label fw-semibold">
                      Operating Days
                    </label>
                    <input
                      type="text"
                      className="form-control shadow-sm"
                      value={footerWeekdays}
                      onChange={(e) => setFooterWeekdays(e.target.value)}
                      placeholder="e.g., Monday - Friday"
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label fw-semibold">
                      Operating Hours
                    </label>
                    <input
                      type="text"
                      className="form-control shadow-sm"
                      value={footerHours}
                      onChange={(e) => setFooterHours(e.target.value)}
                      placeholder="e.g., 9:00 AM - 5:00 PM"
                    />
                  </div>
                </div>

                {/* Save Button */}
                <div className="text-end">
                  <button
                    className="btn btn-primary px-5"
                    onClick={async () => {
                      const results = await Promise.all([
                        handleContentSave(
                          "footer_description",
                          footerDescription
                        ),
                        handleContentSave("footer_address", footerAddress),
                        handleContentSave("footer_map_link", footerMapLink),
                        handleContentSave("footer_number", footerNumber),
                        handleContentSave("footer_fb_link", footerFbLink),
                        handleContentSave("footer_fb_text", footerFbText),
                        handleContentSave("footer_weekdays", footerWeekdays),
                        handleContentSave("footer_hours", footerHours),
                      ]);

                      if (results.every((result) => result === true)) {
                        toast.success("Footer content updated successfully!");
                      }
                    }}
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Settings;
