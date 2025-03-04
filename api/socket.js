import { Server } from "socket.io";
import { createServer } from "http";
import express from 'express';
import cors from 'cors';

const app = express();
const httpServer = createServer(app);


app.use(cors({
  origin: "http://localhost:5173",
  methods: ["GET", "POST", "PUT"],
  credentials: true,
  optionsSuccessStatus: 200
}));

// Configure Socket.IO
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
  },
  allowEIO3: true,
  pingTimeout: 60000,
  pingInterval: 25000,
  transports: ['websocket', 'polling']
});

// User management
const onlineUsers = new Map(); // Using Map for better performance

const addUser = (userId, socketId) => {
  onlineUsers.set(userId, socketId);
  // Broadcast to all users that a new user is online
  io.emit("userOnline", { userId });
};

const removeUser = (socketId) => {
  for (const [userId, sid] of onlineUsers.entries()) {
    if (sid === socketId) {
      onlineUsers.delete(userId);
      // Broadcast to all users that this user is offline
      io.emit("userOffline", { userId });
      break;
    }
  }
};

const getUser = (userId) => {
  const socketId = onlineUsers.get(userId);
  return socketId ? { userId, socketId } : null;
};

// Socket event handlers
io.on("connection", (socket) => {
  console.log("New client connected:", socket.id);
  
  // Debug event to help troubleshoot
  socket.emit("connectionAck", { status: "connected", socketId: socket.id });

  socket.on("newUser", (userId) => {
    if (userId) {
      addUser(userId, socket.id);
      console.log("Online users:", Array.from(onlineUsers.entries()));
      // Send current online users to the newly connected user
      socket.emit("onlineUsers", Array.from(onlineUsers.keys()));
    }
  });

 



  socket.on("sendMessage", ({ receiverId, data }) => {
    console.log(`Message from ${data.senderId} to ${receiverId}:`, data);
  
    // Find the receiver using the user ID
    const receiver = getUser(receiverId);
  
    if (receiver) {
      // If the receiver is online, send the message directly to them
      io.to(receiver.socketId).emit("getMessage", data);
      console.log(`Message sent to receiver ${receiverId} (socketId: ${receiver.socketId})`);
    } else {
      // If the receiver is not online, notify the sender that the message is pending
      console.log(`Receiver ${receiverId} is not online`);
      socket.emit("messageStatus", { 
        messageId: data.id || Date.now(), 
        status: "pending", 
        info: "Receiver is offline" 
      });
    }
  });
  


  socket.on("sendVisitRequest", ({ receiverId, notification }) => {
    const receiver = getUser(receiverId);
    if (receiver) {
      io.to(receiver.socketId).emit("getVisitRequest", notification);
    }
  });

  socket.on("sendVisitResponse", ({ receiverId, notification }) => {
    const receiver = getUser(receiverId);
    if (receiver) {
      io.to(receiver.socketId).emit("getVisitResponse", notification);
    }
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
    removeUser(socket.id);
    console.log("Remaining users:", Array.from(onlineUsers.entries()));
  });

  // Error handling
  socket.on("error", (error) => {
    console.error("Socket error:", error);
    // Try to reconnect
    socket.connect();
  });
});

// Simple heartbeat to keep connections alive
setInterval(() => {
  io.emit("heartbeat", { timestamp: new Date().toISOString() });
}, 30000);

// Start server
const PORT = process.env.PORT || 4000;
httpServer.listen(PORT, () => {
  console.log(`Socket.io server running on port ${PORT}`);
});

