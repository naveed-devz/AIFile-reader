const dotenv = require("dotenv");

dotenv.config();

const app = require("./app.js");
const connectDB = require("./src/config/db.config.js");

const PORT = process.env.PORT || 5000;
connectDB();


app.listen(PORT, ()=>{
    console.log(`server running at ${PORT}`)
})
