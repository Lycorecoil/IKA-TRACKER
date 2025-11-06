const { logger, createServiceClient } = require("shared-middlewares");

const authClient = createServiceClient("auth");

// ✅ Vérifier que l'employeur du user a un abonnement actif
const checkEmployerSubscription = async (req, res, next) => {
  try {
    const { role, userId } = req.user;

    // Admin: toujours accès
    if (role === "admin") {
      return next();
    }

    // User: toujours accès à l'interface (mais fonctionnalités limitées)
    if (role === "user") {
      return next();
    }

    // Agent: vérifier l'abonnement de son employeur
    if (role === "agent") {
      // Récupérer l'agent pour trouver son employeur
      const Agent = require("../models/agentModel");
      const agent = await Agent.findById(userId);

      if (!agent) {
        return res.status(404).json({
          success: false,
          message: "Agent non trouvé",
        });
      }

      // Vérifier le statut d'abonnement de l'employeur
      try {
        const employerResponse = await authClient.get(
          `/api/internal/users/${agent.userId}`
        );

        if (
          !employerResponse.success ||
          employerResponse.data.subscriptionStatus !== "active"
        ) {
          logger.warn("Agent bloqué - Employeur sans abonnement actif", {
            agentId: userId,
            employerId: agent.userId,
          });

          return res.status(403).json({
            success: false,
            message:
              "Accès refusé. Votre employeur doit avoir un abonnement actif.",
            needsSubscription: true,
          });
        }

        // Abonnement actif, on continue
        return next();
      } catch (error) {
        logger.error("Erreur vérification abonnement employeur", {
          agentId: userId,
          error: error.message,
        });

        // En cas d'erreur, on laisse passer (mode dégradé)
        return next();
      }
    }

    return next();
  } catch (error) {
    logger.error("Erreur middleware checkEmployerSubscription", {
      error: error.message,
    });
    return next();
  }
};

module.exports = checkEmployerSubscription;
