import React, { useState } from "react";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";
import { FaUser, FaRobot } from "react-icons/fa";

export default function Chatbot() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  const userId = localStorage.getItem("userID") || "guest";

  const sendMessage = async () => {
    if (!input.trim()) return;

    setMessages(prev => [...prev, { sender: "user", text: input }]);

    try {
      const res = await axios.post("http://localhost:5005/webhooks/rest/webhook", {
        sender: userId,
        message: input
      });

      res.data.forEach(msg => {
        if (msg.text) {
          setMessages(prev => [...prev, { sender: "bot", text: msg.text }]);
        }
      });
    } catch (err) {
      console.error(err);
    }

    setInput("");
  };

  return (
    <div className="container py-4">
      <h4 className="fw-bold mb-3">DataFetch Assistant</h4>

      <div className="card border-info" style={{ height: "510px" }}>
        <div className="card-body d-flex flex-column">
          {/* Chat Messages */}
          <div
            className="flex-grow-1 overflow-auto mb-3"
            style={{ maxHeight: "400px" }}
          >
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
                    msg.sender === "user"
                      ? "bg-secondary text-white"
                      : "bg-light border"
                  }`}
                  style={{ maxWidth: "70%" }}
                >
                  {msg.text}
                </div>
                {msg.sender === "user" && (
                  <div className="ms-2">
                    <FaUser className="bg-success text-white p-2 rounded-circle" size={35} />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Input Field */}
          <div className="input-group">
            <input
              type="text"
              className="form-control"
              placeholder="Input text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            />
            <button className="btn btn-primary" onClick={sendMessage} style={{
                height: "80%",
                marginTop: "auto",
                marginBottom: "auto",
                boxShadow: "0 1rem 3rem rgba(0, 0, 0, .175)",
                lineHeight: 1
              }}>
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
