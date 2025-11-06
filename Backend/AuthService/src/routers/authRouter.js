const express = require("express");
const {
  signupAgentSchema,
  validateRequest,
} = require("../middlewares/validator");
const authController = require("../controllers/authController");
const { identifier } = require("shared-middlewares");
const { authLimiter } = require("../middlewares/rateLimit");
const User = require("../models/usersModel"); // ✅ AJOUT

const router = express.Router();

// 🔓 Routes PUBLIQUES (sans authentification)
router.post("/signup", authLimiter, authController.signup);
router.post("/signin", authLimiter, authController.signin);
router.post(
  "/signup-agent",
  validateRequest(signupAgentSchema),
  authController.signupAgent // ← Doit exister dans authController
);

router.post("/send-verification-code", authController.sendVerificationCode);
router.post("/verify-verification-code", authController.verifyVerificationCode);
router.post(
  "/send-forgot-password-code",
  authController.sendForgotPasswordCode
);
router.post(
  "/verify-forgot-password-code",
  authController.verifyForgotPasswordCode
);

// ✅ NOUVELLE ROUTE POUR PAYMENT-SERVICE
router.post("/verify-user-subscription", async (req, res) => {
  try {
    const { userId } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.json({
        hasAccess: false,
        message: "Utilisateur non trouvé",
      });
    }

    // Pour les agents, on retourne toujours true car c'est courier-service qui gère
    // Pour les users, on vérifie l'abonnement
    const hasAccess =
      user.role === "agent" || user.subscriptionStatus === "active";

    return res.json({
      hasAccess,
      userRole: user.role,
      subscriptionStatus: user.subscriptionStatus,
    });
  } catch (error) {
    logger.error("Erreur vérification abonnement user", {
      error: error.message,
    });
    return res.json({ hasAccess: false });
  }
});
//  payment-service
router.post("/update-subscription", async (req, res) => {
  try {
    const { userId, subscriptionStatus } = req.body;

    const user = await User.findById(userId);
    if (user) {
      user.subscriptionStatus = subscriptionStatus;
      await user.save();

      logger.info("Statut abonnement mis à jour", {
        userId,
        subscriptionStatus,
      });
    }

    return res.json({ success: true });
  } catch (error) {
    logger.error("Erreur mise à jour abonnement", {
      error: error.message,
    });
    return res.status(500).json({ success: false });
  }
});

// 🔐 Routes PROTÉGÉES (nécessitent authentication)
router.post("/signout", identifier, authController.signout);
router.post("/change-password", identifier, authController.changePassword);
router.get("/getme", identifier, authController.getMe);

module.exports = router;
