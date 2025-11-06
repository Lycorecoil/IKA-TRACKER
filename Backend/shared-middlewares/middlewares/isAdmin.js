const { logger } = require("./logger");

function isAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Authentification requise",
    });
  }

  if (req.user.role !== "admin") {
    // ✅ LOG: Tentative d'accès non autorisé
    logger.warn("Tentative d'accès admin refusée", {
      userId: req.user._id,
      userRole: req.user.role,
      path: req.path,
      method: req.method,
    });

    return res.status(403).json({
      success: false,
      message: "Accès réservé à l'administrateur",
    });
  }

  logger.info("Accès admin autorisé", {
    userId: req.user._id,
    path: req.path,
  });

  next();
}
module.exports = { isAdmin };
