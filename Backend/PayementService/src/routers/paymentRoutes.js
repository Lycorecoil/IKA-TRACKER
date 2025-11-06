const express = require("express");
const paymentController = require("../controllers/paymentController");
const { handleStripeWebhook } = require("../controllers/webhookController");
const { identifier } = require("shared-middlewares");
const {
  validateCreatePayment,
  validateObjectId,
} = require("../middlewares/validator");

const router = express.Router();

// 🎯 MIDDLEWARE CUSTOM POUR RAW BODY
const rawBodyMiddleware = function (req, res, next) {
  let data = "";
  req.setEncoding("utf8");
  req.on("data", (chunk) => {
    data += chunk;
  });
  req.on("end", () => {
    req.rawBody = data;
    next();
  });
};

// 🎯 WEBHOOK Stripe
router.post("/webhook", rawBodyMiddleware, handleStripeWebhook);

// ✅ Routes protégées par JWT
router.use(identifier);
router.use(express.json());

// 🎯 PAIEMENTS
router.post("/", validateCreatePayment, paymentController.createPayment);
router.get("/", paymentController.getMyPayments);
router.get(
  "/:paymentIntentId/confirm",
  validateObjectId("paymentIntentId"),
  paymentController.confirmPayment
);

module.exports = router;
