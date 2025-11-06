// const Agent = require("../models/agentModel"); // ✅ Seulement Agent
// const { logger } = require("shared-middlewares");

// // Dashboard admin - Statistiques AGENTS UNIQUEMENT
// exports.getDashboard = async (req, res) => {
//   try {
//     const stats = await Promise.all([
//       Agent.countDocuments(),
//       Agent.countDocuments({ actif: true }),
//       Agent.countDocuments({ actif: false }),
//       Agent.countDocuments({ disponible: true }),
//     ]);

//     const dashboard = {
//       totalAgents: stats[0],
//       agentsActifs: stats[1],
//       agentsInactifs: stats[2],
//       agentsDisponibles: stats[3],
//       tauxActivation:
//         stats[0] > 0 ? ((stats[1] / stats[0]) * 100).toFixed(2) : 0,
//     };

//     logger.info("Consultation dashboard agents admin", {
//       adminId: req.user.userId,
//     });

//     return res.status(200).json({
//       success: true,
//       data: dashboard,
//     });
//   } catch (error) {
//     logger.error("Erreur récupération dashboard admin", {
//       adminId: req.user.userId,
//       errorMessage: error.message,
//     });
//     return res.status(500).json({
//       success: false,
//       message: "Erreur lors de la récupération des statistiques agents",
//     });
//   }
// };

// // Désactiver un agent (ADMIN) - VERSION CORRECTE
// exports.deleteAgent = async (req, res) => {
//   try {
//     const { id } = req.params;

//     const agent = await Agent.findById(id);
//     if (!agent) {
//       return res.status(404).json({
//         success: false,
//         message: "Agent non trouvé",
//       });
//     }

//     // Désactiver l'agent
//     agent.actif = false;
//     agent.disponible = false;
//     agent.email = `deleted_${Date.now()}_${agent.email}`;
//     await agent.save();

//     // ✅ OPTION 1: Appeler decharge-service pour libérer les colis
//     try {
//       await fetch(
//         `${process.env.DECHARGE_SERVICE_URL}/api/colis/unassign-agent`,
//         {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//             "X-Internal-API-Key": process.env.INTERNAL_API_KEY,
//           },
//           body: JSON.stringify({ agentId: id }),
//         }
//       );
//     } catch (error) {
//       console.log("⚠️ Decharge-service non disponible");
//     }

//     logger.info("Agent désactivé par admin", {
//       adminId: req.user.userId,
//       agentId: id,
//     });

//     return res.status(200).json({
//       success: true,
//       message: "Agent désactivé avec succès",
//       data: agent,
//     });
//   } catch (error) {
//     logger.error("Erreur désactivation agent", {
//       adminId: req.user.userId,
//       agentId: req.params.id,
//       errorMessage: error.message,
//     });
//     return res.status(500).json({
//       success: false,
//       message: "Erreur lors de la désactivation de l'agent",
//     });
//   }
// };

// // Cascade de suppression pour un user - VERSION CORRECTE
// exports.cascadeDeleteUser = async (req, res) => {
//   try {
//     const { userId } = req.params;

//     // ✅ SEULEMENT les agents (colis gérés par decharge-service)
//     const agentsResult = await Agent.updateMany(
//       { userId: userId },
//       {
//         actif: false,
//         disponible: false,
//         email: `deleted_agent_${Date.now()}@deleted.com`,
//       }
//     );

//     logger.info("Cascade deletion agents effectuée", {
//       userId,
//       agentsDesactives: agentsResult.modifiedCount,
//     });

//     return res.status(200).json({
//       success: true,
//       data: {
//         agentsDesactives: agentsResult.modifiedCount,
//       },
//     });
//   } catch (error) {
//     logger.error("Erreur cascade deletion agents", {
//       userId: req.params.userId,
//       errorMessage: error.message,
//     });
//     return res.status(500).json({
//       success: false,
//       message: "Erreur lors de la cascade de suppression des agents",
//     });
//   }
// };

// // 🗑️ SUPPRIMER ces fonctions qui utilisent Colis/Decharge :
// // - getAllColis()
// // - getColisById()
// // - deleteColis()
// // - getAllDecharges()
// // - getDechargeById()
// // → Elles appartiennent à decharge-service maintenant !
const Agent = require("../models/agentModel");
const { logger, createServiceClient } = require("shared-middlewares");

// ✅ Initialiser le client Decharge une seule fois
const dechargeClient = createServiceClient("decharge");

// ==================== DASHBOARD ADMIN - STATISTIQUES AGENTS ====================
exports.getDashboard = async (req, res) => {
  try {
    const stats = await Promise.all([
      Agent.countDocuments(),
      Agent.countDocuments({ actif: true }),
      Agent.countDocuments({ actif: false }),
      Agent.countDocuments({ disponible: true }),
    ]);

    const dashboard = {
      totalAgents: stats[0],
      agentsActifs: stats[1],
      agentsInactifs: stats[2],
      agentsDisponibles: stats[3],
      tauxActivation:
        stats[0] > 0 ? ((stats[1] / stats[0]) * 100).toFixed(2) : 0,
    };

    logger.info("Consultation dashboard agents admin", {
      adminId: req.user.userId,
    });

    return res.status(200).json({
      success: true,
      data: dashboard,
    });
  } catch (error) {
    logger.error("Erreur récupération dashboard admin", {
      adminId: req.user.userId,
      errorMessage: error.message,
    });
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des statistiques agents",
    });
  }
};

// ==================== DÉSACTIVER UN AGENT (ADMIN) ====================
exports.deleteAgent = async (req, res) => {
  try {
    const { id } = req.params;

    const agent = await Agent.findById(id);
    if (!agent) {
      return res.status(404).json({
        success: false,
        message: "Agent non trouvé",
      });
    }

    // Désactiver l'agent
    agent.actif = false;
    agent.disponible = false;
    agent.email = `deleted_${Date.now()}_${agent.email}`;
    await agent.save();

    // ✅ LIBÉRER LES COLIS via ServiceClient
    try {
      const result = await dechargeClient.post("/api/colis/unassign-agent", {
        agentId: id,
      });

      if (result.success) {
        logger.info("Colis libérés pour agent désactivé", {
          adminId: req.user.userId,
          agentId: id,
          colisLiberes: result.data?.colisLiberes || 0,
        });
      }
    } catch (error) {
      // ServiceClient a déjà loggé l'erreur
      logger.warn("DechargeService non disponible lors de la désactivation", {
        adminId: req.user.userId,
        agentId: id,
        error: error.message,
      });
      // On continue quand même, l'agent est désactivé
    }

    logger.info("Agent désactivé par admin", {
      adminId: req.user.userId,
      agentId: id,
    });

    return res.status(200).json({
      success: true,
      message: "Agent désactivé avec succès",
      data: agent,
    });
  } catch (error) {
    logger.error("Erreur désactivation agent", {
      adminId: req.user.userId,
      agentId: req.params.id,
      errorMessage: error.message,
    });
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la désactivation de l'agent",
    });
  }
};

// ==================== CASCADE DELETE USER (Appelé par AuthService) ====================
exports.cascadeDeleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    // Désactiver tous les agents du user
    const agentsResult = await Agent.updateMany(
      { userId: userId },
      {
        actif: false,
        disponible: false,
        email: `deleted_agent_${Date.now()}@deleted.com`,
      }
    );

    logger.info("Cascade deletion agents effectuée", {
      userId,
      agentsDesactives: agentsResult.modifiedCount,
    });

    return res.status(200).json({
      success: true,
      data: {
        agentsDesactives: agentsResult.modifiedCount,
      },
    });
  } catch (error) {
    logger.error("Erreur cascade deletion agents", {
      userId: req.params.userId,
      errorMessage: error.message,
    });
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la cascade de suppression des agents",
    });
  }
};
