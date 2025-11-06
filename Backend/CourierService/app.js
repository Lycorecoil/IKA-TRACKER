require("dotenv").config();
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const mongoose = require("mongoose");

const { errorHandler, identifier, logger } = require("shared-middlewares");
const redisCache = require("shared-middlewares/redisCache");
const { apiLimiter } = require("./src/middlewares/rateLimit");
const agentRoutes = require("./src/routers/agentRoutes");
const adminRoutes = require("./src/routers/adminRoutes");
const internalRoutes = require("./src/routers/internalRoutes");

const app = express();

console.log(
  "🔍 [APP] Chargement de INTERNAL_API_KEY:",
  process.env.INTERNAL_API_KEY?.substring(0, 10) + "..."
);

// ✅ Middlewares de base
app.use(cors());
app.use(helmet());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ✅ Rate limiting global
app.use("/api/", (req, res, next) => {
  if (req.path.startsWith("/internal")) {
    return next();
  }
  apiLimiter(req, res, next);
});

// ✅ Connexion base de données
if (process.env.NODE_ENV !== "test") {
  mongoose
    .connect(process.env.MONGODB_URI)
    .then(() => {
      logger.info("✅ Connected to COURIER MongoDB");
    })
    .catch((err) => {
      logger.error("❌ Failed to connect to MongoDB", { error: err.message });
    });
}

// ✅ Route santé (publique)
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    service: "courier-service",
    timestamp: new Date().toISOString(),
  });
});

// ✅ Route de bienvenue (publique)
app.get("/", (req, res) => {
  res.json({ message: "Courier Service API - Gestion des coursiers" });
});

// 🔐 Routes INTERNES (protégées par clé API)
console.log("🔐 [APP] Montage des routes internes sur /api/internal");
app.use("/api/internal", internalRoutes);

// ✅ Routes protégées par JWT avec CACHE
app.use("/api/agents", identifier, redisCache(300), agentRoutes); // ← CACHE
app.use("/api/admin", identifier, adminRoutes);

// ✅ Gestion des erreurs d'authentification JWT
app.use((err, req, res, next) => {
  if (err.name === "UnauthorizedError") {
    logger.warn("Tentative d'accès non autorisé", {
      path: req.path,
      method: req.method,
      ip: req.ip,
      message: err.message,
    });
    return res
      .status(401)
      .json({ success: false, message: "Accès non autorisé" });
  }
  next(err);
});

// ✅ Error handler global
app.use(errorHandler);

console.log("✅ [APP] Routes configurées:");
console.log("   - /api/internal/* (API Key protected)");
console.log("   - /api/agents/* (JWT + Redis Cache)");
console.log("   - /api/admin/* (JWT protected)");

module.exports = app;
