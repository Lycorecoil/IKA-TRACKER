const express = require("express");
const router = express.Router();
const { logger } = require("shared-middlewares");

// ✅ GET user info (pour vérifier abonnement)
router.get("/users/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    console.log("🔍 [INTERNAL] Récupération user:", userId);

    const User = require("../models/usersModel");

    const user = await User.findById(userId).select(
      "subscriptionStatus subscriptionStartDate subscriptionEndDate subscriptionId stripeCustomerId planId"
    );

    if (!user) {
      console.log("❌ User non trouvé:", userId);
      return res.status(404).json({
        success: false,
        message: "Utilisateur non trouvé",
      });
    }

    console.log("✅ [INTERNAL] User trouvé - Status:", user.subscriptionStatus);

    return res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error("❌ [INTERNAL] Erreur récupération user:", error.message);
    return res.status(500).json({
      success: false,
      message: "Erreur récupération utilisateur",
    });
  }
});

// ✅ PUT update subscription
router.put("/users/:userId/subscription", async (req, res) => {
  try {
    const { userId } = req.params;
    const {
      subscriptionStatus,
      subscriptionStartDate,
      subscriptionEndDate,
      subscriptionId,
      stripeCustomerId,
      planId,
    } = req.body;

    console.log("🔄 [INTERNAL] Mise à jour subscription - User:", userId);

    const User = require("../models/usersModel");

    const user = await User.findByIdAndUpdate(
      userId,
      {
        subscriptionStatus: subscriptionStatus,
        subscriptionStartDate: subscriptionStartDate || null,
        subscriptionEndDate: subscriptionEndDate || null,
        subscriptionId: subscriptionId || null,
        stripeCustomerId: stripeCustomerId || null,
        planId: planId || null,
        subscriptionUpdatedAt: new Date(),
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Utilisateur non trouvé",
      });
    }

    console.log("✅ [INTERNAL] Subscription mise à jour");

    return res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error("❌ [INTERNAL] Erreur update:", error.message);
    return res.status(500).json({
      success: false,
      message: "Erreur mise à jour subscription",
    });
  }
});

module.exports = router;
