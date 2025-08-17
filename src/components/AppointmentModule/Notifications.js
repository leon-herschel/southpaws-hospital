import { MdOutlineNotificationsActive } from "react-icons/md";
import { FaTimes } from "react-icons/fa";
import axios from "axios";
import { useState, useEffect } from "react";
import { format, isToday, isYesterday } from "date-fns";
import { useNavigate } from "react-router-dom";

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);

  const navigate = useNavigate();

  // Load from localStorage helpers
  const getDismissedFromStorage = () =>
    JSON.parse(localStorage.getItem("dismissedNotifications")) || [];

  const getSeenFromStorage = () =>
    JSON.parse(localStorage.getItem("seenNotifications")) || [];

  // State
  const [dismissedNotifications, setDismissedNotifications] = useState(
    getDismissedFromStorage()
  );

  const [seenIds, setSeenIds] = useState(getSeenFromStorage());

  // Fetch notifications every 5 seconds
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await axios.get("http://localhost/api/notifications.php");
        const now = new Date();

        let filtered = (res.data.notifications || [])
          .map((n) => {
            if (n.date && n.time) {
              return {
                ...n,
                created_at: new Date(`${n.date}T${n.time}`),
              };
            } else if (n.created_at) {
              // For pending appointments
              return {
                ...n,
                created_at: new Date(n.created_at),
              };
            }
            return n;
          })
          .filter((n) => {
            if (!n.created_at) return false;
            const diffInDays = (now - n.created_at) / (1000 * 60 * 60 * 24);
            return diffInDays < 7; // keep last 7 days
          })
          .sort((a, b) => b.created_at - a.created_at);

        // Remove dismissed ones
        filtered = filtered.filter(
          (n) => !dismissedNotifications.includes(n.id)
        );

        // Remove dismissed ones
        filtered = filtered.filter(
          (n) => !dismissedNotifications.includes(n.id)
        );

        setNotifications(filtered);

        // Count only those not in seenIds
        const currentUnread = filtered.filter(
          (n) => !seenIds.includes(n.id)
        ).length;

        setUnreadCount(currentUnread);
      } catch (err) {
        console.error("Error fetching notifications", err);
      }
    };

    fetchNotifications();
  }, [dismissedNotifications, seenIds]);

  // Clicking bell marks all as seen
  const handleBellClick = () => {
    setShowDropdown((prev) => !prev);
    if (!showDropdown) {
      const updatedSeen = [
        ...new Set([...seenIds, ...notifications.map((n) => n.id)]),
      ];
      setSeenIds(updatedSeen);
      localStorage.setItem("seenNotifications", JSON.stringify(updatedSeen));
      setUnreadCount(0);
    }
  };

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

  // Remove a notification and mark as seen
  const handleRemoveNotification = (id) => {
    const updatedDismissed = [...dismissedNotifications, id];
    setDismissedNotifications(updatedDismissed);
    localStorage.setItem(
      "dismissedNotifications",
      JSON.stringify(updatedDismissed)
    );

    const updatedSeen = [...seenIds, id];
    setSeenIds(updatedSeen);
    localStorage.setItem("seenNotifications", JSON.stringify(updatedSeen));

    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      {/* Bell Icon */}
      <div onClick={handleBellClick} style={{ cursor: "pointer" }}>
        <MdOutlineNotificationsActive size={28} color="#444" />
        {unreadCount > 0 && (
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
            {unreadCount}
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
                style={{
                  padding: "8px",
                  borderBottom: "1px solid #eee",
                  fontSize: "14px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "8px",
                  backgroundColor:
                    n.status === "Pending"
                      ? "rgba(255, 215, 0, 0.1)"
                      : "rgba(255, 0, 0, 0.1)",
                }}
              >
                <div
                  onClick={() => handleNotificationClick(n)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    cursor: "pointer",
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
                <FaTimes
                  size={14}
                  color="gray"
                  style={{ cursor: "pointer" }}
                  onClick={() => handleRemoveNotification(n.id)}
                />
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
