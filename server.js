const app = require("./app.js")
const dotenv = require("dotenv");
const connectDB = require("./src/config/db.config.js")

dotenv.config();

const PORT = process.env.PORT || 5000
connectDB()


app.listen(PORT, ()=>{
    console.log(`server running at ${PORT}`)
})

