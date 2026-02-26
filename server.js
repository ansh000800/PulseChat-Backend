import dotenv from "dotenv";
dotenv.config();

import dns from "dns";
dns.setServers(["1.1.1.1", "8.8.8.8"]);

import express from "express";

import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import connectDB from "./config/db.js";

import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";

connectDB();

const app = express();
const server = http.createServer(app);

app.use(
  cors(
    cors({
      origin: "https://pulsechat-hyo6.onrender.com",
      credentials: true,
    }),
  ),
);
app.use(express.json());
// server.js
app.use("/uploads", express.static("uploads"));
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/messages", messageRoutes);

app.get("/", (req, res) => {
  res.send("PulseChat API is running...");
});

// ---- Socket.IO ----
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL,
    methods: ["GET", "POST"],
  },
});

// Track online users
let onlineUsers = {};

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // Add user
  socket.on("addUser", (userId) => {
    onlineUsers[userId] = socket.id;
  });

  // Send message to receiver
  socket.on("sendMessage", (message) => {
    const receiverSocket = onlineUsers[message.receiverId];
    if (receiverSocket) {
      io.to(receiverSocket).emit("getMessage", message);
    }
  });

  // Typing indicator
  socket.on("typing", ({ senderId, receiverId }) => {
    const receiverSocket = onlineUsers[receiverId];
    if (receiverSocket) {
      io.to(receiverSocket).emit("typing", { senderId });
    }
  });

  // Disconnect
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
    for (const userId in onlineUsers) {
      if (onlineUsers[userId] === socket.id) {
        delete onlineUsers[userId];
      }
    }
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
