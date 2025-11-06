require("dotenv").config();
const app = require("./app");
const { logger } = require("shared-middlewares");

const PORT = process.env.PORT || 8000;

// ========================
// 🖥️ Lancement du serveur
// ========================
if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => {
    console.log(`\n🚀 Auth Service running on port ${PORT}`);
    console.log(`✅ Health: http://localhost:${PORT}/health`);
    console.log(`📝 API: http://localhost:${PORT}/api/auth\n`);
    logger.info(`🚀 Auth Service started on port ${PORT}`);
  });
}

module.exports = app;
