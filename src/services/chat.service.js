const mongoose = require("mongoose");

const Message = require("../models/message.model");
const Session = require("../models/session.model");
const User = require("../models/user.model");
const Document = require("../models/document.model");
const { embedTexts, generateAnswer, assertGeminiConfigured } = require("./ai.service");
const { isPineconeConfigured, queryVectors } = require("./vector.service");

const tokenize = (text = "") =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length > 2);

const findRelevantChunks = (documents, prompt) => {
  const queryTokens = tokenize(prompt);
  const scoredChunks = [];

  for (const document of documents) {
    for (const chunk of document.chunks || []) {
      const chunkTokens = tokenize(chunk.content);
      let score = 0;

      for (const token of queryTokens) {
        if (chunkTokens.includes(token)) {
          score += 1;
        }
      }

      if (score > 0) {
        scoredChunks.push({
          score,
          fileName: document.fileName,
          content: chunk.content,
        });
      }
    }
  }

  return scoredChunks.sort((a, b) => b.score - a.score).slice(0, 3);
};

const buildDocumentResponse = (prompt, relevantChunks) => {
  if (relevantChunks.length === 0) {
    return `I could not find a matching answer in the uploaded documents for: "${prompt}". Try a more specific question or upload a readable PDF.`;
  }

  const context = relevantChunks
    .map(
      (chunk, index) =>
        `Source ${index + 1} (${chunk.fileName}): ${chunk.content}`,
    )
    .join("\n\n");

  return `Here is the most relevant information I found for "${prompt}":\n\n${context}`;
};

const getMongoRelevantChunks = (documents, prompt) =>
  findRelevantChunks(documents, prompt).map((chunk) => ({
    fileName: chunk.fileName,
    content: chunk.content,
    score: chunk.score,
  }));

const getPineconeRelevantChunks = async (namespace, prompt) => {
  if (!isPineconeConfigured()) {
    return [];
  }

  const [queryEmbedding] = await embedTexts([prompt], "RETRIEVAL_QUERY", "User Query");
  const result = await queryVectors({
    namespace,
    vector: queryEmbedding,
    topK: 5,
  });

  return (result.matches || [])
    .filter((match) => match.metadata?.content)
    .map((match) => ({
      fileName: match.metadata.fileName || "Document",
      content: match.metadata.content,
      score: match.score || 0,
    }));
};

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
  assertGeminiConfigured();

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

  const documents = await Document.find({
    userId,
    sessionId: activeSession._id,
  });
  const namespace = `${userId}:${activeSession._id}`;

  let relevantChunks = await getPineconeRelevantChunks(namespace, prompt);

  if (relevantChunks.length === 0) {
    relevantChunks = getMongoRelevantChunks(documents, prompt);
  }

  const response =
    relevantChunks.length === 0
      ? buildDocumentResponse(prompt, relevantChunks)
      : await generateAnswer({
          question: prompt,
          contextChunks: relevantChunks,
        });

  const chatEntry = await Message.create({
    userId,
    sessionId: activeSession._id,
    query: prompt,
    response,
  });

  return {
    sessionId: activeSession._id,
    title: activeSession.title,
    messageId: chatEntry._id,
    query: chatEntry.query,
    response: chatEntry.response,
    createdAt: chatEntry.createdAt,
    sources: relevantChunks.map((chunk) => ({
      fileName: chunk.fileName,
      preview: chunk.content.slice(0, 220),
    })),
  };
};

module.exports = {
  getHistory,
  queryChat,
};
