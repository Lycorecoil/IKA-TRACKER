const { eventBus, EVENTS } = require("../utils/eventBus");
const { coursierClient } = require("../utils/apiClient");
const { logger } = require("shared-middlewares");

// Écouter les événements de suppression d'utilisateur
eventBus.on(EVENTS.USER_DELETED, async (data) => {
  const { userId, userEmail, deletedBy } = data;

  try {
    logger.info("Processing cascade delete for user", { userId, deletedBy });

    await coursierClient.post(`/api/admin/users/${userId}/cascade-delete`);

    logger.info("Cascade delete completed successfully", { userId });
  } catch (error) {
    logger.error("Cascade delete failed", {
      userId,
      error: error.message,
      // On log l'erreur mais on ne bloque pas le processus principal
    });
  }
});

module.exports = { eventBus, EVENTS };
