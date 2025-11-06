const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();

router.get("/", async (req, res) => {
  try {
    // Vérifier la connexion MongoDB
    const dbStatus =
      mongoose.connection.readyState === 1 ? "connected" : "disconnected";

    const healthInfo = {
      status: "OK",
      service: "auth-service",
      timestamp: new Date().toISOString(),
      database: dbStatus,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      environment: process.env.NODE_ENV || "development",
    };

    res.status(200).json(healthInfo);
  } catch (error) {
    res.status(503).json({
      status: "ERROR",
      service: "auth-service",
      timestamp: new Date().toISOString(),
      error: error.message,
    });
  }
});

// Health check détaillé pour les load balancers
router.get("/liveness", (req, res) => {
  res.status(200).json({ status: "OK", timestamp: new Date().toISOString() });
});

router.get("/readiness", async (req, res) => {
  const dbReady = mongoose.connection.readyState === 1;

  if (dbReady) {
    res.status(200).json({
      status: "OK",
      database: "connected",
      timestamp: new Date().toISOString(),
    });
  } else {
    res.status(503).json({
      status: "ERROR",
      database: "disconnected",
      timestamp: new Date().toISOString(),
    });
  }
});

module.exports = router;
