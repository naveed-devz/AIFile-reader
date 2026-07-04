const mongoose = require("mongoose");

const Document = require("../models/document.model");
const Session = require("../models/session.model");
const User = require("../models/user.model");

const uploadDocument = async (payload) => {
  const { userId, sessionId, fileName, fileType, pineconeNamespace } = payload;

  if (!userId || !sessionId) {
    throw new Error("userId and sessionId are required");
  }

  if (!mongoose.Types.ObjectId.isValid(sessionId)) {
    throw new Error("Invalid sessionId");
  }

  const existingUser = await User.findById(userId);

  if (!existingUser) {
    throw new Error("User not found");
  }

  const session = await Session.findById(sessionId);

  if (!session) {
    throw new Error("Session not found");
  }

  if (session.userId !== userId) {
    throw new Error("You are not allowed to upload to this session");
  }

  const document = await Document.create({
    userId,
    sessionId,
    fileName,
    fileType,
    pineconeNamespace,
  });

  return document;
};

const getDocuments = async (filters = {}) => {
  const query = {};

  if (filters.userId) {
    query.userId = filters.userId;
  }

  if (filters.sessionId) {
    if (!mongoose.Types.ObjectId.isValid(filters.sessionId)) {
      throw new Error("Invalid sessionId");
    }

    query.sessionId = filters.sessionId;
  }

  return Document.find(query).sort({ createdAt: -1 });
};

module.exports = {
  uploadDocument,
  getDocuments,
};
