const express = require ("express");
const cors = require ("cors");
const documentRouter = require("./src/routes/document.route.js")
const chatRouter = require("./src/routes/chat.route")
const authRouter = require("./src/routes/auth.route")


const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({extended:true}))


app.use("/api/document", documentRouter);
app.use("/api/chat", chatRouter)
app.use("/api/auth", authRouter)

module.exports = app;
