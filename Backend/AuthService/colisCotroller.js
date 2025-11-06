const Colis = require("../models/Colis");
const { logger } = require("shared-middlewares");

// 🎯 CRÉER UN COLIS (User)
exports.createColis = async (req, res) => {
  try {
    const { title, description, referenceNumber, destination, deliveryDate } =
      req.body;

    // Vérifier unicité référence
    if (referenceNumber) {
      const existingColis = await Colis.findOne({
        referenceNumber: referenceNumber,
        userId: req.user.userId,
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
      userId: req.user.userId,
    });

    const result = await newColis.save();

    logger.info("Colis créé avec succès", {
      userId: req.user.userId,
      colisId: result._id,
    });

    return res.status(201).json({
      success: true,
      message: "Colis créé avec succès",
      data: result,
    });
  } catch (error) {
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

// 🎯 ASSIGNER UN COLIS À UN AGENT (User)
exports.assignColis = async (req, res) => {
  try {
    const { id } = req.params;
    const { agentId } = req.body;

    // Vérifier que le colis appartient au user
    const colis = await Colis.findOne({
      _id: id,
      userId: req.user.userId,
      actif: true,
    });

    if (!colis) {
      return res.status(404).json({
        success: false,
        message: "Colis non trouvé",
      });
    }

    // Vérifier que l'agent appartient au user (via CourierService)
    try {
      const response = await fetch(
        `${process.env.COURIER_SERVICE_URL}/api/agents/${agentId}`,
        {
          headers: {
            Authorization: req.headers.authorization,
            "X-Internal-API-Key": process.env.INTERNAL_API_KEY,
          },
        }
      );

      if (!response.ok) {
        return res.status(404).json({
          success: false,
          message: "Agent non trouvé ou non autorisé",
        });
      }
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Erreur de communication avec le service coursier",
      });
    }

    // Assigner le colis
    colis.agentId = agentId;
    colis.status = "assigné";
    colis.dateAssignation = new Date();
    await colis.save();

    logger.info("Colis assigné à agent", {
      userId: req.user.userId,
      colisId: id,
      agentId: agentId,
    });

    return res.status(200).json({
      success: true,
      message: "Colis assigné avec succès",
      data: colis,
    });
  } catch (error) {
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

// 🎯 LIBÉRER LES COLIS D'UN AGENT (Interne - appelé par CourierService)
exports.unassignAgentColis = async (req, res) => {
  try {
    const { agentId } = req.body;

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

// 🎯 LISTE DES COLIS (User/Agent)
exports.getColis = async (req, res) => {
  try {
    let filter = { actif: true };

    if (req.user.role === "user") {
      filter.userId = req.user.userId;
    } else if (req.user.role === "agent") {
      filter.agentId = req.user.userId;
    }

    const { page = 1, limit = 10, status } = req.query;
    if (status) filter.status = status;

    const colis = await Colis.find(filter)
      .populate("dechargeId")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Colis.countDocuments(filter);

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

// 🎯 SUPPRIMER UN COLIS (User)
exports.deleteColis = async (req, res) => {
  try {
    const { id } = req.params;

    const colis = await Colis.findOne({
      _id: id,
      userId: req.user.userId,
    });

    if (!colis) {
      return res.status(404).json({
        success: false,
        message: "Colis non trouvé",
      });
    }

    colis.actif = false;
    await colis.save();

    logger.info("Colis supprimé", {
      userId: req.user.userId,
      colisId: id,
    });

    return res.status(200).json({
      success: true,
      message: "Colis supprimé avec succès",
    });
  } catch (error) {
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
