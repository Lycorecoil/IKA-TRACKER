require("dotenv").config();
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const mongoose = require("mongoose");

const { logger, errorHandler } = require("shared-middlewares");
const redisCache = require("shared-middlewares/redisCache");

const authRouter = require("./src/routers/authRouter.js");
const adminRouter = require("./src/routers/adminRouter.js");
const internalRoutes = require("./src/routers/internalRoutes");

const app = express();

// ========================
// 🔒 Gestion globale des erreurs Node.js
// ========================
process.on("uncaughtException", (error) => {
  logger.error("Erreur non gérée interceptée", error);
});

process.on("unhandledRejection", (error) => {
  logger.error("Erreur serveur interne", error);
});

// ========================
// 🧩 Middlewares de base
// ========================
app.use(cors());
app.use(helmet());
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

// ========================
// 🗄️ Connexion à MongoDB
// ========================
if (process.env.NODE_ENV !== "test") {
  mongoose
    .connect(process.env.MONGO_URI)
    .then(() => {
      console.log("✅ Connected to AUTH MongoDB");
    })
    .catch((err) => {
      logger.error("❌ Erreur connexion MongoDB", err);
    });
}

// ========================
// ✅ HEALTH CHECK
// ========================
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    service: "auth-service",
    timestamp: new Date().toISOString(),
  });
});

// ========================
// 🚀 Définition des routes
// ========================
app.use("/api/internal", internalRoutes);
app.use("/api/auth", redisCache(300), authRouter); // ← CACHE
app.use("/api/admin", adminRouter);

// Route de test
app.get("/", (req, res) => {
  res.json({ message: "Hello from Auth Service 👋" });
});

// ========================
// 🧱 Middleware global d'erreurs Express
// ========================
app.use(errorHandler);

// Export de l'app (sans listen)
module.exports = app;
