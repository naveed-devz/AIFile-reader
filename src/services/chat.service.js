const mongoose = require("mongoose");

const Message = require("../models/message.model");
const Session = require("../models/session.model");
const User = require("../models/user.model");

const getHistory = async (sessionId, userId) => {
  if (!mongoose.Types.ObjectId.isValid(sessionId)) {
    throw new Error("Invalid sessionId");
  }

  const session = await Session.findById(sessionId);

  if (!session) {
    throw new Error("Session not found");
  }

  if (session.userId !== userId) {
    throw new Error("You are not allowed to access this session");
  }

  const messages = await Message.find({ sessionId }).sort({ createdAt: 1 });

  return {
    session,
    messages,
  };
};

const queryChat = async (payload) => {
  const { userId, sessionId, query, message, title } = payload;
  const prompt = query || message;

  if (!userId || !prompt) {
    throw new Error("userId and query are required");
  }

  const existingUser = await User.findById(userId);

  if (!existingUser) {
    throw new Error("User not found");
  }

  let activeSession;

  if (sessionId) {
    if (!mongoose.Types.ObjectId.isValid(sessionId)) {
      throw new Error("Invalid sessionId");
    }

    activeSession = await Session.findById(sessionId);

    if (!activeSession) {
      throw new Error("Session not found");
    }

    if (activeSession.userId !== userId) {
      throw new Error("You are not allowed to use this session");
    }
  } else {
    activeSession = await Session.create({
      userId,
      title: title || prompt.slice(0, 40),
    });
  }

  const chatEntry = await Message.create({
    userId,
    sessionId: activeSession._id,
    query: prompt,
    response: "Query received. AI response integration is pending.",
  });

  return {
    session: activeSession,
    message: chatEntry,
  };
};

module.exports = {
  getHistory,
  queryChat,
};
