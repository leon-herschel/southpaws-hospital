import { FaTimes } from "react-icons/fa";
import axios from "axios";
import { useState, useEffect } from "react";
import { format, isToday, isYesterday } from "date-fns";
import { useNavigate } from "react-router-dom";
import {
  MdOutlineNotificationsNone,
  MdOutlineNotificationsActive,
} from "react-icons/md";

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
  const navigate = useNavigate();

  // Helpers for localStorage
  const loadDismissed = () =>
    JSON.parse(localStorage.getItem("dismissedNotifications")) || [];
  const loadSeen = () =>
    JSON.parse(localStorage.getItem("seenNotifications")) || [];

  const [dismissedNotifications, setDismissedNotifications] = useState(
    loadDismissed()
  );
  const [seenIds, setSeenIds] = useState(loadSeen());

  // Fetch notifications with dismissed filter
  const fetchNotifications = async () => {
    try {
      const dismissedParam =
        dismissedNotifications.length > 0
          ? `?dismissed=${dismissedNotifications.join(",")}`
          : "";

      const res = await axios.get(
        `${API_BASE_URL}/api/notifications.php${dismissedParam}`
      );

      const now = new Date();
      let fetched = (res.data.notifications || [])
        .map((n) => {
          // Use backend timestamps (do NOT override)
          if (n.created_at) {
            return { ...n, created_at: new Date(n.created_at) };
          }

          // If backend still doesn't send ANY timestamp (rare)
          if (n.date && n.time) {
            return { ...n, created_at: new Date(`${n.date}T${n.time}`) };
          }

          return n;
        })
        // Only keep last 7 days
        .filter(
          (n) =>
            n.created_at && (now - n.created_at) / (1000 * 60 * 60 * 24) < 7
        )
        .sort((a, b) => b.created_at - a.created_at);

      setNotifications(fetched);

      // Update unread count
      const currentUnread = fetched.filter(
        (n) => !seenIds.includes(n.id)
      ).length;
      setUnreadCount(currentUnread);
    } catch (err) {
      console.error("Error fetching notifications", err);
    }
  };

  // Auto-refresh every 5 seconds
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 5000);
    return () => clearInterval(interval);
  }, [dismissedNotifications, seenIds]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      const bellElement = document.querySelector(".notification-bell");
      const dropdownElement = document.querySelector(".notification-dropdown");
      if (
        bellElement &&
        dropdownElement &&
        !bellElement.contains(event.target) &&
        !dropdownElement.contains(event.target)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Clicking the bell marks all as "seen"
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

  // Handle dismiss
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

  // Navigate based on notification type
  const handleNotificationClick = (notif) => {
    if (notif.status === "Pending") {
      navigate("/appointment/pending", { state: { searchName: notif.name } });
    } else if (notif.status === "Cancelled") {
      navigate("/appointment/cancelled", { state: { searchName: notif.name } });
    }
  };

  const getBellColor = (status) => {
    if (status === "Pending") return "gold";
    if (status === "Cancelled") return "red";
    return "#444";
  };

  const formatNotificationDate = (dateString) => {
    const date = new Date(dateString);
    if (isToday(date)) return `Today, ${format(date, "h:mm a")}`;
    if (isYesterday(date)) return `Yesterday, ${format(date, "h:mm a")}`;
    return format(date, "MMM dd, yyyy h:mm a");
  };

  const getStatus = (status) => {
    if (status === "Pending") return "Pending";
    if (status === "Cancelled") return "Cancelled";
    return status || "unknown";
  };

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      {/* Bell Icon */}
      <div
        onClick={handleBellClick}
        style={{
          cursor: "pointer",
          position: "relative",
          display: "inline-block",
          transition: "transform 0.2s",
        }}
        className="notification-bell"
      >
        {unreadCount > 0 ? (
          <MdOutlineNotificationsActive size={35} color="#202020ff" />
        ) : (
          <MdOutlineNotificationsNone size={35} color="#202020ff" />
        )}
        {unreadCount > 0 && (
          <span
            style={{
              position: "absolute",
              top: "-6px",
              right: "-6px",
              background: "#ff4d4f",
              color: "white",
              borderRadius: "50%",
              minWidth: "20px",
              height: "20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "12px",
              fontWeight: "bold",
              padding: "0 4px",
              boxShadow: "0 0 2px rgba(0,0,0,0.3)",
            }}
          >
            {unreadCount}
          </span>
        )}
      </div>

      {/* Dropdown */}
      {showDropdown && (
        <div
          className="notification-dropdown"
          style={{
            position: "absolute",
            top: "40px",
            right: "0",
            width: "320px",
            maxHeight: "400px",
            overflowY: "auto",
            background: "#fff",
            border: "1px solid #ccc",
            borderRadius: "8px",
            boxShadow: "0px 4px 12px rgba(0,0,0,0.15)",
            zIndex: 999,
          }}
        >
          {notifications.length > 0 ? (
            notifications.map((n) => (
              <div
                key={n.id}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  padding: "12px 10px",
                  borderBottom: "1px solid #eee",
                  cursor: "pointer",
                  backgroundColor:
                    n.status === "Pending"
                      ? "rgba(255,215,0,0.1)"
                      : n.status === "Cancelled"
                      ? "rgba(255,0,0,0.08)"
                      : "transparent",
                  transition: "background 0.2s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor = "rgba(0,0,0,0.05)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor =
                    n.status === "Pending"
                      ? "rgba(255,215,0,0.1)"
                      : n.status === "Cancelled"
                      ? "rgba(255,0,0,0.08)"
                      : "transparent")
                }
              >
                <div
                  style={{ display: "flex", alignItems: "center", gap: "10px" }}
                  onClick={() => handleNotificationClick(n)}
                >
                  <MdOutlineNotificationsActive
                    size={20}
                    color={getBellColor(n.status)}
                  />
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <span
                      style={{
                        fontWeight: 600,
                        fontSize: "14px",
                        color: "#333",
                      }}
                    >
                      {getStatus(n.status)} Appointment
                    </span>
                    <span style={{ fontSize: "13px", color: "#555" }}>
                      Client: {n.name}
                    </span>
                    <span style={{ fontSize: "12px", color: "#888" }}>
                      {formatNotificationDate(n.created_at)}
                    </span>
                  </div>
                </div>
                <FaTimes
                  size={14}
                  color="#888"
                  style={{ cursor: "pointer" }}
                  onClick={() => handleRemoveNotification(n.id)}
                />
              </div>
            ))
          ) : (
            <div
              style={{
                padding: "12px",
                textAlign: "center",
                fontSize: "14px",
                color: "#555",
              }}
            >
              No new notifications
            </div>
          )}
        </div>
      )}
    </div>
  );
}
