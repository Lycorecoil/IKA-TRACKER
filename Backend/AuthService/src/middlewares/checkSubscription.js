const { logger } = require("shared-middlewares");

// ✅ Middleware pour vérifier que le User a un abonnement actif
const checkSubscription = (req, res, next) => {
  const { role, subscriptionStatus } = req.user;

  // Admin: accès complet toujours
  if (role === "admin") {
    return next();
  }

  // User: accès toujours (mais fonctionnalités limitées si pas d'abonnement)
  if (role === "user") {
    return next();
  }

  // Agent: accès SEULEMENT si son employeur (user) a un abonnement actif
  if (role === "agent") {
    // On doit vérifier le statut d'abonnement de l'employeur
    // Pour l'instant, on laisse passer et on vérifie côté CourierService
    return next();
  }

  return res.status(403).json({
    success: false,
    message: "Accès refusé",
  });
};

module.exports = checkSubscription;
