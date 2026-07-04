const express = require("express");
const documentRouter = express.Router();
const documentController = require("../controllers/document.controller");
const { requireAuth } = require("../middlewares/auth.middleware");

documentRouter.post("/upload", requireAuth, documentController.uploadDocument);
documentRouter.get("/", requireAuth, documentController.getDocuments);



module.exports = documentRouter;
