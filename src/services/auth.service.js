const User = require("../models/user.model");
const {
  hashPassword,
  verifyPassword,
  generateToken,
} = require("../utils/auth.util");

const sanitizeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

const registerUser = async (payload) => {
  const { name, email, password } = payload;

  if (!email || !password) {
    throw new Error("email and password are required");
  }

  if (password.length < 6) {
    throw new Error("Password must be at least 6 characters long");
  }

  const normalizedEmail = email.toLowerCase().trim();
  const existingUser = await User.findOne({ email: normalizedEmail });

  if (existingUser) {
    throw new Error("User already exists with this email");
  }

  const user = await User.create({
    name: name ? name.trim() : "User",
    email: normalizedEmail,
    password: await hashPassword(password),
  });

  const token = generateToken({
    id: user._id.toString(),
    email: user.email,
  });

  return {
    user: sanitizeUser(user),
    token,
  };
};

const loginUser = async (payload) => {
  const { email, password } = payload;

  if (!email || !password) {
    throw new Error("email and password are required");
  }

  const normalizedEmail = email.toLowerCase().trim();
  const user = await User.findOne({ email: normalizedEmail });

  if (!user) {
    throw new Error("Invalid email or password");
  }

  const isPasswordValid = await verifyPassword(password, user.password);

  if (!isPasswordValid) {
    throw new Error("Invalid email or password");
  }

  const token = generateToken({
    id: user._id.toString(),
    email: user.email,
  });

  return {
    user: sanitizeUser(user),
    token,
  };
};

const getCurrentUser = async (userId) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new Error("User not found");
  }

  return sanitizeUser(user);
};

module.exports = {
  registerUser,
  loginUser,
  getCurrentUser,
};
