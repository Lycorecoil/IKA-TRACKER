const express = require("express");
const subscriptionController = require("../controllers/subscriptionController"); // ← Maintenant ce fichier existe
const adminController = require("../controllers/adminController");
const { identifier, isAdmin } = require("shared-middlewares");
const { internalAuth } = require("../middlewares/internalAuth");
const { adminLimiter } = require("../middlewares/rateLimit");

const router = express.Router();

// Rate limiting pour toutes les routes admin
router.use(adminLimiter);

// ✅ ROUTE INTERNE (sans identifier/isAdmin, juste API Key)
router.put(
  "/internal/users/:userId/subscription",
  internalAuth, // ← Seulement vérification API Key
  subscriptionController.updateUserSubscription
);

router.get(
  "/internal/users/:userId",
  internalAuth, // ← Nouvelle route pour CourierService
  subscriptionController.getUserSubscriptionStatus
);

// ✅ ROUTES ADMIN (avec authentification + rôle)
router.use(identifier, isAdmin); // ← Appliqué à toutes les routes suivantes

// User management
router.get("/users", adminController.getAllUsers);
router.get("/users/:id", adminController.getUserById);
router.patch("/users/:id/role", adminController.updateUserRole);
router.delete("/users/:id", adminController.deleteUser);

// System stats
router.get("/stats", adminController.getSystemStats);

module.exports = router;
