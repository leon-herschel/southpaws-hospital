import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import Draggable from "react-draggable";
import { FaUser, FaRobot, FaTimes, FaPaperPlane } from "react-icons/fa";
import "bootstrap/dist/css/bootstrap.min.css";

export default function ChatbotModal({ onClose }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  const userId = localStorage.getItem("userID") || "guest";
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    setMessages((prev) => [...prev, { sender: "user", text: input }]);

    try {
      const res = await axios.post("http://localhost:5005/webhooks/rest/webhook", {
        sender: userId,
        message: input,
      });

      res.data.forEach((msg) => {
        if (msg.text) {
          setMessages((prev) => [...prev, { sender: "bot", text: msg.text }]);
        }
      });
    } catch (err) {
      console.error(err);
    }

    setInput("");
  };

  return (
    <Draggable handle=".chatbot-header">
      <div
        className="chatbot-modal position-fixed shadow-lg"
      >
        {/* Header */}
        <div
          className="chatbot-header d-flex justify-content-between align-items-center px-3 py-2 bg-primary text-white"
          style={{ cursor: "move", borderTopLeftRadius: "10px", borderTopRightRadius: "10px" }}
        >
          <span>PawPal</span>
          <FaTimes style={{ cursor: "pointer" }} onClick={onClose} />
        </div>

        {/* Messages */}
        <div className="flex-grow-1 p-2 overflow-auto">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`d-flex mb-3 ${
                msg.sender === "user" ? "justify-content-end" : "justify-content-start"
              }`}
            >
              {msg.sender === "bot" && (
                <div className="me-2">
                  <FaRobot className="bg-primary text-white p-2 rounded-circle" size={35} />
                </div>
              )}
              <div
                className={`p-2 rounded ${
                  msg.sender === "user" ? "bg-secondary text-white" : "bg-light border"
                }`}
                style={{ maxWidth: "70%", whiteSpace: "pre-line" }}
              >
                {msg.text}
              </div>
              {msg.sender === "user" && (
                <div className="ms-2">
                  <FaUser className="bg-primary text-white p-2 rounded-circle" size={35} />
                </div>
              )}
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        {/* Input */}
        <div className="p-2 border-top d-flex align-items-center justify-content-center">
          <input
            type="text"
            className="form-control me-2"
            placeholder="Type a message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          />
          <button 
            className="btn btn-primary rounded-circle d-flex align-items-center justify-content-center"
            style={{ width: "40px", height: "40px" }}
            onClick={sendMessage}
          >
            <FaPaperPlane />
          </button>
        </div>
      </div>
    </Draggable>
  );
}
