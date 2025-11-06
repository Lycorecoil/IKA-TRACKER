const Colis = require("../models/colisModel");
const Decharge = require("../models/dechargeModel");
const { logger } = require("shared-middlewares");

// Dashboard admin - Statistiques colis/décharges
exports.getDashboard = async (req, res) => {
  try {
    const stats = await Promise.all([
      Colis.countDocuments(),
      Colis.countDocuments({ status: "livré" }),
      Colis.countDocuments({ actif: false }),
      Decharge.countDocuments(),
      Colis.countDocuments({ status: "en_attente" }),
      Colis.countDocuments({ status: "en_cours" }),
    ]);

    const dashboard = {
      totalColis: stats[0],
      colisLivres: stats[1],
      colisSupprimes: stats[2],
      totalDecharges: stats[3],
      colisEnAttente: stats[4],
      colisEnCours: stats[5],
      tauxLivraison:
        stats[0] > 0 ? ((stats[1] / stats[0]) * 100).toFixed(2) : 0,
    };

    logger.info("Consultation dashboard DechargeService", {
      adminId: req.user.userId,
    });

    return res.status(200).json({
      success: true,
      data: dashboard,
    });
  } catch (error) {
    logger.error("Erreur récupération dashboard admin", {
      adminId: req.user.userId,
      errorMessage: error.message,
    });
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des statistiques",
    });
  }
};

// Voir tous les colis de la plateforme (admin)
exports.getAllColis = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, userId } = req.query;

    let filter = {};
    if (status) filter.status = status;
    if (userId) filter.userId = userId;

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
    logger.error("Erreur récupération liste colis admin", {
      adminId: req.user.userId,
      errorMessage: error.message,
    });
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des colis",
    });
  }
};

// Voir un colis spécifique (admin)
exports.getColisById = async (req, res) => {
  try {
    const { id } = req.params;

    const colis = await Colis.findById(id).populate("dechargeId");

    if (!colis) {
      return res.status(404).json({
        success: false,
        message: "Colis non trouvé",
      });
    }

    return res.status(200).json({
      success: true,
      data: colis,
    });
  } catch (error) {
    logger.error("Erreur récupération colis admin", {
      adminId: req.user.userId,
      colisId: req.params.id,
      errorMessage: error.message,
    });
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération du colis",
    });
  }
};

// Voir toutes les décharges (admin)
exports.getAllDecharges = async (req, res) => {
  try {
    const { page = 1, limit = 20, userId, agentId } = req.query;

    let filter = {};
    if (userId) filter.userId = userId;
    if (agentId) filter.agentId = agentId;

    const decharges = await Decharge.find(filter)
      .populate("colisId")
      .sort({ dateLivraison: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Decharge.countDocuments(filter);

    return res.status(200).json({
      success: true,
      data: decharges,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error("Erreur récupération liste décharges admin", {
      adminId: req.user.userId,
      errorMessage: error.message,
    });
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des décharges",
    });
  }
};

// Voir une décharge spécifique (admin)
exports.getDechargeById = async (req, res) => {
  try {
    const { id } = req.params;

    const decharge = await Decharge.findById(id).populate("colisId");

    if (!decharge) {
      return res.status(404).json({
        success: false,
        message: "Décharge non trouvée",
      });
    }

    return res.status(200).json({
      success: true,
      data: decharge,
    });
  } catch (error) {
    logger.error("Erreur récupération décharge admin", {
      adminId: req.user.userId,
      dechargeId: req.params.id,
      errorMessage: error.message,
    });
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération de la décharge",
    });
  }
};

// Supprimer un colis (admin)
exports.deleteColis = async (req, res) => {
  try {
    const { id } = req.params;

    const colis = await Colis.findById(id);
    if (!colis) {
      return res.status(404).json({
        success: false,
        message: "Colis non trouvé",
      });
    }

    colis.actif = false;
    await colis.save();

    logger.info("Suppression colis admin", {
      adminId: req.user.userId,
      colisId: id,
    });

    return res.status(200).json({
      success: true,
      message: "Colis supprimé avec succès",
    });
  } catch (error) {
    logger.error("Erreur suppression colis admin", {
      adminId: req.user.userId,
      colisId: req.params.id,
      errorMessage: error.message,
    });
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la suppression du colis",
    });
  }
};

// Route interne pour libérer les colis d'un agent (appelé par courier-service)
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
