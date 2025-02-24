import { Server } from "socket.io";
import { createServer } from "http";
import express from 'express';
import cors from 'cors';

const app = express();
const httpServer = createServer(app);

// Configure Express middleware
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
};

const removeUser = (socketId) => {
  for (const [userId, sid] of onlineUsers.entries()) {
    if (sid === socketId) {
      onlineUsers.delete(userId);
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

  socket.on("newUser", (userId) => {
    if (userId) {
      addUser(userId, socket.id);
      console.log("Online users:", Array.from(onlineUsers.entries()));
    }
  });

  socket.on("sendMessage", ({ receiverId, data }) => {
    const receiver = getUser(receiverId);
    if (receiver) {
      io.to(receiver.socketId).emit("getMessage", data);
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
  });
});

// Start server
const PORT = process.env.PORT || 4000;
httpServer.listen(PORT, () => {
  console.log(`Socket.io server running on port ${PORT}`);
});