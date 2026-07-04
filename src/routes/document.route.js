const express = require("express");
const documentRouter = express.Router();
const documentController = require("../controllers/document.controller");
const { requireAuth } = require("../middlewares/auth.middleware");
const { upload } = require("../middlewares/upload.middleware");

documentRouter.post(
  "/upload",
  requireAuth,
  upload.single("file"),
  documentController.uploadDocument,
);
documentRouter.get("/", requireAuth, documentController.getDocuments);



module.exports = documentRouter;
