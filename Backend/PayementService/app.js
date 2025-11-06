require("dotenv").config();
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const mongoose = require("mongoose");
const { errorHandler, identifier, logger } = require("shared-middlewares");
const rawBody = require("./src/middlewares/rawBody");

const subscriptionRoutes = require("./src/routers/subscriptionRoutes");
const paymentRoutes = require("./src/routers/paymentRoutes");
const webhookController = require("./src/controllers/webhookController");

const app = express();

// ✅ Middlewares globaux
app.use(cors());
app.use(helmet());

// ✅ IMPORTANT: Webhook AVANT express.json() avec rawBody
app.post(
  "/api/payments/webhook",
  express.raw({ type: "application/json" }),
  webhookController.handleStripeWebhook
);

// ✅ Ensuite JSON parser pour les autres routes
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ✅ Connexion MongoDB
if (process.env.NODE_ENV !== "test") {
  mongoose
    .connect(process.env.MONGODB_URI)
    .then(() => logger.info("✅ Connected to PAYMENT MongoDB"))
    .catch((err) =>
      logger.error("❌ Failed to connect to MongoDB", { error: err.message })
    );
}

// ✅ Routes publiques
app.get("/health", (req, res) =>
  res.json({
    status: "OK",
    service: "payment-service",
    timestamp: new Date().toISOString(),
  })
);

app.get("/", (req, res) =>
  res.json({ message: "Payment Service API", version: "1.0.0" })
);

// ✅ Routes protégées avec JWT
app.use("/api/subscriptions", identifier, subscriptionRoutes);
app.use("/api/payments", identifier, paymentRoutes);

// ✅ Gestion erreurs auth
app.use((err, req, res, next) => {
  if (err.name === "UnauthorizedError") {
    logger.warn("Tentative d'accès non autorisé", {
      path: req.path,
      method: req.method,
      ip: req.ip,
    });
    return res
      .status(401)
      .json({ success: false, message: "Accès non autorisé" });
  }
  next(err);
});

// ✅ Error handler global
app.use(errorHandler);

module.exports = app;
