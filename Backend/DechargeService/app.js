require("dotenv").config();
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const mongoose = require("mongoose");

const { errorHandler, identifier, logger } = require("shared-middlewares");
const redisCache = require("shared-middlewares/redisCache");
const { apiLimiter } = require("./src/middlewares/rateLimit");

const colisRoutes = require("./src/routers/colisRoutes");
const dechargeRoutes = require("./src/routers/dechargeRoutes");
const adminRoutes = require("./src/routers/adminRoutes");

const app = express();

// ✅ Middlewares de base
app.use(cors());
app.use(helmet());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ✅ Rate limiting global
app.use("/api/", apiLimiter);

// ✅ Connexion base de données
if (process.env.NODE_ENV !== "test") {
  mongoose
    .connect(process.env.MONGODB_URI)
    .then(() => {
      logger.info("✅ Connected to DECHARGE MongoDB");
    })
    .catch((err) => {
      logger.error("❌ Failed to connect to MongoDB", { error: err.message });
    });
}

// ✅ Routes publiques
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    service: "decharge-service",
    timestamp: new Date().toISOString(),
  });
});

app.get("/", (req, res) => {
  res.json({
    message: "Decharge Service API - Gestion des colis et décharges",
  });
});

// ✅ Routes protégées (authentifiées) avec CACHE
app.use("/api/colis", identifier, redisCache(300), colisRoutes); // ← CACHE
app.use("/api/decharges", identifier, redisCache(300), dechargeRoutes); // ← CACHE
app.use("/api/admin", identifier, adminRoutes);

// ✅ Gestion uniforme des erreurs d'authentification
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
console.log("   - /api/colis/* (JWT + Redis Cache)");
console.log("   - /api/decharges/* (JWT + Redis Cache)");
console.log("   - /api/admin/* (JWT protected)");

module.exports = app;
