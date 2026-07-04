const User = require("../models/user.model");
const Session = require("../models/session.model");
const Document = require("../models/document.model")

const validate_user = async (userId) => {
  if (!userId) {
    throw new Error("userId is required");
  }

  const user = await User.findOne({ userId });

  if (!user) {
    return new Error("user not found");
  }

  return user;
};

const validate_session = async(userId, sessionId)=>{

  if(!sessionId){
    return new Error ("sessionId is required")
  }

  const session = await Session.findOne({_id:sessionId})

  if(!session){
    throw new Error ("session not found")
  }

  if(session.userId !== userId){
    throw new Error ("session in not authorized to this USER")

  }
  return session
}

const extractDocument = async(file)=>{
  if(!file){
    throw new Error ("Document is required")

  }

  return{
    text:"",
    pagecount:0
  }
}

const chunkDocument = async(text) =>{
  if(!text || !text.trim()){
    throw new error ("Document text is empty")
  
  }
  return [];
}

const generateEmbeddings = async(chunks)=>{
  if(!chunks || chunks.length === 0){
    throw new Error ("no chunks availble for embedings")
  }

  return []
}

const storeEmbeddings = async(namespace, embeddings) =>{
    if (!namespace) {
    throw new Error("namespace is required");
  }
    if (!Array.isArray(embeddings) || embeddings.length === 0) {
    throw new Error("No embeddings available to store");
  }

  // TODO:
  // Store embeddings in Pinecone later

  return {
    success: true,
  };
}

const saveDocument = async (payload) =>{

  const {userId, sessionId, fileName, fileType, namespace, pageCount, chunkCount} = payload;

  const document = await Document.create({
    userId, sessionId, fileName, fileType, namespace, pageCount, chunkCount
  })

}

const uploadDocument = async (userId, sessionId, file) =>{
  await  validate_user(userId);
  await  validate_session(sessionId);
  const extracted =  await extractDocument(file);
  const chunk = await chunkDocument(extracted.text);
  const embeddings = await generateEmbeddings(chunk);
  const nameSpace = `${userId}:${sessionId}`;
  await storeEmbeddings(nameSpace, embeddings);
  const document = await saveDocument({
    userId,
    sessionId,
    fileName: file.originalname,
    fileType: file.mimetype,
    namespace,
    pageCount: extracted.pageCount,
    chunkCount: chunks.length,
  })

return document;

}

module.exports = {
  uploadDocument,
};
























































































// const mongoose = require("mongoose");

// const Document = require("../models/document.model");
// const Session = require("../models/session.model");
// const User = require("../models/user.model");

// const uploadDocument = async (payload) => {
//   const { userId, sessionId, fileName, fileType, pineconeNamespace } = payload;

//   if (!userId || !sessionId) {
//     throw new Error("userId and sessionId are required");
//   }

//   if (!mongoose.Types.ObjectId.isValid(sessionId)) {
//     throw new Error("Invalid sessionId");
//   }

//   const existingUser = await User.findById(userId);

//   if (!existingUser) {
//     throw new Error("User not found");
//   }

//   const session = await Session.findById(sessionId);

//   if (!session) {
//     throw new Error("Session not found");
//   }

//   if (session.userId !== userId) {
//     throw new Error("You are not allowed to upload to this session");
//   }

//   const document = await Document.create({
//     userId,
//     sessionId,
//     fileName,
//     fileType,
//     pineconeNamespace,
//   });

//   return document;
// };

// const getDocuments = async (filters = {}) => {
//   const query = {};

//   if (filters.userId) {
//     query.userId = filters.userId;
//   }

//   if (filters.sessionId) {
//     if (!mongoose.Types.ObjectId.isValid(filters.sessionId)) {
//       throw new Error("Invalid sessionId");
//     }

//     query.sessionId = filters.sessionId;
//   }

//   return Document.find(query).sort({ createdAt: -1 });
// };

// module.exports = {
//   uploadDocument,
//   getDocuments,
// };
