import { MdOutlineNotificationsActive } from "react-icons/md";
import axios from "axios";
import { useState, useEffect } from "react";
import { format, isToday, isYesterday } from "date-fns";
import { useNavigate } from "react-router-dom";

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await axios.get("http://localhost/api/notifications.php");
        const now = new Date();

        const filtered = (res.data.notifications || [])
          .filter((n) => {
            const createdAt = new Date(n.created_at);
            const diffInDays = (now - createdAt) / (1000 * 60 * 60 * 24);
            return diffInDays < 7;
          })
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        setNotifications(filtered);
      } catch (err) {
        console.error("Error fetching notifications", err);
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 5000);
    return () => clearInterval(interval);
  }, []);

  const getBellColor = (status) => {
    if (status === "Pending") return "gold";
    if (status === "Cancelled") return "red";
    return "#444";
  };

  const handleNotificationClick = (notif) => {
    if (notif.status === "Pending") {
      navigate("/appointment/pending");
    } else if (notif.status === "Cancelled") {
      navigate("/appointment/cancelled");
    }
  };

  const formatNotificationDate = (dateString) => {
    const date = new Date(dateString);

    if (isToday(date)) {
      return `Today, ${format(date, "h:mm a")}`;
    } else if (isYesterday(date)) {
      return `Yesterday, ${format(date, "h:mm a")}`;
    }
    return format(date, "MMM dd, yyyy h:mm a");
  };

  const getStatus = (status) => {
    if (status === "Pending") return "Pending";
    if (status === "Cancelled") return "Cancelled";
    return status || "unknown";
  };

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <div
        onClick={() => setShowDropdown((prev) => !prev)}
        style={{ cursor: "pointer" }}
      >
        <MdOutlineNotificationsActive size={28} color="#444" />
        {notifications.length > 0 && (
          <span
            style={{
              position: "absolute",
              top: "-4px",
              right: "-4px",
              background: "red",
              color: "white",
              borderRadius: "50%",
              padding: "2px 6px",
              fontSize: "12px",
              fontWeight: "bold",
            }}
          >
            {notifications.length}
          </span>
        )}
      </div>

      {/* Dropdown */}
      {showDropdown && (
        <div
          style={{
            position: "absolute",
            top: "35px",
            right: "0",
            width: "300px",
            background: "white",
            border: "1px solid #ccc",
            borderRadius: "5px",
            boxShadow: "0px 2px 8px rgba(0,0,0,0.1)",
            zIndex: 999,
          }}
        >
          {notifications.length > 0 ? (
            notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => handleNotificationClick(n)}
                style={{
                  padding: "8px",
                  borderBottom: "1px solid #eee",
                  fontSize: "14px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  cursor: "pointer",
                  backgroundColor:
                    n.status === "Pending"
                      ? "rgba(255, 215, 0, 0.1)"
                      : "rgba(255, 0, 0, 0.1)",
                }}
              >
                <MdOutlineNotificationsActive
                  size={20}
                  color={getBellColor(n.status)}
                />
                {`${getStatus(n.status)} Appointment for ${
                  n.name
                } - ${formatNotificationDate(n.created_at)}`}
              </div>
            ))
          ) : (
            <div style={{ padding: "8px", fontSize: "14px" }}>
              No new notifications
            </div>
          )}
        </div>
      )}
    </div>
  );
}
