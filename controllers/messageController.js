import Message from "../models/Message.js";

// Save message to DB
// messageController.js
export const addMessage = async (req, res) => {
  try {
    const { receiverId, text } = req.body;
    let image = null;
    let mediaUrl = null;
    let mediaType = null;
    let type = "direct";
    let receiver = null;

    if (receiverId === "announcements") {
      type = "announcement";
      if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Only admin can send announcements" });
      }
    } else {
      const User = (await import("../models/User.js")).default;
      receiver = await User.findById(receiverId);
      if (receiver && receiver.status === "deactive") {
        return res.status(403).json({ message: "Cannot send message to deactivated user" });
      }
    }

    if (req.file) {
      mediaUrl = req.file.path; // Cloudinary secure URL
      mediaType = req.file.mimetype;
      image = req.file.path; // for backward compatibility
    }

    const message = await Message.create({
      sender: req.user._id,
      receiver: receiverId === "announcements" ? null : receiverId,
      text,
      type,
      image,
      mediaUrl,
      mediaType,
    });

    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get messages between logged-in user and other
export const getMessages = async (req, res) => {
  const { userId } = req.params;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  try {
    let query = {};
    if (userId === "announcements") {
      query = { type: "announcement" };
    } else {
      query = {
        $or: [
          { sender: req.user._id, receiver: userId },
          { sender: userId, receiver: req.user._id },
        ],
      };
    }

    const messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const markAsSeen = async (req, res) => {
  try {
    const message = await Message.findById(req.params.messageId);
    if (!message) return res.status(404).json({ message: "Message not found" });

    message.isSeen = true;
    await message.save();

    res.status(200).json(message);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const markBulkAsSeen = async (req, res) => {
  try {
    const { messageIds } = req.body;
    if (!messageIds || messageIds.length === 0) {
      return res.status(400).json({ message: "No message IDs provided" });
    }

    await Message.updateMany(
      { _id: { $in: messageIds }, receiver: req.user._id },
      { $set: { isSeen: true } }
    );

    res.status(200).json({ message: "Messages marked as seen" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const editMessage = async (req, res) => {
  try {
    const { text } = req.body;
    const message = await Message.findById(req.params.messageId);
    if (!message) return res.status(404).json({ message: "Message not found" });

    if (message.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const diffHours = Math.abs(new Date() - message.createdAt) / 36e5;
    if (diffHours > 24) {
      return res.status(400).json({ message: "Cannot edit message after 24 hours" });
    }

    message.text = text;
    message.isEdited = true;
    await message.save();

    res.status(200).json(message);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteMessage = async (req, res) => {
  try {
    const message = await Message.findById(req.params.messageId);
    if (!message) return res.status(404).json({ message: "Message not found" });

    if (message.sender.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const diffHours = Math.abs(new Date() - message.createdAt) / 36e5;
    if (diffHours > 24) {
      return res.status(400).json({ message: "Cannot delete message after 24 hours" });
    }

    message.text = null;
    message.mediaUrl = null;
    message.mediaType = null;
    message.image = null;
    message.isDeleted = true;
    message.deletedBy = req.user.name;

    await message.save();

    res.status(200).json(message);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getUnreadCounts = async (req, res) => {
  try {
    const unreadMessages = await Message.aggregate([
      { $match: { receiver: req.user._id, isSeen: false } },
      { $group: { _id: "$sender", count: { $sum: 1 } } }
    ]);
    
    const counts = {};
    unreadMessages.forEach(item => {
      counts[item._id] = item.count;
    });

    res.status(200).json(counts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


