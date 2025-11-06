const safeSerialize = (err) => {
  if (!err) return null;

  // Si c’est déjà une erreur classique
  if (err instanceof Error) {
    return {
      message: err.message,
      stack: err.stack,
      name: err.name,
    };
  }

  // Si c’est un objet sans .message (ex: { code: 11000 })
  if (typeof err === "object") {
    return {
      message: err.message || "Erreur sans message explicite",
      ...err,
    };
  }

  // Si c’est une string ou autre type
  return { message: String(err) };
};

const logger = {
  info: (message, meta = {}) => {
    console.log(
      JSON.stringify({
        level: "INFO",
        timestamp: new Date().toISOString(),
        message,
        ...meta,
      })
    );
  },

  error: (message, error = {}) => {
    console.error(
      JSON.stringify({
        level: "ERROR",
        timestamp: new Date().toISOString(),
        message,
        error: safeSerialize(error),
      })
    );
  },

  warn: (message, meta = {}) => {
    console.warn(
      JSON.stringify({
        level: "WARN",
        timestamp: new Date().toISOString(),
        message,
        ...meta,
      })
    );
  },

  // Log spécifique pour les actions métier
  courrier: (action, userId, courrierId, details = {}) => {
    console.log(
      JSON.stringify({
        level: "INFO",
        timestamp: new Date().toISOString(),
        type: "COURRIER_ACTION",
        action,
        userId,
        courrierId,
        ...details,
      })
    );
  },
};

module.exports = { logger };
