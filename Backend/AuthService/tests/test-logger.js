// tests/test-logger.js
const logger = require("../../shared/middlewares/logger");

console.log("🧪 Test du logger shared...");

logger.info("Test info message", { test: "data" });
logger.warn("Test warn message");
logger.error("Test error message", new Error("Test error"));
logger.adminAction("admin123", "CREATE_USER", "user456");

console.log("✅ Logger shared fonctionne !");
