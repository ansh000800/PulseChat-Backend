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
import adminRoutes from "./routes/adminRoutes.js";
import User from "./models/User.js";
import bcrypt from "bcryptjs";

connectDB();

// Seed Admin User
const seedAdmin = async () => {
  try {
    const adminExists = await User.findOne({ email: "admin@pulsechat.com" });
    if (!adminExists) {
      const hashedPassword = await bcrypt.hash("A", 10);
      const newAdmin = new User({
        name: "Admin",
        email: "admin@pulsechat.com",
        password: hashedPassword,
        role: "admin",
        status: "active",
      });
      await newAdmin.save();
      console.log("Admin user seeded.");
    }
  } catch (error) {
    console.error("Error seeding admin user:", error);
  }
};
seedAdmin();

const app = express();
const server = http.createServer(app);

app.use(
  cors({
    origin: ["https://pulsechat-hyo6.onrender.com", process.env.CLIENT_URL, "http://localhost:5173"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  }),
);
app.use(express.json());
// server.js
app.use("/uploads", express.static("uploads"));
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/admin", adminRoutes);

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
    io.emit("getUsers", Object.keys(onlineUsers));
  });

  // Send message to receiver
  socket.on("sendMessage", (message) => {
    const receiverSocket = onlineUsers[message.receiver];
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

  // Advanced Messaging
  socket.on("markSeen", ({ messageId, senderId, receiverId }) => {
    const senderSocket = onlineUsers[senderId];
    if (senderSocket) {
      io.to(senderSocket).emit("messageSeen", { messageId, receiverId });
    }
  });

  socket.on("editMessage", (message) => {
    const receiverSocket = onlineUsers[message.receiver];
    if (receiverSocket) {
      io.to(receiverSocket).emit("messageEdited", message);
    }
  });

  socket.on("deleteMessage", (message) => {
    const receiverSocket = onlineUsers[message.receiver];
    if (receiverSocket) {
      io.to(receiverSocket).emit("messageDeleted", message);
    }
  });

  socket.on("broadcastAnnouncement", (message) => {
    // Send to all connected clients except sender (admin)
    socket.broadcast.emit("newAnnouncement", message);
  });

  // Disconnect
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
    for (const userId in onlineUsers) {
      if (onlineUsers[userId] === socket.id) {
        delete onlineUsers[userId];
        io.emit("getUsers", Object.keys(onlineUsers));
      }
    }
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
