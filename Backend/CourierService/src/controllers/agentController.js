const Agent = require("../models/agentModel");
const { logger, createServiceClient } = require("shared-middlewares");
const { invalidateCache } = require("shared-middlewares/cacheHelper");
const transport = require("shared-middlewares");

const authClient = createServiceClient("auth");

// ==================== GÉNÉRATION MOT DE PASSE ====================
function generateSecurePassword() {
  const length = 12;
  const charset =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
  let password = "";

  password += "ABCDEFGHIJKLMNOPQRSTUVWXYZ"[Math.floor(Math.random() * 26)];
  password += "abcdefghijklmnopqrstuvwxyz"[Math.floor(Math.random() * 26)];
  password += "0123456789"[Math.floor(Math.random() * 10)];
  password += "!@#$%^&*"[Math.floor(Math.random() * 8)];

  for (let i = 4; i < length; i++) {
    password += charset[Math.floor(Math.random() * charset.length)];
  }

  return password
    .split("")
    .sort(() => 0.5 - Math.random())
    .join("");
}

// ==================== EMAIL DE BIENVENUE ====================
async function sendAgentWelcomeEmail(
  agentEmail,
  agentName,
  password,
  numeroAgent
) {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: agentEmail,
      subject: "🎉 Bienvenue sur notre plateforme de livraison !",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Bienvenue sur notre plateforme !</h2>
          <p>Bonjour <strong>${agentName}</strong>,</p>
          <p>Votre compte agent a été créé avec succès.</p>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3 style="color: #28a745; margin-top: 0;">Vos identifiants :</h3>
            <p><strong>Numéro Agent :</strong> ${numeroAgent}</p>
            <p><strong>Email :</strong> ${agentEmail}</p>
            <p><strong>Mot de passe :</strong> ${password}</p>
          </div>
          
          <div style="background: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="color: #856404; margin: 0;">
              <strong>⚠️ Important :</strong> Changez votre mot de passe après votre première connexion.
            </p>
          </div>
          
          <p>Vous pouvez maintenant vous connecter à l'application mobile.</p>
        </div>
      `,
    };

    await transport.sendMail(mailOptions);
    console.log("📧 Email envoyé à:", agentEmail);
  } catch (error) {
    console.error("❌ Erreur envoi email:", error.message);
    throw error;
  }
}

// ==================== CRÉATION D'AGENT ====================
exports.createAgent = async (req, res) => {
  try {
    const { nom, prenom, telephone, email, adresse } = req.body;
    const userId = req.user.userId;

    console.log("🔍 [AGENT] Création agent pour user:", userId);

    // ✅ VÉRIFIER ABONNEMENT
    try {
      const userResponse = await authClient.get(
        `/api/internal/users/${userId}`
      );

      if (
        !userResponse.success ||
        userResponse.data.subscriptionStatus !== "active"
      ) {
        console.log("❌ [AGENT] User sans abonnement actif");
        return res.status(403).json({
          success: false,
          message:
            "Vous devez avoir un abonnement actif pour créer des agents.",
          needsSubscription: true,
        });
      }

      console.log("✅ [AGENT] Abonnement actif vérifié");
    } catch (error) {
      console.error(
        "❌ [AGENT] Erreur vérification abonnement:",
        error.message
      );
      return res.status(500).json({
        success: false,
        message: "Erreur vérification abonnement",
      });
    }

    // ✅ GÉNÉRER NUMÉRO AUTOMATIQUEMENT (1000 à l'infini)
    const lastAgent = await Agent.findOne({ userId }).sort({
      numeroAgent: -1,
    });

    const numeroAgent = lastAgent ? lastAgent.numeroAgent + 1 : 1000;
    console.log("🔢 [AGENT] Numéro généré:", numeroAgent);

    // ✅ GÉNÉRER MOT DE PASSE
    const password = generateSecurePassword();

    // ✅ CRÉER COMPTE AUTHSERVICE
    console.log("🔄 [AGENT] Création compte AuthService...");

    const authResponse = await authClient.post("/api/auth/signup-agent", {
      email,
      password,
      name: `${prenom} ${nom}`,
      role: "agent",
      agentNumber: numeroAgent,
    });

    if (!authResponse.success) {
      console.error("❌ [AGENT] Erreur création AuthService");
      return res.status(400).json({
        success: false,
        message: "Erreur création compte agent",
      });
    }

    console.log("✅ [AGENT] Compte AuthService créé");

    // ✅ CRÉER AGENT EN BD
    const newAgent = new Agent({
      _id: authResponse.data.userId,
      numeroAgent,
      nom,
      prenom,
      telephone,
      email,
      adresse,
      userId,
      actif: true,
      disponible: true,
    });

    await newAgent.save();
    console.log("✅ [AGENT] Agent créé en BD");

    // ✅ INVALIDER CACHE
    await invalidateCache("cache:/api/agents*");

    // ✅ ENVOYER EMAIL
    try {
      await sendAgentWelcomeEmail(
        email,
        `${prenom} ${nom}`,
        password,
        numeroAgent
      );
    } catch (emailError) {
      console.warn("⚠️ Erreur envoi email:", emailError.message);
    }

    logger.info("Agent créé avec succès", {
      userId,
      agentId: newAgent._id,
      numeroAgent,
      email,
    });

    return res.status(201).json({
      success: true,
      message: "Agent créé avec succès",
      data: {
        agentId: newAgent._id,
        numeroAgent,
        nom: newAgent.nom,
        prenom: newAgent.prenom,
        email: newAgent.email,
      },
    });
  } catch (error) {
    console.error("💥 [AGENT] Erreur création agent:", error.message);
    logger.error("Erreur création agent", {
      userId: req.user.userId,
      error: error.message,
    });

    return res.status(500).json({
      success: false,
      message: "Erreur lors de la création de l'agent",
    });
  }
};

// ==================== LISTE DES AGENTS ====================
exports.getAgents = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const agents = await Agent.find({ userId: req.user.userId, actif: true })
      .sort({ numeroAgent: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Agent.countDocuments({
      userId: req.user.userId,
      actif: true,
    });

    return res.status(200).json({
      success: true,
      data: agents,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error("Erreur récupération agents", {
      userId: req.user.userId,
      error: error.message,
    });
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des agents",
    });
  }
};

// ==================== MODIFIER UN AGENT ====================
exports.updateAgent = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const agent = await Agent.findOne({
      _id: id,
      userId: req.user.userId,
    });

    if (!agent) {
      return res.status(404).json({
        success: false,
        message: "Agent non trouvé",
      });
    }

    Object.keys(updates).forEach((key) => {
      if (
        updates[key] !== undefined &&
        key !== "numeroAgent" &&
        key !== "userId"
      ) {
        agent[key] = updates[key];
      }
    });

    await agent.save();

    // ✅ INVALIDER CACHE
    await invalidateCache("cache:/api/agents*");

    logger.info("Agent modifié", {
      userId: req.user.userId,
      agentId: id,
    });

    return res.status(200).json({
      success: true,
      message: "Agent modifié avec succès",
      data: agent,
    });
  } catch (error) {
    logger.error("Erreur modification agent", {
      userId: req.user.userId,
      error: error.message,
    });
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la modification de l'agent",
    });
  }
};

// ==================== CONSULTER UN AGENT ====================
exports.getAgentById = async (req, res) => {
  try {
    const { id } = req.params;

    const agent = await Agent.findOne({
      _id: id,
      userId: req.user.userId,
    });

    if (!agent) {
      return res.status(404).json({
        success: false,
        message: "Agent non trouvé",
      });
    }

    return res.status(200).json({
      success: true,
      data: agent,
    });
  } catch (error) {
    logger.error("Erreur récupération agent", {
      userId: req.user.userId,
      error: error.message,
    });
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération de l'agent",
    });
  }
};

// ==================== ACTIVER/DÉSACTIVER UN AGENT ====================
exports.toggleAgentStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const agent = await Agent.findOne({
      _id: id,
      userId: req.user.userId,
    });

    if (!agent) {
      return res.status(404).json({
        success: false,
        message: "Agent non trouvé",
      });
    }

    agent.actif = !agent.actif;
    await agent.save();

    // ✅ INVALIDER CACHE
    await invalidateCache("cache:/api/agents*");

    logger.info("Statut agent modifié", {
      userId: req.user.userId,
      agentId: id,
      statut: agent.actif ? "actif" : "inactif",
    });

    return res.status(200).json({
      success: true,
      message: `Agent ${agent.actif ? "activé" : "désactivé"} avec succès`,
      data: agent,
    });
  } catch (error) {
    logger.error("Erreur modification statut", {
      userId: req.user.userId,
      error: error.message,
    });
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la modification du statut",
    });
  }
};

// ==================== SUPPRIMER UN AGENT ====================
exports.deleteAgent = async (req, res) => {
  try {
    const { id } = req.params;

    const agent = await Agent.findByIdAndUpdate(
      id,
      {
        actif: false,
        disponible: false,
        email: `deleted_${Date.now()}_${id}`,
      },
      { new: true }
    );

    if (!agent) {
      return res.status(404).json({
        success: false,
        message: "Agent non trouvé",
      });
    }

    // ✅ INVALIDER CACHE
    await invalidateCache("cache:/api/agents*");

    logger.info("Agent désactivé", {
      userId: req.user.userId,
      agentId: id,
    });

    return res.status(200).json({
      success: true,
      message: "Agent désactivé avec succès",
      data: agent,
    });
  } catch (error) {
    logger.error("Erreur désactivation agent", {
      userId: req.user.userId,
      error: error.message,
    });
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la désactivation de l'agent",
    });
  }
};
