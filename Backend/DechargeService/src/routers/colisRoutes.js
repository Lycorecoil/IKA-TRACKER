const express = require("express");
const colisController = require("../controllers/colisController");
const { identifier } = require("shared-middlewares");
const {
  checkSubscriptionForColis,
} = require("../middlewares/checkSubscription");
const {
  validateCreateColis,
  validateAssignColis,
  validateObjectId,
} = require("../middlewares/validator");

const router = express.Router();

// ✅ MIDDLEWARES GLOBAUX
router.use((req, res, next) => {
  console.log(
    "📍 [COLIS ROUTER] Entrée - Méthode:",
    req.method,
    "Path:",
    req.path
  );
  next();
});

router.use(identifier);

router.use((req, res, next) => {
  console.log(
    "✅ [COLIS ROUTER] Après identifier - User ID:",
    req.user?.userId,
    "Role:",
    req.user?.role
  );
  next();
});

router.use(checkSubscriptionForColis);

router.use((req, res, next) => {
  console.log(
    "✅ [COLIS ROUTER] Après checkSubscriptionForColis - hasActiveSubscription:",
    req.user?.hasActiveSubscription
  );
  next();
});

// 🎯 POST - CRÉER COLIS
router.post(
  "/",
  (req, res, next) => {
    console.log("📝 [COLIS POST] Début - User:", req.user?.userId);
    console.log("📝 [COLIS POST] Body:", req.body);
    next();
  },
  validateCreateColis,
  (req, res, next) => {
    console.log("📝 [COLIS POST] Après validation - Avant controller");
    next();
  },
  colisController.createColis
);

// 🔍 GET - LISTER COLIS
router.get(
  "/",
  (req, res, next) => {
    console.log("📋 [COLIS GET] Récupération colis - User:", req.user?.userId);
    next();
  },
  colisController.getColis
);

// 📌 PUT - ASSIGNER COLIS À AGENT
router.put(
  "/:id/assign",
  (req, res, next) => {
    console.log("🔄 [COLIS ASSIGN ÉTAPE 1] Début assignation");
    console.log("🔄 [COLIS ASSIGN ÉTAPE 1] Colis ID:", req.params.id);
    console.log("🔄 [COLIS ASSIGN ÉTAPE 1] User ID:", req.user?.userId);
    console.log("🔄 [COLIS ASSIGN ÉTAPE 1] Body:", req.body);
    next();
  },
  (req, res, next) => {
    console.log("🔄 [COLIS ASSIGN ÉTAPE 2] Avant validateObjectId");
    next();
  },
  validateObjectId(),
  (req, res, next) => {
    console.log("🔄 [COLIS ASSIGN ÉTAPE 3] Après validateObjectId - ID valide");
    next();
  },
  (req, res, next) => {
    console.log("🔄 [COLIS ASSIGN ÉTAPE 4] Avant validateAssignColis");
    console.log("🔄 [COLIS ASSIGN ÉTAPE 4] AgentId:", req.body.agentId);
    next();
  },
  validateAssignColis,
  (req, res, next) => {
    console.log(
      "🔄 [COLIS ASSIGN ÉTAPE 5] Après validateAssignColis - Validation OK"
    );
    next();
  },
  (req, res, next) => {
    console.log("🔄 [COLIS ASSIGN ÉTAPE 6] Avant controller - Prêt à assigner");
    next();
  },
  colisController.assignColis,
  (req, res, next) => {
    console.log("🔄 [COLIS ASSIGN ÉTAPE 7] Après controller");
    next();
  }
);

// 🗑️ DELETE - SUPPRIMER COLIS
router.delete(
  "/:id",
  (req, res, next) => {
    console.log("🗑️ [COLIS DELETE] Suppression - Colis ID:", req.params.id);
    console.log("🗑️ [COLIS DELETE] User ID:", req.user?.userId);
    next();
  },
  validateObjectId(),
  (req, res, next) => {
    console.log("🗑️ [COLIS DELETE] Après validation - ID valide");
    next();
  },
  colisController.deleteColis
);

module.exports = router;
