import Message from "../models/Message.js";

// Save message to DB
// messageController.js
export const addMessage = async (req, res) => {
  try {
    const { receiverId, text } = req.body;
    let image = null;

    if (req.file) {
      image = `/uploads/${req.file.filename}`; // path to uploaded file
    }

    const message = await Message.create({
      sender: req.user._id,
      receiver: receiverId,
      text,
      image,
    });

    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get messages between logged-in user and other
export const getMessages = async (req, res) => {
  const { userId } = req.params;
  try {
    const messages = await Message.find({
      $or: [
        { sender: req.user._id, receiver: userId },
        { sender: userId, receiver: req.user._id },
      ],
    }).sort({ createdAt: 1 });
    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
