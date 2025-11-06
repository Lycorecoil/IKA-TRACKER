const User = require("../models/usersModel");
const { logger } = require("shared-middlewares");

// ✅ NOUVEAU MIDDLEWARE
const checkSubscription = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId);

    // Les admins ont toujours accès
    if (user.role === "admin") {
      return next();
    }

    // Les users doivent avoir un abonnement actif
    if (user.role === "user" && user.subscriptionStatus !== "active") {
      logger.warn("Tentative d'accès sans abonnement actif", {
        userId: user._id,
        email: user.email,
        subscriptionStatus: user.subscriptionStatus,
      });

      return res.status(403).json({
        success: false,
        message: "Abonnement requis pour accéder à cette fonctionnalité",
      });
    }

    // Les agents - leur accès est géré dans courier-service
    // car c'est là qu'on sait à quel user ils sont rattachés
    next();
  } catch (error) {
    logger.error("Erreur vérification abonnement", {
      userId: req.user?.userId,
      error: error.message,
    });
    return res.status(500).json({
      success: false,
      message: "Erreur de vérification d'abonnement",
    });
  }
};

module.exports = { checkSubscription };
