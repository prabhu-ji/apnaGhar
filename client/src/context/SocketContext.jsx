import { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { AuthContext } from "./AuthContext";

export const SocketContext = createContext();

export const SocketContextProvider = ({ children }) => {
  const { currentUser } = useContext(AuthContext);
  const [socket, setSocket] = useState(null);
  
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
        userId: currentUser.id // Pass user ID as a query parameter
      }
    });
    
    // Add error handling
    newSocket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
    });
    
    newSocket.on("connect", () => {
      console.log("Socket connected successfully");
      // Emit user ID after successful connection
      newSocket.emit("newUser", currentUser.id);
    });
    
    setSocket(newSocket);
    
    return () => {
      newSocket.disconnect();
    };
  }, [currentUser?.id]); // Only reconnect if user ID changes
  
  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
};