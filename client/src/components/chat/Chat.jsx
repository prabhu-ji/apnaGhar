import React, { useState, useEffect, useContext, useRef } from "react";
import { FaPaperPlane, FaSmile, FaMapMarkerAlt } from "react-icons/fa";
import apiRequest from "../../lib/apiRequest";
import { SocketContext } from "../../context/SocketContext";
import { AuthContext } from "../../context/AuthContext";
import EmojiPicker from "emoji-picker-react";
import { format } from "timeago.js";
import { useSearchParams } from "react-router-dom";
import { useNotificationStore } from "../../lib/notificationStore";
import { useNavigate } from 'react-router-dom';

import "./chat.scss";

function Chat({ chats }) {
  const [chat, setChat] = useState(null);
  const { currentUser } = useContext(AuthContext);
  const { socket } = useContext(SocketContext);
  const [searchParams] = useSearchParams();
  const messageEndRef = useRef();
  const [text, setText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [locationExpiredMessages, setLocationExpiredMessages] = useState(new Set());
  const decrease = useNotificationStore((state) => state.decrease);

  const navigate = useNavigate();

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat]);

  useEffect(() => {
    const chatId = searchParams.get("chat");
    if (chatId && chats) {
      const targetChat = chats.find(c => c.id === parseInt(chatId));
      if (targetChat) {
        handleOpenChat(targetChat.id, targetChat.receiver);
      }
    }
  }, [searchParams, chats]);

  const handleOpenChat = async (id, receiver) => {
    try {
      const res = await apiRequest(`/chats/${id}`);
      if (!res.data.seenBy.includes(currentUser.id)) {
        decrease();
      }
      setChat({ ...res.data, receiver });
    } catch (err) {
      console.log(err);
    }
  };

  const handleSendMessage = async () => {
    if (!text.trim()) return;

    try {
      const res = await apiRequest.post(`/messages/${chat.id}`, { text });
      setChat((prev) => ({ ...prev, messages: [...prev.messages, res.data] }));
      setText('');
      socket.emit("sendMessage", { receiverId: chat.receiver.id, data: res.data });
    } catch (err) {
      console.log(err);
    }
  };

  const handleSendLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (position) => {
        const { latitude, longitude } = position.coords;
        const locationUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;

        try {
          const res = await apiRequest.post(`/messages/${chat.id}`, { text: locationUrl });
          setChat((prev) => ({ ...prev, messages: [...prev.messages, res.data] }));
          socket.emit("sendMessage", { receiverId: chat.receiver.id, data: res.data });
        } catch (err) {
          console.log("Error sending location:", err);
        }
      });
    } else {
      alert("Geolocation is not supported by this browser.");
    }
  };

  const checkLocationExpiry = () => {
    const now = Date.now();
    const expiredMessages = new Set();

    chat.messages.forEach((message) => {
      if (
        message.text.includes("https://www.google.com/maps?q=") &&
        now - new Date(message.createdAt).getTime() > 10 * 60 * 1000
      ) {
        expiredMessages.add(message.id);
      }
    });

    setLocationExpiredMessages(expiredMessages);
  };

  useEffect(() => {
    if (chat) {
      checkLocationExpiry();
      const interval = setInterval(checkLocationExpiry, 10000);
      return () => clearInterval(interval);
    }
  }, [chat]);

  const handleEmojiPicker = () => setShowEmojiPicker(!showEmojiPicker);

  const locationLinkStyle = (messageId) => ({
    color: locationExpiredMessages.has(messageId) ? "#808080" : "lightblue",
    textDecoration: locationExpiredMessages.has(messageId) ? "line-through" : "none",
  });

  return (
    <div className="chat">
      <div className="messages">
        <h1>Messages</h1>
        {chats?.map((c) => (
          <div
            className="message"
            key={c.id}
            onClick={() => handleOpenChat(c.id, c.receiver)}
            style={{
              backgroundColor: c.seenBy.includes(currentUser.id) || chat?.id === c.id ? "white" : "#fecd514e",
            }}
          >
            <img src={c.receiver?.avatar || "/noavatar.jpg"} alt="" />
            <span>{c.receiver?.username}</span>
            <p>{c.lastMessage}</p>
          </div>
        ))}
      </div>

      {chat && (
        <div className="chatBox">
          <div className="top">
            <div className="user">
              <img src={chat.receiver?.avatar || "/noavatar.jpg"} alt="" />
              {chat.receiver?.username}
            </div>
          </div>

          <div className="center">
            {chat.messages.map((message) => (
              <div
                className="chatMessage"
                style={{
                  alignSelf: message.userId === currentUser.id ? "flex-end" : "flex-start",
                  textAlign: message.userId === currentUser.id ? "right" : "left",
                }}
                key={message.id}
              >
                {message.text.includes("https://www.google.com/maps?q=") ? (
                  <div
                    className="location-preview"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      color: locationExpiredMessages.has(message.id) ? "#808080" : "lightblue",
                      textDecoration: locationExpiredMessages.has(message.id) ? "line-through" : "none",
                    }}
                  >
                    <FaMapMarkerAlt
                      style={{
                        marginRight: "5px",
                        color: locationExpiredMessages.has(message.id) ? "#808080" : "lightblue",
                      }}
                    />
                    <a
                      href={message.text}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={locationLinkStyle(message.id)}
                      onClick={(e) =>
                        locationExpiredMessages.has(message.id) && e.preventDefault()
                      }
                    >
                      Location
                    </a>
                  </div>
                ) : (
                  <p>{message.text}</p>
                )}
                <span>{format(message.createdAt)}</span>
              </div>
            ))}
            <div ref={messageEndRef}></div>
          </div>

          <div className="bottom">
            <button className="emoji-button" onClick={handleEmojiPicker}>
              <FaSmile />
            </button>
            {showEmojiPicker && (
              <div className="emoji-picker">
                <EmojiPicker onEmojiClick={(emoji) => setText((prev) => prev + emoji.emoji)} />
              </div>
            )}
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
              placeholder="Type a message..."
            />
            <button type="button" onClick={handleSendMessage}>
              <FaPaperPlane className="send-icon" />
            </button>
            <button type="button" className="location-button" onClick={handleSendLocation}>
              <FaMapMarkerAlt />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Chat;
