// const User = require("../models/usersModel");
// const { logger } = require("shared-middlewares");

// // ✅ METTRE À JOUR LE STATUT D'ABONNEMENT (Appelé par PaymentService)
// exports.updateUserSubscription = async (req, res) => {
//   try {
//     const { userId } = req.params;
//     const {
//       subscriptionStatus,
//       subscriptionId,
//       planId,
//       subscriptionStartDate,
//       subscriptionEndDate,
//     } = req.body;

//     const user = await User.findById(userId);
//     if (!user) {
//       return res.status(404).json({
//         success: false,
//         message: "Utilisateur non trouvé",
//       });
//     }

//     // Mettre à jour le statut d'abonnement
//     user.subscriptionStatus = subscriptionStatus;
//     user.subscriptionId = subscriptionId;
//     user.planId = planId;
//     user.subscriptionStartDate = subscriptionStartDate;
//     user.subscriptionEndDate = subscriptionEndDate;
//     await user.save();

//     logger.info("Statut abonnement mis à jour", {
//       userId,
//       subscriptionStatus,
//       planId,
//     });

//     return res.status(200).json({
//       success: true,
//       message: "Abonnement mis à jour avec succès",
//       data: {
//         subscriptionStatus: user.subscriptionStatus,
//         planId: user.planId,
//       },
//     });
//   } catch (error) {
//     logger.error("Erreur mise à jour abonnement", {
//       userId: req.params.userId,
//       error: error.message,
//     });
//     return res.status(500).json({
//       success: false,
//       message: "Erreur lors de la mise à jour de l'abonnement",
//     });
//   }
// };
const User = require("../models/usersModel");
const { logger } = require("shared-middlewares");

// ✅ METTRE À JOUR LE STATUT D'ABONNEMENT (Appelé par PaymentService)
exports.updateUserSubscription = async (req, res) => {
  try {
    const { userId } = req.params;
    const {
      subscriptionStatus,
      subscriptionId,
      planId,
      subscriptionStartDate,
      subscriptionEndDate,
    } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Utilisateur non trouvé",
      });
    }

    // Mettre à jour le statut d'abonnement
    user.subscriptionStatus = subscriptionStatus;
    user.subscriptionId = subscriptionId;
    user.planId = planId;
    user.subscriptionStartDate = subscriptionStartDate;
    user.subscriptionEndDate = subscriptionEndDate;
    await user.save();

    logger.info("Statut abonnement mis à jour", {
      userId,
      subscriptionStatus,
      planId,
    });

    return res.status(200).json({
      success: true,
      message: "Abonnement mis à jour avec succès",
      data: {
        subscriptionStatus: user.subscriptionStatus,
        planId: user.planId,
      },
    });
  } catch (error) {
    logger.error("Erreur mise à jour abonnement", {
      userId: req.params.userId,
      error: error.message,
    });
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la mise à jour de l'abonnement",
    });
  }
};

// ✅ RÉCUPÉRER STATUT ABONNEMENT (Appelé par CourierService)
exports.getUserSubscriptionStatus = async (req, res) => {
  try {
    const { userId } = req.params;

    console.log("🔍 [AUTH] Vérification abonnement pour user:", userId);

    const user = await User.findById(userId).select(
      "subscriptionStatus subscriptionId planId subscriptionEndDate email name"
    );

    if (!user) {
      console.log("❌ [AUTH] User non trouvé:", userId);
      return res.status(404).json({
        success: false,
        message: "Utilisateur non trouvé",
      });
    }

    console.log("✅ [AUTH] Statut abonnement:", user.subscriptionStatus);

    return res.status(200).json({
      success: true,
      data: {
        userId: user._id,
        email: user.email,
        name: user.name,
        subscriptionStatus: user.subscriptionStatus,
        subscriptionId: user.subscriptionId,
        planId: user.planId,
        subscriptionEndDate: user.subscriptionEndDate,
      },
    });
  } catch (error) {
    console.error("💥 [AUTH] Erreur récupération statut:", error);
    logger.error("Erreur récupération statut abonnement", {
      userId: req.params.userId,
      error: error.message,
    });
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération du statut",
    });
  }
};
