const express = require("express");
const router = express.Router();
const { internalAuth } = require("../middlewares/internalAuth");
const Agent = require("../models/agentModel");

console.log("🔐 [INTERNAL ROUTES] Initialisation...");

/**
 * GET /api/internal/agents/:id
 * Vérifier qu'un agent existe (appelé par DechargeService)
 */
router.get("/agents/:id", internalAuth, async (req, res) => {
  console.log("✅ [INTERNAL] GET /agents/:id - Auth OK");
  console.log("🔍 [INTERNAL] Agent ID:", req.params.id);

  try {
    const agent = await Agent.findOne({
      _id: req.params.id,
      actif: true,
    });

    if (!agent) {
      console.log("❌ [INTERNAL] Agent non trouvé");
      return res.status(404).json({
        success: false,
        message: "Agent non trouvé ou inactif",
      });
    }

    console.log("✅ [INTERNAL] Agent validé:", {
      id: agent._id,
      email: agent.email,
    });

    return res.status(200).json({
      success: true,
      data: {
        id: agent._id,
        nom: agent.nom,
        prenom: agent.prenom,
        email: agent.email,
        telephone: agent.telephone,
      },
    });
  } catch (error) {
    console.error("❌ [INTERNAL] Erreur:", error.message);
    return res.status(500).json({
      success: false,
      message: "Erreur serveur",
      error: error.message,
    });
  }
});

/**
 * POST /api/internal/assign-agent (optionnel)
 * Assigner directement un agent
 */
router.post("/assign-agent", internalAuth, async (req, res) => {
  console.log("✅ [INTERNAL] POST /assign-agent - Auth OK");
  console.log("🔍 [INTERNAL] Body:", req.body);

  try {
    const { colisId, agentId } = req.body;

    if (!colisId || !agentId) {
      return res.status(400).json({
        success: false,
        message: "colisId et agentId requis",
      });
    }

    const agent = await Agent.findOne({
      _id: agentId,
      actif: true,
    });

    if (!agent) {
      return res.status(404).json({
        success: false,
        message: "Agent non trouvé",
      });
    }

    console.log("✅ [INTERNAL] Agent assigné:", agentId);

    return res.status(200).json({
      success: true,
      message: "Agent assigné",
      data: { colisId, agentId },
    });
  } catch (error) {
    console.error("❌ [INTERNAL] Erreur:", error.message);
    return res.status(500).json({
      success: false,
      message: "Erreur serveur",
    });
  }
});

console.log("✅ [INTERNAL ROUTES] Routes chargées");

module.exports = router;
