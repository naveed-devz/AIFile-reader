const mongoose = require("mongoose");

const User = require("../models/user.model");
const Session = require("../models/session.model");
const Document = require("../models/document.model");

const validateUser = async (userId) => {
  if (!userId) {
    throw new Error("userId is required");
  }

  const user = await User.findById(userId);

  if (!user) {
    throw new Error("User not found");
  }

  return user;
};

const validateSession = async (userId, sessionId) => {
  if (!sessionId) {
    throw new Error("sessionId is required");
  }

  if (!mongoose.Types.ObjectId.isValid(sessionId)) {
    throw new Error("Invalid sessionId");
  }

  const session = await Session.findById(sessionId);

  if (!session) {
    throw new Error("Session not found");
  }

  if (session.userId !== userId) {
    throw new Error("Session is not authorized for this user");
  }

  return session;
};

const validateFile = async (file) => {
  if (!file) {
    throw new Error("Document file is required");
  }

  return file;
};

const saveDocument = async (payload) => {
  const {
    userId,
    sessionId,
    fileName,
    fileType,
    pineconeNamespace,
    pageCount,
    chunkCount,
  } = payload;

  const document = await Document.create({
    userId,
    sessionId,
    fileName,
    fileType,
    pineconeNamespace,
    pageCount,
    chunkCount,
  });

  return document;
};

const uploadDocument = async (payload) => {
  const { userId, sessionId, file } = payload;

  await validateUser(userId);
  await validateSession(userId, sessionId);
  await validateFile(file);

  const pineconeNamespace = `${userId}:${sessionId}`;

  const document = await saveDocument({
    userId,
    sessionId,
    fileName: file.originalname,
    fileType: file.mimetype,
    pineconeNamespace,
    pageCount: 0,
    chunkCount: 0,
  });

  return document;
};

const getDocuments = async (filters = {}) => {
  const query = {};

  if (!filters.userId) {
    throw new Error("userId is required");
  }

  query.userId = filters.userId;

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
