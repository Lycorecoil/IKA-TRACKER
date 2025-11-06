// middlewares/rateLimit.js
const rateLimit = require("express-rate-limit");

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // 5 tentatives max
  message: {
    success: false,
    message: "Trop de tentatives, réessayez dans 15 minutes",
  },
});
const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requêtes max - assez large
  message: {
    success: false,
    message: "Trop de requêtes administrateur, réessayez dans 15 minutes",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  authLimiter,
  adminLimiter,
};
