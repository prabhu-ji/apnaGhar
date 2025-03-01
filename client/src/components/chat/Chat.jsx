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
  const [isChatBoxOpen, setIsChatBoxOpen] = useState(false);
  const decrease = useNotificationStore((state) => state.decrease);
  const navigate = useNavigate();

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat]);

  useEffect(() => {
    const chatId = searchParams.get("chat");
    if (chatId && chats) {
      const targetChat = chats.find(c => c.id === parseInt(chatId));
      // Only open chats that have a valid receiver
      if (targetChat && targetChat.receiver && targetChat.receiver.id) {
        handleOpenChat(targetChat.id, targetChat.receiver);
      }
    }
  }, [searchParams, chats]);

  useEffect(() => {
    socket.on("receiveMessage", (data) => {
      if (data.chatId === chat?.id) {
        setChat((prev) => ({ ...prev, messages: [...prev.messages, data] }));
      }
    });
    return () => socket.off("receiveMessage");
  }, [chat, socket]);

  const handleOpenChat = async (id, receiver) => {
    // Validate that the receiver exists before opening the chat
    if (!receiver || !receiver.id) {
      console.error("Cannot open chat: Invalid receiver");
      return;
    }

    if (chat?.id === id && isChatBoxOpen) {
      setIsChatBoxOpen(false);
      return;
    }

    try {
      const res = await apiRequest(`/chats/${id}`);
      if (!res.data.seenBy.includes(currentUser.id)) {
        decrease();
      }
      setChat({ ...res.data, receiver });
      setIsChatBoxOpen(true);
    } catch (err) {
      console.log(err);
    }
  };

  const handleSendMessage = async () => {
    if (!text.trim()) return;
    if (!chat || !chat.receiver || !chat.receiver.id) {
      console.error("Cannot send message: Invalid chat or receiver");
      return;
    }

    try {
      const res = await apiRequest.post(`/messages/${chat.id}`, { text });
      setChat((prev) => ({ ...prev, messages: [...prev.messages, res.data] }));
      setText('');
      socket.emit("sendMessage", { receiverId: chat.receiver.id, data: { ...res.data, chatId: chat.id } });
    } catch (err) {
      console.log(err);
    }
  };

  const handleSendLocation = () => {
    if (!chat || !chat.receiver || !chat.receiver.id) {
      console.error("Cannot send location: Invalid chat or receiver");
      return;
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (position) => {
        const { latitude, longitude } = position.coords;
        const locationUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;

        try {
          const res = await apiRequest.post(`/messages/${chat.id}`, { text: locationUrl });
          setChat((prev) => ({ ...prev, messages: [...prev.messages, res.data] }));
          socket.emit("sendMessage", { receiverId: chat.receiver.id, data: { ...res.data, chatId: chat.id } });
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

    chat?.messages.forEach((message) => {
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

  // Filter out invalid chats that don't have a proper receiver
  const validChats = chats?.filter(c => c.receiver && c.receiver.username);

  return (
    <div className="chat" style={{ backgroundColor: "#000", color: "#fff" }}>
      <div className="messages">
        <h1>Messages</h1>
        {validChats?.map((c) => (
          <div
            className="message"
            key={c.id}
            onClick={() => handleOpenChat(c.id, c.receiver)}
            style={{
              backgroundColor: c.seenBy.includes(currentUser.id) || chat?.id === c.id ? "#333" : "#fecd514e",
              color: "#fff",
            }}
          >
            <img src={c.receiver?.avatar || "/noavatar.jpg"} alt="" />
            <span>{c.receiver?.username}</span>
            <p className="message-preview">{c.lastMessage}</p>
          </div>
        ))}
      </div>

      {isChatBoxOpen && chat && chat.receiver && (
        <div className="chatBox">
          <div className="top">
            <div className="user">
              <img src={chat.receiver?.avatar || "/noavatar.jpg"} alt="" />
              {chat.receiver?.username}
            </div>
          </div>

          <div className="center" style={{ overflowY: "auto", maxHeight: "400px" }}>
            {chat.messages.map((message) => (
              <div
                className="chatMessage"
                style={{
                  alignSelf: message.userId === currentUser.id ? "flex-end" : "flex-start",
                  textAlign: message.userId === currentUser.id ? "right" : "left",
                  maxWidth: "70%",
                  wordWrap: "break-word",
                }}
                key={message.id}
              >
                {message.text.includes("https://www.google.com/maps?q=") ? (
                  <div className="location-preview">
                    <div className="location-content">
                      <FaMapMarkerAlt style={{ marginRight: "5px" }} />
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
                    <span>{format(message.createdAt)}</span>
                  </div>
                ) : (
                  <>
                    <p>{message.text}</p>
                    <span>{format(message.createdAt)}</span>
                  </>
                )}
              </div>
            ))}
            <div ref={messageEndRef}></div>
          </div>

          <div className="bottom" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <button className="emoji-button" onClick={handleEmojiPicker} style={{ fontSize: "16px" }}>
              <FaSmile />
            </button>
            {showEmojiPicker && (
              <div className="emoji-picker" style={{ position: "absolute", bottom: "60px" }}>
                <EmojiPicker onEmojiClick={(emoji) => setText((prev) => prev + emoji.emoji)} />
              </div>
            )}
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
              placeholder="Type a message..."
              style={{ flexGrow: 1, resize: "none", padding: "8px" }}
            />
            <button type="button" onClick={handleSendMessage} style={{ fontSize: "16px" }}>
              <FaPaperPlane className="send-icon" />
            </button>
            <button type="button" className="location-button" onClick={handleSendLocation} style={{ fontSize: "16px" }}>
              <FaMapMarkerAlt />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Chat;