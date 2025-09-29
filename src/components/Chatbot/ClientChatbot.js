import React, { useState } from "react";
import { FaComments } from "react-icons/fa";
import ChatbotModal from "./Chatbot";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Tooltip from "react-bootstrap/Tooltip";

export default function ClientChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  return (
    <>
      {/* Floating Bubble */}
      <div
        style={{
          opacity: isOpen ? 0 : 1,
          pointerEvents: isOpen ? "none" : "auto",
          transition: "opacity 0.3s ease-in-out",
        }}
      >
        <OverlayTrigger
          placement="top"
          overlay={<Tooltip id="chat-tooltip">Need help? Chat with us</Tooltip>}
        >
          <div
            onClick={() => setIsOpen(true)}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            style={{
              position: "fixed",
              bottom: "30px",
              right: "50px",
              backgroundColor: isHovered ? "#0b5ed7" : "#0d6efd",
              color: "white",
              borderRadius: "50%",
              width: isHovered ? "65px" : "60px",
              height: isHovered ? "65px" : "60px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
              transition: "all 0.2s ease-in-out",
              zIndex: 9999,
            }}
          >
            <FaComments size={28} />
          </div>
        </OverlayTrigger>
      </div>

      {/* Chatbot Modal */}
      {isOpen && (
        <ChatbotModal
          onClose={() => setIsOpen(false)}
          rasaUrl="http://localhost:5006/webhooks/rest/webhook"
          triggerIntro={isOpen}
        />
      )}
    </>
  );
}
