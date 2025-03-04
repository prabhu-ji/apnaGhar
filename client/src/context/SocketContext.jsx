import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { io } from "socket.io-client";
import { AuthContext } from "./AuthContext";

export const SocketContext = createContext();

export const SocketContextProvider = ({ children }) => {
  const { currentUser } = useContext(AuthContext);
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [connected, setConnected] = useState(false);
  const [pendingMessages, setPendingMessages] = useState([]);

  // Initialize socket connection
  useEffect(() => {
    if (!currentUser?.id) return; // Don't connect if no user is logged in
    
    const newSocket = io("http://localhost:4000", {
      transports: ["websocket", "polling"],
      autoConnect: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 3000,
      withCredentials: true,
      timeout: 10000,
      query: {
        userId: currentUser.id
      }
    });
    
    // Add connection handling
    newSocket.on("connect", () => {
      console.log("Socket connected successfully");
      setConnected(true);
      newSocket.emit("newUser", currentUser.id);
      
      // Try to resend any pending messages
      if (pendingMessages.length > 0) {
        pendingMessages.forEach(msg => {
          newSocket.emit("sendMessage", msg);
        });
        setPendingMessages([]);
      }
    });
    
    newSocket.on("disconnect", () => {
      console.log("Socket disconnected");
      setConnected(false);
    });
    
    newSocket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
      setConnected(false);
    });
    
    // Handle online users
    newSocket.on("onlineUsers", (users) => {
      setOnlineUsers(users);
    });
    
    newSocket.on("userOnline", ({ userId }) => {
      setOnlineUsers(prev => {
        if (!prev.includes(userId)) {
          return [...prev, userId];
        }
        return prev;
      });
    });
    
    newSocket.on("userOffline", ({ userId }) => {
      setOnlineUsers(prev => prev.filter(id => id !== userId));
    });
    
    newSocket.on("connectionAck", (data) => {
      console.log("Connection acknowledged by server:", data);
    });
    
    newSocket.on("heartbeat", () => {
      // Keep connection alive
    });
    
    setSocket(newSocket);
    
    return () => {
      newSocket.disconnect();
    };
  }, [currentUser.id, pendingMessages]);

  // Send message function with offline handling
  const sendMessage = useCallback((receiverId, messageData) => {
    if (!socket || !connected) {
      console.log("Socket not connected, queueing message");
      setPendingMessages(prev => [...prev, { receiverId, data: messageData }]);
      return false;
    }
    
    const messagePayload = {
      receiverId,
      data: {
        ...messageData,
        senderId: currentUser.id,
        timestamp: new Date().toISOString()
      }
    };
    
    socket.emit("sendMessage", messagePayload);
    return true;
  }, [socket, connected, currentUser?.id]);

  return (
    <SocketContext.Provider value={{ 
      socket, 
      connected,
      onlineUsers,
      sendMessage
    }}>
      {children}
    </SocketContext.Provider>
  );
};