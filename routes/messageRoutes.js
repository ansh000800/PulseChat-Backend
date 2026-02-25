import express from "express";
import protect from "../middleware/authMiddleware.js";
import { addMessage, getMessages } from "../controllers/messageController.js";

import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";

// Configure Multer
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, "../uploads")),
  filename: (req, file, cb) =>
    cb(null, Date.now() + path.extname(file.originalname)),
});

const upload = multer({ storage });

const router = express.Router();

// Text message
router.post("/", protect, addMessage);

// Image message
router.post("/image", protect, upload.single("image"), addMessage);

// Get messages
router.get("/:userId", protect, getMessages);

export default router;
