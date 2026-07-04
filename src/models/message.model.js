const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true
    },
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Session",
      required: true
    },
    role: {
      type: String,
      enum: ["user", "assistant"],
      required: true
    },
    content: {
      type: String,
      required: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Message", messageSchema);