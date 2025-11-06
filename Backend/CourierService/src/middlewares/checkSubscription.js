const { logger, createServiceClient } = require("shared-middlewares");

const authClient = createServiceClient("auth");

// ✅ Vérifier que l'employeur (User) a un abonnement actif
const checkSubscription = async (req, res, next) => {
  try {
    const { role, userId } = req.user;

    console.log("🔍 [CHECK_SUB] Vérification - User:", userId, "Role:", role);

    // Admin: toujours accès
    if (role === "admin") {
      console.log("✅ [CHECK_SUB] Admin - Accès complet");
      return next();
    }

    // User (employeur): vérifier son abonnement
    if (role === "user") {
      try {
        const userResponse = await authClient.get(
          `/api/internal/users/${userId}`
        );

        if (!userResponse.success) {
          console.log("❌ [CHECK_SUB] Erreur récupération user");
          return res.status(500).json({
            success: false,
            message: "Erreur vérification abonnement",
          });
        }

        const user = userResponse.data;
        console.log(
          "📊 [CHECK_SUB] User subscription:",
          user.subscriptionStatus
        );

        // User DOIT avoir abonnement pour gérer les agents
        if (user.subscriptionStatus !== "active") {
          logger.warn("User bloqué - Pas d'abonnement", {
            userId,
            subscriptionStatus: user.subscriptionStatus,
          });

          return res.status(403).json({
            success: false,
            message:
              "Vous devez avoir un abonnement actif pour gérer des agents.",
            needsSubscription: true,
            subscriptionStatus: user.subscriptionStatus,
          });
        }

        console.log("✅ [CHECK_SUB] User avec abonnement actif");
        req.user.hasActiveSubscription = true;
        return next();
      } catch (error) {
        console.error("⚠️ [CHECK_SUB] Erreur AuthService:", error.message);
        logger.warn("Erreur vérification abonnement", {
          userId,
          error: error.message,
        });

        return res.status(500).json({
          success: false,
          message: "Erreur vérification abonnement",
        });
      }
    }

    // Agent: vérifier que l'employeur a un abonnement
    if (role === "agent") {
      try {
        const Agent = require("../models/agentModel");
        const agent = await Agent.findById(userId);

        if (!agent) {
          console.log("❌ [CHECK_SUB] Agent non trouvé");
          return res.status(404).json({
            success: false,
            message: "Agent non trouvé",
          });
        }

        console.log(
          "🔍 [CHECK_SUB] Agent trouvé - Employeur ID:",
          agent.userId
        );

        // Vérifier que l'employeur a un abonnement ACTIF
        const employerResponse = await authClient.get(
          `/api/internal/users/${agent.userId}`
        );

        if (!employerResponse.success) {
          console.log("❌ [CHECK_SUB] Employeur non trouvé");
          return res.status(404).json({
            success: false,
            message: "Employeur non trouvé",
          });
        }

        const employer = employerResponse.data;
        console.log(
          "📊 [CHECK_SUB] Employeur subscription:",
          employer.subscriptionStatus
        );

        // Si employeur n'a pas abonnement = agent bloqué
        if (employer.subscriptionStatus !== "active") {
          logger.warn("Agent bloqué - Employeur sans abonnement", {
            agentId: userId,
            employerId: agent.userId,
            subscriptionStatus: employer.subscriptionStatus,
          });

          return res.status(403).json({
            success: false,
            message:
              "Accès refusé. Votre employeur n'a pas d'abonnement actif.",
            needsSubscription: true,
            employerSubscriptionStatus: employer.subscriptionStatus,
          });
        }

        console.log("✅ [CHECK_SUB] Agent autorisé - Employeur a abonnement");
        req.user.hasActiveSubscription = true;
        req.user.employerId = agent.userId;

        return next();
      } catch (error) {
        console.error(
          "⚠️ [CHECK_SUB] Erreur vérification agent:",
          error.message
        );
        logger.error("Erreur vérification abonnement agent", {
          agentId: userId,
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
    console.error("💥 [CHECK_SUB] Erreur middleware:", error);
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

module.exports = { checkSubscription };
