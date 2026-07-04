const express = require("express");

const authController = require("../controllers/auth.controller");
const { requireAuth } = require("../middlewares/auth.middleware");

const authRouter = express.Router();

authRouter.post("/register", authController.register);
authRouter.post("/login", authController.login);
authRouter.get("/me", requireAuth, authController.me);

module.exports = authRouter;
