import { Server } from "socket.io";
import { createServer } from "http";

const httpServer = createServer();

const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT"]
  }
});

let onlineUsers = [];

const addUser = (userId, socketId) => {
  // Remove any existing socket connections for this user
  onlineUsers = onlineUsers.filter(user => user.userId !== userId);
  onlineUsers.push({ userId, socketId });
};

const removeUser = (socketId) => {
  onlineUsers = onlineUsers.filter(user => user.socketId !== socketId);
};

const getUser = (userId) => {
  return onlineUsers.find(user => user.userId === userId);
};

io.on("connection", (socket) => {
  console.log("New client connected:", socket.id);

  // Handle new user connection
  socket.on("newUser", (userId) => {
    addUser(userId, socket.id);
    console.log("Online users:", onlineUsers);
  });

  socket.on("sendVisitRequest", ({ receiverId, notification }) => {
    const receiver = getUser(receiverId);
    if (receiver) {
      io.to(receiver.socketId).emit("getVisitRequest", notification);
    }
  });

  // Handle visit response notification
  socket.on("sendVisitResponse", ({ receiverId, notification }) => {
    const receiver = getUser(receiverId);
    if (receiver) {
      io.to(receiver.socketId).emit("getVisitResponse", notification);
    }
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
    removeUser(socket.id);
    console.log("Remaining users:", onlineUsers);
  });
});

httpServer.listen(4000, () => {
  console.log("Socket.io server running on port 4000");
});