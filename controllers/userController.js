import User from "../models/User.js";
import cloudinary from "../config/cloudinary.js";

// ==============================
// GET ALL USERS (for chat list)
// ==============================
export const getUsers = async (req, res) => {
  try {
    const users = await User.find({ _id: { $ne: req.user._id } }).select(
      "-password",
    );
    res.json(users);
  } catch (error) {
    console.error("Get Users Error:", error);
    res.status(500).json({ message: "Failed to fetch users" });
  }
};

// ===================================
// GET LOGGED-IN USER PROFILE
// ===================================
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (error) {
    console.error("Get Profile Error:", error);
    res.status(500).json({ message: "Failed to fetch profile" });
  }
};

// ===================================
// UPDATE USER PROFILE
// ===================================
export const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const { name, email, bio } = req.body;

    // Update text fields
    user.name = name || user.name;
    user.email = email || user.email;
    user.bio = bio || user.bio;

    // If new avatar uploaded
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "pulsechat_avatars",
      });

      user.avatar = result.secure_url;
    }

    const updatedUser = await user.save();

    // Remove password before sending response
    const { password, ...userData } = updatedUser._doc;

    res.json(userData);
  } catch (error) {
    console.error("Update Profile Error:", error);
    res.status(500).json({ message: "Failed to update profile" });
  }
};
