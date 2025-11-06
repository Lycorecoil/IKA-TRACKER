const { logger } = require("./logger");

const errorHandler = (err, req, res, next) => {
  // 🔥 Log complet pour le débogage en console (à retirer en production)
  console.error("🔥 ERREUR SERVEUR :", err);

  // ✅ Log détaillé et structuré
  logger.error("Erreur non gérée interceptée", err);

  logger.error("Erreur serveur interne", {
    url: req.url,
    method: req.method,
    userId: req.user?.userId,
    userRole: req.user?.role,
    errorName: err.name,
    errorMessage: err.message,
    errorStack: err.stack,
    body: req.body,
  });

  // ⚠️ Erreurs de validation Mongoose
  if (err.name === "ValidationError") {
    const details = Object.values(err.errors).map((e) => e.message);

    logger.warn("Erreur validation données", {
      userId: req.user?.userId,
      errors: details,
    });

    return res.status(400).json({
      success: false,
      message: "Données invalides",
      errors: details,
    });
  }

  // ⚠️ Erreur de duplication (clé unique)
  if (err.code === 11000) {
    logger.warn("Tentative de doublon détectée", {
      userId: req.user?.userId,
      collection: err.keyValue,
    });

    return res.status(409).json({
      success: false,
      message: "Doublon détecté",
    });
  }

  // ⚠️ Erreur d'identifiant invalide (ObjectId)
  if (err.name === "CastError") {
    logger.warn("ID invalide fourni", {
      userId: req.user?.userId,
      providedId: err.value,
    });

    return res.status(400).json({
      success: false,
      message: "ID invalide",
    });
  }

  // ⚙️ Réponse par défaut
  res.status(500).json({
    success: false,
    message: "Erreur interne du serveur",
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
};

module.exports = errorHandler;
