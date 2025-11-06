const express = require("express");
const agentController = require("../controllers/agentController");
const { identifier } = require("shared-middlewares");
const { checkSubscription } = require("../middlewares/checkSubscription");

const router = express.Router();

// ✅ MIDDLEWARES GLOBAUX
router.use((req, res, next) => {
  console.log(
    "📍 [AGENT ROUTER] Entrée - Méthode:",
    req.method,
    "Path:",
    req.path
  );
  next();
});

router.use(identifier);

router.use((req, res, next) => {
  console.log(
    "✅ [AGENT ROUTER] Après identifier - User ID:",
    req.user?.userId,
    "Role:",
    req.user?.role
  );
  next();
});

router.use(checkSubscription);

router.use((req, res, next) => {
  console.log(
    "✅ [AGENT ROUTER] Après checkSubscription - hasActiveSubscription:",
    req.user?.hasActiveSubscription
  );
  next();
});

// ➕ POST - CRÉER AGENT
router.post(
  "/",
  (req, res, next) => {
    console.log(
      "➕ [AGENT POST] Création agent - User (employeur):",
      req.user?.userId
    );
    console.log("➕ [AGENT POST] Body:", req.body);
    next();
  },
  agentController.createAgent
);

// 📋 GET - LISTER AGENTS
router.get(
  "/",
  (req, res, next) => {
    console.log("📋 [AGENT GET] Récupération agents - User:", req.user?.userId);
    next();
  },
  agentController.getAgents
);

// 🔍 GET - DÉTAIL AGENT (CHANGE getAgent → getAgentById)
router.get(
  "/:id",
  (req, res, next) => {
    console.log("🔍 [AGENT GET ID] Détail agent - ID:", req.params.id);
    next();
  },
  agentController.getAgentById // ← CHANGE: getAgent → getAgentById
);

// ✏️ PUT - MODIFIER AGENT
router.put(
  "/:id",
  (req, res, next) => {
    console.log("✏️ [AGENT PUT] Modification agent - ID:", req.params.id);
    console.log("✏️ [AGENT PUT] Modifications:", req.body);
    next();
  },
  agentController.updateAgent
);

// 🗑️ DELETE - SUPPRIMER AGENT
router.delete(
  "/:id",
  (req, res, next) => {
    console.log("🗑️ [AGENT DELETE] Suppression agent - ID:", req.params.id);
    next();
  },
  agentController.deleteAgent
);

module.exports = router;
