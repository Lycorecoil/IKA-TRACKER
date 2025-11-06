const User = require("../models/usersModel");
const { logger, createServiceClient } = require("shared-middlewares");
const { eventBus, EVENTS } = require("../utils/eventBus");

// ✅ Initialiser le client Courier une seule fois
const courierClient = createServiceClient("courier");

// ==================== CASCADE DELETE AVEC SERVICE CLIENT ====================
const cascadeDeleteUserData = async (userId) => {
  try {
    // ✅ ServiceClient gère automatiquement : timeout, retry, logs, headers
    const result = await courierClient.post(
      `/api/admin/users/${userId}/cascade-delete`,
      { userId }
    );

    if (result.success) {
      logger.info(`Cascade delete successful for user ${userId}`, {
        userId,
        agentsDesactives: result.data?.agentsDesactives,
      });
    } else {
      logger.warn(`Cascade delete failed for user ${userId}`, {
        userId,
        message: result.message,
      });
    }
    return result;
  } catch (error) {
    // ServiceClient a déjà loggé l'erreur technique
    logger.warn(`Cascade delete communication error for user ${userId}`, {
      userId,
      error: error.message,
    });
    // On ne throw pas pour ne pas bloquer la suppression du user
    return { success: false, message: error.message };
  }
};

// ==================== GET ALL USERS ====================
exports.getAllUsers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      role = "",
      includeInactive = "false",
    } = req.query;

    let filter = {};

    if (includeInactive !== "true") {
      filter.actif = { $ne: false };
    }

    if (search) {
      filter.$or = [
        { email: { $regex: search, $options: "i" } },
        { name: { $regex: search, $options: "i" } },
      ];
    }

    if (role && ["user", "agent", "admin"].includes(role)) {
      filter.role = role;
    }

    const users = await User.find(filter)
      .select("-password -verificationCode -forgotPasswordCode")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(filter);

    logger.info("Users list retrieved", {
      adminUserId: req.user?.userId,
      page: parseInt(page),
      limit: parseInt(limit),
      totalUsers: total,
      filters: { search, role, includeInactive },
    });

    return res.status(200).json({
      success: true,
      data: users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error("Error retrieving users list", {
      adminUserId: req.user?.userId,
      error: error.message,
    });
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des utilisateurs",
    });
  }
};

// ==================== GET USER BY ID ====================
exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id).select(
      "-password -verificationCode -forgotPasswordCode"
    );

    if (!user) {
      logger.warn("Tentative accès utilisateur inexistant", {
        adminUserId: req.user?.userId,
        targetUserId: id,
      });
      return res.status(404).json({
        success: false,
        message: "Utilisateur non trouvé",
      });
    }

    logger.info("Profil utilisateur consulté", {
      adminUserId: req.user?.userId,
      targetUserId: id,
      targetUserEmail: user.email,
    });

    return res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    logger.error("Erreur récupération utilisateur par ID", {
      adminUserId: req.user?.userId,
      targetUserId: req.params.id,
      errorMessage: error.message,
    });
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération de l'utilisateur",
    });
  }
};

// ==================== UPDATE USER ROLE ====================
exports.updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    const validRoles = ["user", "agent", "admin"];
    if (!validRoles.includes(role)) {
      logger.warn("Tentative modification rôle avec valeur invalide", {
        adminUserId: req.user?.userId,
        targetUserId: id,
        attemptedRole: role,
      });
      return res.status(400).json({
        success: false,
        message: "Rôle invalide. Roles valides: user, agent, admin",
      });
    }

    const userBeforeUpdate = await User.findById(id);
    if (!userBeforeUpdate) {
      logger.warn("Tentative modification rôle utilisateur inexistant", {
        adminUserId: req.user?.userId,
        targetUserId: id,
      });
      return res.status(404).json({
        success: false,
        message: "Utilisateur non trouvé",
      });
    }

    const user = await User.findByIdAndUpdate(
      id,
      { role },
      { new: true }
    ).select("-password -verificationCode -forgotPasswordCode");

    logger.info("Rôle utilisateur modifié", {
      adminUserId: req.user?.userId,
      targetUserId: id,
      targetUserEmail: user.email,
      previousRole: userBeforeUpdate.role,
      newRole: role,
    });

    return res.status(200).json({
      success: true,
      message: `Rôle utilisateur mis à jour: ${role}`,
      data: user,
    });
  } catch (error) {
    logger.error("Erreur modification rôle utilisateur", {
      adminUserId: req.user?.userId,
      targetUserId: req.params.id,
      errorMessage: error.message,
    });
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la modification du rôle",
    });
  }
};

// ==================== DELETE USER ====================
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (id === req.user.userId) {
      return res.status(400).json({
        success: false,
        message: "Vous ne pouvez pas supprimer votre propre compte",
      });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Utilisateur non trouvé",
      });
    }

    // Désactiver le user
    user.actif = false;
    user.email = `deleted_${Date.now()}_${user.email}`;
    user.verified = false;
    await user.save();

    // Émettre l'événement asynchrone
    eventBus.emit(EVENTS.USER_DELETED, {
      userId: id,
      userEmail: user.email,
      deletedBy: req.user.userId,
    });

    logger.info("User deactivated and cascade event emitted", {
      adminUserId: req.user?.userId,
      targetUserId: id,
      targetUserEmail: user.email,
    });

    return res.status(200).json({
      success: true,
      message: "Utilisateur désactivé avec succès",
    });
  } catch (error) {
    logger.error("Error deactivating user", {
      adminUserId: req.user?.userId,
      targetUserId: req.params.id,
      error: error.message,
    });
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la désactivation de l'utilisateur",
    });
  }
};

// ==================== GET SYSTEM STATS ====================
exports.getSystemStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const verifiedUsers = await User.countDocuments({ verified: true });
    const adminUsers = await User.countDocuments({ role: "admin" });
    const agentUsers = await User.countDocuments({ role: "agent" });
    const regularUsers = await User.countDocuments({ role: "user" });

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentUsers = await User.countDocuments({
      createdAt: { $gte: sevenDaysAgo },
    });

    logger.info("Statistiques système consultées", {
      adminUserId: req.user?.userId,
      stats: {
        totalUsers,
        verifiedUsers,
        adminUsers,
        agentUsers,
        regularUsers,
        recentUsers,
      },
    });

    return res.status(200).json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          verified: verifiedUsers,
          unverified: totalUsers - verifiedUsers,
          admins: adminUsers,
          agents: agentUsers,
          regular: regularUsers,
          recent: recentUsers,
        },
      },
    });
  } catch (error) {
    logger.error("Erreur récupération statistiques système", {
      adminUserId: req.user?.userId,
      errorMessage: error.message,
    });
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des statistiques",
    });
  }
};
