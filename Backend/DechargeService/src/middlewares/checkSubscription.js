const { logger, createServiceClient } = require("shared-middlewares");

const authClient = createServiceClient("auth");

const checkSubscriptionForColis = async (req, res, next) => {
  try {
    const { role, userId } = req.user;

    console.log("🔍 [CHECK_SUB] Role:", role, "ID:", userId);

    // ✅ ADMIN : accès complet
    if (role === "admin") {
      console.log("✅ [CHECK_SUB] Admin - accès complet");
      return next();
    }

    // ✅ AGENT : pas de vérification d'abonnement
    // L'agent suit juste son employeur
    if (role === "agent") {
      console.log("✅ [CHECK_SUB] Agent - accès autorisé");
      return next();
    }

    // ✅ USER : doit avoir abonnement ACTIF
    if (role === "user") {
      try {
        console.log("👤 [CHECK_SUB] Vérification user...");

        const userResponse = await authClient.get(
          `/api/internal/users/${userId}`
        );

        if (!userResponse.success) {
          return res.status(500).json({
            success: false,
            message: "Erreur vérification abonnement",
          });
        }

        const user = userResponse.data;

        // Pour POST/PUT/DELETE: abonnement REQUIS
        if (
          req.method === "POST" ||
          req.method === "PUT" ||
          req.method === "DELETE"
        ) {
          if (user.subscriptionStatus !== "active") {
            console.log("❌ [CHECK_SUB] User sans abonnement");
            logger.warn("User bloqué - pas d'abonnement", {
              userId,
              subscriptionStatus: user.subscriptionStatus,
              method: req.method,
            });

            return res.status(403).json({
              success: false,
              message:
                "Vous devez avoir un abonnement actif pour gérer des colis.",
              needsSubscription: true,
              subscriptionStatus: user.subscriptionStatus,
            });
          }
        }

        console.log("✅ [CHECK_SUB] User avec abonnement");
        req.user.hasActiveSubscription = true;
        return next();
      } catch (error) {
        console.error("❌ [CHECK_SUB] Erreur user:", error.message);
        logger.error("Erreur vérification abonnement user", {
          userId,
          error: error.message,
        });

        return res.status(500).json({
          success: false,
          message: "Erreur vérification abonnement",
        });
      }
    }

    return next();
  } catch (error) {
    console.error("💥 [CHECK_SUB] Erreur middleware:", error.message);
    logger.error("Erreur middleware checkSubscription", {
      userId: req.user?.userId,
      error: error.message,
    });

    return res.status(500).json({
      success: false,
      message: "Erreur interne",
    });
  }
};

module.exports = { checkSubscriptionForColis };
