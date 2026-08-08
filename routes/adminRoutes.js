import express from "express";
import { protect, adminProtect } from "../middleware/authMiddleware.js";
import {
  getAdminUsers,
  createUser,
  toggleUserStatus,
  deleteUser,
} from "../controllers/adminController.js";

const router = express.Router();

router.get("/users", protect, adminProtect, getAdminUsers);
router.post("/users", protect, adminProtect, createUser);
router.put("/users/:id/status", protect, adminProtect, toggleUserStatus);
router.delete("/users/:id", protect, adminProtect, deleteUser);

export default router;
