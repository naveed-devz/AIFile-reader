const mongoose = require("mongoose");
const { PDFParse } = require("pdf-parse");

const User = require("../models/user.model");
const Session = require("../models/session.model");
const Document = require("../models/document.model");

const normalizeText = (text = "") => text.replace(/\s+/g, " ").trim();

const chunkText = (text) => {
  const normalizedText = normalizeText(text);

  if (!normalizedText) {
    return [];
  }

  const words = normalizedText.split(" ");
  const chunkSize = 180;
  const overlap = 30;
  const chunks = [];

  for (let start = 0; start < words.length; start += chunkSize - overlap) {
    const content = words.slice(start, start + chunkSize).join(" ").trim();

    if (!content) {
      continue;
    }

    chunks.push({
      index: chunks.length,
      content,
    });

    if (start + chunkSize >= words.length) {
      break;
    }
  }

  return chunks;
};

const extractDocument = async (file) => {
  if (file.mimetype === "application/pdf") {
    const parser = new PDFParse({ data: file.buffer });
    const parsedPdf = await parser.getText();
    await parser.destroy();

    return {
      text: normalizeText(parsedPdf.text),
      pageCount: parsedPdf.total || 0,
    };
  }

  if (
    file.mimetype ===
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    throw new Error(
      "DOCX querying is not enabled yet. PDF querying works now, and DOCX needs a parser package.",
    );
  }

  throw new Error("Unsupported document type");
};

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

  if (!file.buffer || file.buffer.length === 0) {
    throw new Error("Uploaded file is empty");
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
    extractedText,
    chunks,
    pageCount,
    chunkCount,
  } = payload;

  const document = await Document.create({
    userId,
    sessionId,
    fileName,
    fileType,
    pineconeNamespace,
    extractedText,
    chunks,
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

  const extractedDocument = await extractDocument(file);
  const chunks = chunkText(extractedDocument.text);

  if (chunks.length === 0) {
    throw new Error("No readable text was found in this document");
  }

  const pineconeNamespace = `${userId}:${sessionId}`;

  const document = await saveDocument({
    userId,
    sessionId,
    fileName: file.originalname,
    fileType: file.mimetype,
    pineconeNamespace,
    extractedText: extractedDocument.text,
    chunks,
    pageCount: extractedDocument.pageCount,
    chunkCount: chunks.length,
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

  return Document.find(query)
    .select("-extractedText -chunks")
    .sort({ createdAt: -1 });
};

module.exports = {
  uploadDocument,
  getDocuments,
  chunkText,
};
