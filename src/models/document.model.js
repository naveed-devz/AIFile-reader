const mongoose = require("mongoose");

const documentSchema = new mongoose.Schema(
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
    fileName: String,
    fileType: String,
    pineconeNamespace: String
  },
  { timestamps: true }
);

module.exports = mongoose.model("Document", documentSchema);