import mongoose from "mongoose";

const messageSchema = mongoose.Schema(
  {
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    text: { type: String },
    type: { type: String, enum: ["direct", "announcement"], default: "direct" },
    image: { type: String }, // backward compatibility
    mediaUrl: { type: String }, // Cloudinary URL
    mediaType: { type: String }, // Mimetype e.g., image/jpeg, application/pdf
    isSeen: { type: Boolean, default: false },
    isEdited: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
    deletedBy: { type: String },
  },
  { timestamps: true },
);

messageSchema.index({ sender: 1, receiver: 1 });
messageSchema.index({ receiver: 1, isSeen: 1 });
messageSchema.index({ createdAt: -1 });

export default mongoose.model("Message", messageSchema);
