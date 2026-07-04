const crypto = require("crypto");

const TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const AUTH_SECRET = process.env.AUTH_SECRET || "dev-secret-change-me";

const toBase64Url = (value) =>
  Buffer.from(value)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");

const fromBase64Url = (value) => {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padding = normalized.length % 4;
  const padded = padding ? normalized + "=".repeat(4 - padding) : normalized;

  return Buffer.from(padded, "base64").toString("utf8");
};

const hashPassword = async (password) =>
  new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString("hex");

    crypto.scrypt(password, salt, 64, (error, derivedKey) => {
      if (error) {
        return reject(error);
      }

      return resolve(`${salt}:${derivedKey.toString("hex")}`);
    });
  });

const verifyPassword = async (password, passwordHash) =>
  new Promise((resolve, reject) => {
    const [salt, key] = (passwordHash || "").split(":");

    if (!salt || !key) {
      return resolve(false);
    }

    crypto.scrypt(password, salt, 64, (error, derivedKey) => {
      if (error) {
        return reject(error);
      }

      const storedKeyBuffer = Buffer.from(key, "hex");

      if (storedKeyBuffer.length !== derivedKey.length) {
        return resolve(false);
      }

      return resolve(
        crypto.timingSafeEqual(storedKeyBuffer, derivedKey),
      );
    });
  });

const generateToken = (payload) => {
  const tokenPayload = {
    ...payload,
    exp: Date.now() + TOKEN_TTL_MS,
  };

  const encodedPayload = toBase64Url(JSON.stringify(tokenPayload));
  const signature = crypto
    .createHmac("sha256", AUTH_SECRET)
    .update(encodedPayload)
    .digest("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");

  return `${encodedPayload}.${signature}`;
};

const verifyToken = (token) => {
  const [encodedPayload, signature] = (token || "").split(".");

  if (!encodedPayload || !signature) {
    throw new Error("Invalid token");
  }

  const expectedSignature = crypto
    .createHmac("sha256", AUTH_SECRET)
    .update(encodedPayload)
    .digest("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");

  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (
    signatureBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(signatureBuffer, expectedBuffer)
  ) {
    throw new Error("Invalid token signature");
  }

  const payload = JSON.parse(fromBase64Url(encodedPayload));

  if (!payload.exp || payload.exp < Date.now()) {
    throw new Error("Token expired");
  }

  return payload;
};

module.exports = {
  hashPassword,
  verifyPassword,
  generateToken,
  verifyToken,
};
