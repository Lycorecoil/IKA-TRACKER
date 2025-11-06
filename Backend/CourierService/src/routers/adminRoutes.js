const express = require("express");
const agentController = require("../controllers/agentController");
const { identifier, isAdmin } = require("shared-middlewares");
const { validateObjectId } = require("../middlewares/validator");

const router = express.Router();

/**
 * ============================
 *   ROUTES USER (propriétaire)
 * ============================
 */

// ➕ Créer un agent
router.post("/", identifier, agentController.createAgent);

// 📋 Lister tous les agents du user connecté
router.get("/", identifier, agentController.getAgents);

// 🔍 Consulter un agent précis (du user connecté)
router.get(
  "/:id",
  identifier,
  validateObjectId(),
  agentController.getAgentById
);

// ✏️ Modifier un agent (du user connecté)
router.put("/:id", identifier, validateObjectId(), agentController.updateAgent);

// 🔄 Activer / désactiver un agent
router.put(
  "/:id/toggle",
  identifier,
  validateObjectId(),
  agentController.toggleAgentStatus
);

/**
 * ============================
 *   ROUTES ADMIN
 * ============================
 */

// 🚫 Supprimer (désactiver) un agent (ADMIN uniquement)
router.delete(
  "/admin/:id",
  identifier,
  isAdmin,
  validateObjectId(),
  agentController.deleteAgent
);

module.exports = router;
