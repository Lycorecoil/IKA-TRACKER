const { logger } = require("shared-middlewares");

const internalAuth = (req, res, next) => {
  const apiKey = req.headers["x-internal-api-key"];
  console.log("🔑 [COURIER AUTH] Clé API reçue:", apiKey);
  console.log(
    "🔑 [COURIER AUTH] Clé API attendue:",
    process.env.INTERNAL_API_KEY
  );

  if (!apiKey || apiKey !== process.env.INTERNAL_API_KEY) {
    logger.warn("Tentative d'accès interne non autorisée", {
      ip: req.ip,
      url: req.url,
      providedKey: apiKey ? `${apiKey.substring(0, 5)}...` : "none",
    });
    return res.status(401).json({
      success: false,
      message: "Accès inter-service non autorisé",
    });
  }

  next();
};

module.exports = { internalAuth };
