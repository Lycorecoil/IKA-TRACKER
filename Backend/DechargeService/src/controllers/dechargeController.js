const Decharge = require("../models/dechargeModel");
const Colis = require("../models/colisModel");
const { logger } = require("shared-middlewares");
const { invalidateCache } = require("shared-middlewares/cacheHelper");

// 🎯 CRÉER UNE DÉCHARGE (Agent)
exports.createDecharge = async (req, res) => {
  try {
    console.log("🔍 [DECHARGE] Début createDecharge");
    console.log("🔍 [DECHARGE] Agent ID:", req.user.userId);
    console.log("🔍 [DECHARGE] Body:", req.body);

    const {
      colisId,
      nomDestinataire,
      fonctionDestinataire,
      telephoneDestinataire,
      positionLivraison,
      adresseLivraison,
      signature,
      photoLivraison,
      commentaireAgent,
    } = req.body;

    // ✅ VÉRIFIER QUE L'UTILISATEUR EST UN AGENT
    if (req.user.role !== "agent") {
      console.log("❌ [DECHARGE] Utilisateur n'est pas un agent");
      return res.status(403).json({
        success: false,
        message: "Seuls les agents peuvent créer des décharges",
      });
    }

    // ✅ VÉRIFIER QUE LE COLIS EXISTE ET EST ASSIGNÉ
    console.log("🔍 [DECHARGE] Recherche colis:", {
      colisId,
      agentId: req.user.userId,
    });

    const colis = await Colis.findOne({
      _id: colisId,
      agentId: req.user.userId,
      status: { $in: ["assigné", "en_cours"] },
    });

    console.log("🔍 [DECHARGE] Colis trouvé:", colis ? "OUI" : "NON");

    if (!colis) {
      console.log("❌ [DECHARGE] Colis non trouvé ou non assigné");
      return res.status(404).json({
        success: false,
        message: "Colis non trouvé ou non assigné à cet agent",
      });
    }

    console.log("🔍 [DECHARGE] Détails colis:", {
      id: colis._id,
      agentId: colis.agentId,
      userId: colis.userId,
    });

    // ✅ CRÉER LA DÉCHARGE
    console.log("🔍 [DECHARGE] Création de la décharge...");

    const nouvelleDecharge = new Decharge({
      colisId,
      agentId: req.user.userId,
      userId: colis.userId,
      nomDestinataire,
      fonctionDestinataire,
      telephoneDestinataire,
      positionLivraison,
      adresseLivraison,
      signature,
      photoLivraison,
      commentaireAgent,
      dateLivraison: new Date(),
    });

    const decharge = await nouvelleDecharge.save();
    console.log("✅ [DECHARGE] Décharge créée:", decharge._id);

    // ✅ METTRE À JOUR LE COLIS
    console.log("🔍 [DECHARGE] Mise à jour du colis...");

    colis.status = "livré";
    colis.dateLivraison = decharge.dateLivraison;
    colis.dechargeId = decharge._id;
    await colis.save();

    console.log("✅ [DECHARGE] Colis mis à jour");

    // ✅ INVALIDER CACHE
    await invalidateCache("cache:/api/decharges*");
    await invalidateCache("cache:/api/colis*");

    logger.info("Décharge créée avec succès", {
      agentId: req.user.userId,
      colisId: colisId,
      dechargeId: decharge._id,
    });

    return res.status(201).json({
      success: true,
      message: "Décharge créée avec succès",
      data: decharge,
    });
  } catch (error) {
    console.error("💥 [DECHARGE] Erreur création décharge:", error.message);
    logger.error("Erreur création décharge", {
      agentId: req.user.userId,
      error: error.message,
    });
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la création de la décharge",
    });
  }
};

// 🎯 LISTE DES DÉCHARGES (User/Agent)
exports.getDecharges = async (req, res) => {
  try {
    console.log("🔍 [DECHARGE] getDecharges - User:", {
      userId: req.user.userId,
      role: req.user.role,
    });

    let filter = {};

    if (req.user.role === "user") {
      filter.userId = req.user.userId;
    } else if (req.user.role === "agent") {
      filter.agentId = req.user.userId;
    }

    const { page = 1, limit = 10 } = req.query;

    const decharges = await Decharge.find(filter)
      .populate("colisId")
      .sort({ dateLivraison: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Decharge.countDocuments(filter);

    console.log("✅ [DECHARGE] Décharges trouvées:", decharges.length);

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
    console.error("💥 [DECHARGE] Erreur récupération:", error.message);
    logger.error("Erreur récupération décharges", {
      userId: req.user.userId,
      error: error.message,
    });
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des décharges",
    });
  }
};

// 🎯 CONSULTER UNE DÉCHARGE (User/Agent)
exports.getDechargeById = async (req, res) => {
  try {
    console.log("🔍 [DECHARGE] getDechargeById - ID:", req.params.id);

    const { id } = req.params;

    let filter = { _id: id };
    if (req.user.role === "user") {
      filter.userId = req.user.userId;
    } else if (req.user.role === "agent") {
      filter.agentId = req.user.userId;
    }

    const decharge = await Decharge.findOne(filter).populate("colisId");

    if (!decharge) {
      console.log("❌ [DECHARGE] Décharge non trouvée");
      return res.status(404).json({
        success: false,
        message: "Décharge non trouvée",
      });
    }

    console.log("✅ [DECHARGE] Décharge récupérée");

    return res.status(200).json({
      success: true,
      data: decharge,
    });
  } catch (error) {
    console.error("💥 [DECHARGE] Erreur récupération:", error.message);
    logger.error("Erreur récupération décharge", {
      userId: req.user.userId,
      dechargeId: req.params.id,
      error: error.message,
    });
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération de la décharge",
    });
  }
};
