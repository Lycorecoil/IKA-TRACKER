const express = require("express");
const subscriptionController = require("../controllers/subscriptionController");
const { identifier } = require("shared-middlewares");
const { validateCheckoutSession } = require("../middlewares/validator");

const router = express.Router();

// Toutes les routes nécessitent une authentification
router.use(identifier);

// 🎯 CHECKOUT
router.post(
  "/checkout-session",
  validateCheckoutSession,
  subscriptionController.createCheckoutSession
);

// 🎯 ABONNEMENTS
router.get("/me", subscriptionController.getMySubscription);
router.delete("/cancel", subscriptionController.cancelSubscription);
router.post("/sync", subscriptionController.syncSubscription);

module.exports = router;
