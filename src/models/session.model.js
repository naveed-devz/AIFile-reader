const mongoose = require("mongoose");

const sessionSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true
    },
    title: {
      type: String,
      default: "New Chat"
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Session", sessionSchema);