const express = require("express");
const adminController = require("../controllers/adminController");
const { identifier, isAdmin } = require("shared-middlewares");
const { validateObjectId } = require("../middlewares/validator");
const { internalAuth } = require("../middlewares/internalAuth");

const router = express.Router();

// ✅ MIDDLEWARES GLOBAUX
router.use((req, res, next) => {
  console.log(
    "📍 [ADMIN ROUTER] Entrée - Méthode:",
    req.method,
    "Path:",
    req.path
  );
  next();
});

router.use(identifier);

router.use((req, res, next) => {
  console.log(
    "✅ [ADMIN ROUTER] Après identifier - User ID:",
    req.user?.userId,
    "Role:",
    req.user?.role
  );
  next();
});

// 📊 DASHBOARD ADMIN
router.get(
  "/dashboard",
  isAdmin,
  (req, res, next) => {
    console.log(
      "📊 [ADMIN DASHBOARD] Accès admin - User ID:",
      req.user?.userId
    );
    next();
  },
  adminController.getDashboard
);

// 📦 GESTION COLIS (ADMIN)
router.get(
  "/colis",
  isAdmin,
  (req, res, next) => {
    console.log(
      "📦 [ADMIN COLIS] Récupération tous les colis - Admin:",
      req.user?.userId
    );
    next();
  },
  adminController.getAllColis
);

router.get(
  "/colis/:id",
  isAdmin,
  (req, res, next) => {
    console.log("📦 [ADMIN COLIS ID] Détail colis - ID:", req.params.id);
    next();
  },
  validateObjectId,
  (req, res, next) => {
    console.log("📦 [ADMIN COLIS ID] Après validation - ID valide");
    next();
  },
  adminController.getColisById
);

router.delete(
  "/colis/:id",
  isAdmin,
  (req, res, next) => {
    console.log(
      "🗑️ [ADMIN COLIS DELETE] Suppression colis - ID:",
      req.params.id
    );
    next();
  },
  validateObjectId,
  (req, res, next) => {
    console.log("🗑️ [ADMIN COLIS DELETE] Après validation - ID valide");
    next();
  },
  adminController.deleteColis
);

// 📄 GESTION DÉCHARGES (ADMIN)
router.get(
  "/decharges",
  isAdmin,
  (req, res, next) => {
    console.log(
      "📄 [ADMIN DECHARGES] Récupération toutes les décharges - Admin:",
      req.user?.userId
    );
    next();
  },
  adminController.getAllDecharges
);

router.get(
  "/decharges/:id",
  isAdmin,
  (req, res, next) => {
    console.log("📄 [ADMIN DECHARGES ID] Détail décharge - ID:", req.params.id);
    next();
  },
  validateObjectId,
  (req, res, next) => {
    console.log("📄 [ADMIN DECHARGES ID] Après validation - ID valide");
    next();
  },
  adminController.getDechargeById
);

// 🔗 ROUTE INTERNE (COURIER-SERVICE)
router.post(
  "/colis/unassign-agent",
  internalAuth,
  (req, res, next) => {
    console.log("🔗 [INTERNAL] Unassign colis agent - Source: CourierService");
    console.log("🔗 [INTERNAL] Colis ID:", req.body.colisId);
    next();
  },
  adminController.unassignAgentColis
);

module.exports = router;
