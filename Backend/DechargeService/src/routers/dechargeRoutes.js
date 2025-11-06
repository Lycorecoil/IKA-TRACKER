const express = require("express");
const dechargeController = require("../controllers/dechargeController");
const { identifier } = require("shared-middlewares");
const {
  validateCreateDecharge,
  validateObjectId,
} = require("../middlewares/validator");

const router = express.Router();

// ✅ MIDDLEWARES GLOBAUX
router.use((req, res, next) => {
  console.log(
    "📍 [DECHARGE ROUTER] Entrée - Méthode:",
    req.method,
    "Path:",
    req.path
  );
  next();
});

router.use(identifier);

router.use((req, res, next) => {
  console.log(
    "✅ [DECHARGE ROUTER] Après identifier - User ID:",
    req.user?.userId,
    "Role:",
    req.user?.role
  );
  next();
});

// ✍️ POST - CRÉER DÉCHARGE
router.post(
  "/",
  (req, res, next) => {
    console.log("✍️ [DECHARGE POST] Début création");
    console.log("✍️ [DECHARGE POST] User ID:", req.user?.userId);
    console.log("✍️ [DECHARGE POST] Colis ID:", req.body.colisId);
    next();
  },
  validateCreateDecharge,
  (req, res, next) => {
    console.log("✍️ [DECHARGE POST] Après validation - Avant controller");
    next();
  },
  dechargeController.createDecharge
);

// 📋 GET - LISTER DÉCHARGES
router.get(
  "/",
  (req, res, next) => {
    console.log(
      "📋 [DECHARGE GET] Récupération décharges - User:",
      req.user?.userId
    );
    next();
  },
  dechargeController.getDecharges
);

// 🔍 GET - DÉTAIL DÉCHARGE
router.get(
  "/:id",
  (req, res, next) => {
    console.log("🔍 [DECHARGE GET ID] Détail décharge - ID:", req.params.id);
    next();
  },
  validateObjectId,
  (req, res, next) => {
    console.log("🔍 [DECHARGE GET ID] Après validation - ID valide");
    next();
  },
  dechargeController.getDechargeById
);

module.exports = router;
