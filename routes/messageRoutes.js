import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { addMessage, getMessages, markAsSeen, markBulkAsSeen, editMessage, deleteMessage, getUnreadCounts } from "../controllers/messageController.js";

import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";

// Configure Multer with Cloudinary
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary.js";

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    const ext = file.originalname.split('.').pop();
    const isImage = file.mimetype.startsWith("image/");
    return {
      folder: "pulsechat_messages",
      resource_type: isImage ? "image" : "raw",
      format: isImage ? undefined : ext, // only supply format for raw
      public_id: Date.now() + "-" + file.originalname.split('.')[0],
    };
  },
});

const upload = multer({ storage });

const router = express.Router();

// Get unread counts (must be before /:userId)
router.get("/unread", protect, getUnreadCounts);

// Text message
router.post("/", protect, addMessage);

// Image message
router.post("/image", protect, upload.single("image"), addMessage);

// Get messages
router.get("/:userId", protect, getMessages);

// Advanced features
router.put("/seen-bulk", protect, markBulkAsSeen);
router.put("/:messageId/seen", protect, markAsSeen);
router.put("/:messageId/edit", protect, editMessage);
router.delete("/:messageId", protect, deleteMessage);

export default router;
