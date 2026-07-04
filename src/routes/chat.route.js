const express = require("express");
const chatRouter = express.Router();
const chatController = require("../controllers/chat.controller");
const { requireAuth } = require("../middlewares/auth.middleware");

chatRouter.get("/history/:sessionId", requireAuth, chatController.getHistory);
chatRouter.post("/query", requireAuth, chatController.queryChat);



module.exports = chatRouter;
