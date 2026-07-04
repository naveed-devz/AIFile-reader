const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      unique: true,
      required: true,
    },
  },
  { timestamps: true },
);


module.exports = mongoose.model("user", userSchema)