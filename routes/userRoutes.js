import express from "express";
import protect from "../middleware/authMiddleware.js";

import {
  getUsers,
  updateProfile,
  getProfile,
} from "../controllers/userController.js";
import upload from "../middleware/uploadMiddleWare.js";

const router = express.Router();
console.log("User routes loaded");

// Update logged-in user's profile
router.put("/profile", protect, upload.single("avatar"), updateProfile);

// Get all users
router.get("/", protect, getUsers);

// Get logged-in user's profile (for pre-fill)
router.get("/profile", protect, getProfile);

export default router;
