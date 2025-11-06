const Colis = require("../models/colisModel");
const { logger, createServiceClient } = require("shared-middlewares");
const { invalidateCache } = require("shared-middlewares/cacheHelper");

const authClient = createServiceClient("auth");

// ==================== CRÉER UN COLIS (User) ====================
exports.createColis = async (req, res) => {
  try {
    const { title, description, referenceNumber, destination, deliveryDate } =
      req.body;
    const userId = req.user.userId;

    console.log("📦 [COLIS] Création colis - User:", userId);

    // ✅ VÉRIFIER ABONNEMENT USER
    try {
      const userResponse = await authClient.get(
        `/api/internal/users/${userId}`
      );

      if (
        !userResponse.success ||
        userResponse.data.subscriptionStatus !== "active"
      ) {
        console.log("❌ [COLIS] User sans abonnement");
        return res.status(403).json({
          success: false,
          message: "Vous devez avoir un abonnement actif pour créer des colis.",
          needsSubscription: true,
        });
      }

      console.log("✅ [COLIS] Abonnement user vérifié");
    } catch (error) {
      console.error(
        "❌ [COLIS] Erreur vérification abonnement:",
        error.message
      );
      return res.status(500).json({
        success: false,
        message: "Erreur vérification abonnement",
      });
    }

    // ✅ VÉRIFIER UNICITÉ RÉFÉRENCE
    if (referenceNumber) {
      const existingColis = await Colis.findOne({
        referenceNumber: referenceNumber,
        userId: userId,
      });
      if (existingColis) {
        return res.status(409).json({
          success: false,
          message: "Numéro de référence déjà utilisé",
        });
      }
    }

    const newColis = new Colis({
      title,
      description,
      referenceNumber,
      destination,
      deliveryDate,
      userId: userId,
      status: "en_attente",
      actif: true,
    });

    const result = await newColis.save();

    // ✅ INVALIDER CACHE
    await invalidateCache("cache:/api/colis*");

    logger.info("Colis créé avec succès", {
      userId,
      colisId: result._id,
    });

    return res.status(201).json({
      success: true,
      message: "Colis créé avec succès",
      data: result,
    });
  } catch (error) {
    console.error("❌ [COLIS] Erreur création:", error.message);
    logger.error("Erreur création colis", {
      userId: req.user.userId,
      error: error.message,
    });
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la création du colis",
    });
  }
};

// ==================== ASSIGNER UN COLIS À UN AGENT (User) ====================
exports.assignColis = async (req, res) => {
  try {
    const { id } = req.params;
    const { agentId } = req.body;
    const userId = req.user.userId;

    console.log("🔗 [COLIS] Assignation - Colis:", id, "Agent:", agentId);

    // ✅ VÉRIFIER ABONNEMENT USER
    try {
      const userResponse = await authClient.get(
        `/api/internal/users/${userId}`
      );

      if (
        !userResponse.success ||
        userResponse.data.subscriptionStatus !== "active"
      ) {
        console.log("❌ [COLIS] User sans abonnement");
        return res.status(403).json({
          success: false,
          message:
            "Vous devez avoir un abonnement actif pour assigner des colis.",
          needsSubscription: true,
        });
      }

      console.log("✅ [COLIS] Abonnement user vérifié");
    } catch (error) {
      console.error(
        "❌ [COLIS] Erreur vérification abonnement:",
        error.message
      );
      return res.status(500).json({
        success: false,
        message: "Erreur vérification abonnement",
      });
    }

    // ✅ VÉRIFIER QUE LE COLIS APPARTIENT AU USER
    const colis = await Colis.findOne({
      _id: id,
      userId: userId,
      actif: true,
    });

    if (!colis) {
      return res.status(404).json({
        success: false,
        message: "Colis non trouvé",
      });
    }

    // ✅ VÉRIFIER QUE L'AGENT EXISTE
    const courierClient = createServiceClient("courier");
    const agentResponse = await courierClient.get(
      `/api/internal/agents/${agentId}`
    );

    if (!agentResponse.success) {
      return res.status(404).json({
        success: false,
        message: "Agent non trouvé ou non autorisé",
      });
    }

    // ✅ ASSIGNER LE COLIS
    colis.agentId = agentId;
    colis.status = "assigné";
    colis.dateAssignation = new Date();
    await colis.save();

    // ✅ INVALIDER CACHE
    await invalidateCache("cache:/api/colis*");

    logger.info("Colis assigné à agent", {
      userId,
      colisId: id,
      agentId,
    });

    return res.status(200).json({
      success: true,
      message: "Colis assigné avec succès",
      data: colis,
    });
  } catch (error) {
    console.error("❌ [COLIS] Erreur assignation:", error.message);
    logger.error("Erreur assignation colis", {
      userId: req.user.userId,
      colisId: req.params.id,
      error: error.message,
    });
    return res.status(500).json({
      success: false,
      message: "Erreur lors de l'assignation du colis",
    });
  }
};

// ==================== LIBÉRER LES COLIS D'UN AGENT (Interne) ====================
exports.unassignAgentColis = async (req, res) => {
  try {
    const { agentId } = req.body;

    console.log("🔓 [COLIS] Libération colis pour agent:", agentId);

    const result = await Colis.updateMany(
      {
        agentId: agentId,
        status: { $in: ["en_attente", "assigné", "en_cours"] },
      },
      {
        agentId: null,
        status: "en_attente",
        dateAssignation: null,
      }
    );

    // ✅ INVALIDER CACHE
    await invalidateCache("cache:/api/colis*");

    logger.info("Colis libérés pour agent supprimé", {
      agentId: agentId,
      colisLiberes: result.modifiedCount,
    });

    return res.status(200).json({
      success: true,
      message: `${result.modifiedCount} colis libérés`,
      data: {
        colisLiberes: result.modifiedCount,
      },
    });
  } catch (error) {
    console.error("❌ [COLIS] Erreur libération:", error.message);
    logger.error("Erreur libération colis agent", {
      agentId: req.body.agentId,
      error: error.message,
    });
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la libération des colis",
    });
  }
};

// ==================== LISTE DES COLIS (User/Agent) ====================
exports.getColis = async (req, res) => {
  try {
    let filter = { actif: true };
    const { page = 1, limit = 10, status } = req.query;

    console.log(
      "📋 [COLIS] Récupération - Role:",
      req.user.role,
      "ID:",
      req.user.userId
    );

    // ✅ FILTRE SELON LE RÔLE
    if (req.user.role === "user") {
      filter.userId = req.user.userId;
      console.log("👤 [COLIS] Filtre USER");
    } else if (req.user.role === "agent") {
      filter.agentId = req.user.userId;
      console.log("🚚 [COLIS] Filtre AGENT");
    }

    if (status) filter.status = status;

    const colis = await Colis.find(filter)
      .populate("dechargeId")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Colis.countDocuments(filter);

    console.log("✅ [COLIS] Trouvés:", colis.length);

    return res.status(200).json({
      success: true,
      data: colis,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("❌ [COLIS] Erreur récupération:", error.message);
    logger.error("Erreur récupération colis", {
      userId: req.user.userId,
      error: error.message,
    });
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des colis",
    });
  }
};

// ==================== SUPPRIMER UN COLIS (User) ====================
exports.deleteColis = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    console.log("🗑️ [COLIS] Suppression - ID:", id);

    const colis = await Colis.findOne({
      _id: id,
      userId: userId,
    });

    if (!colis) {
      return res.status(404).json({
        success: false,
        message: "Colis non trouvé",
      });
    }

    colis.actif = false;
    await colis.save();

    // ✅ INVALIDER CACHE
    await invalidateCache("cache:/api/colis*");

    logger.info("Colis supprimé", {
      userId,
      colisId: id,
    });

    return res.status(200).json({
      success: true,
      message: "Colis supprimé avec succès",
    });
  } catch (error) {
    console.error("❌ [COLIS] Erreur suppression:", error.message);
    logger.error("Erreur suppression colis", {
      userId: req.user.userId,
      colisId: req.params.id,
      error: error.message,
    });
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la suppression du colis",
    });
  }
};
