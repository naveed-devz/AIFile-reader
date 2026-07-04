const documentService = require("../services/document.service");

const uploadDocument = async (req, res) => {
  try {
    const document = await documentService.uploadDocument({
      userId: req.user.id,
      sessionId: req.body.sessionId,
      file: req.file,
    });

    return res.status(201).json({
      success: true,
      message: "Document uploaded successfully",
      data: document,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const getDocuments = async (req, res) => {
  try {
    const documents = await documentService.getDocuments({
      ...req.query,
      userId: req.user.id,
    });

    return res.status(200).json({
      success: true,
      count: documents.length,
      data: documents,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  uploadDocument,
  getDocuments,
};
