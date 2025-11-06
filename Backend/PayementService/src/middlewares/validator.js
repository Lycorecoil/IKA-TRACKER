const Joi = require("joi");
const { logger } = require("shared-middlewares");

// ==================== SCHÉMAS DE VALIDATION ====================

// Schéma pour création abonnement
const createSubscriptionSchema = Joi.object({
  priceId: Joi.string().required().messages({
    "string.empty": "L'ID du prix est obligatoire",
    "any.required": "L'ID du prix est obligatoire",
  }),
});

// Schéma pour création paiement
const createPaymentSchema = Joi.object({
  amount: Joi.number().integer().min(100).required().messages({
    "number.base": "Le montant doit être un nombre",
    "number.min": "Le montant minimum est de 1€ (100 centimes)",
    "any.required": "Le montant est obligatoire",
  }),
  description: Joi.string().max(255).optional(),
  metadata: Joi.object().optional(),
});

// Schéma pour session checkout
const checkoutSessionSchema = Joi.object({
  priceId: Joi.string().required().messages({
    "string.empty": "L'ID du prix est obligatoire",
    "any.required": "L'ID du prix est obligatoire",
  }),
});

// ==================== MIDDLEWARES DE VALIDATION ====================

const validateRequest = (schema, property = "body") => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errorDetails = error.details.map((detail) => ({
        field: detail.path.join("."),
        message: detail.message,
      }));

      logger.warn("Validation échouée - PaymentService", {
        url: req.url,
        method: req.method,
        userId: req.user?.userId,
        errors: errorDetails,
      });

      return res.status(400).json({
        success: false,
        message: "Données invalides",
        errors: errorDetails,
      });
    }

    req[property] = value;
    next();
  };
};

// ==================== MIDDLEWARES SPÉCIFIQUES ====================

// Abonnements
exports.validateCreateSubscription = validateRequest(createSubscriptionSchema);
exports.validateCheckoutSession = validateRequest(checkoutSessionSchema);

// Paiements
exports.validateCreatePayment = validateRequest(createPaymentSchema);

// Validation des paramètres ID
exports.validateObjectId = (paramName = "id") => {
  return (req, res, next) => {
    const idSchema = Joi.string().required().messages({
      "string.empty": "L'ID est obligatoire",
    });

    const { error } = idSchema.validate(req.params[paramName]);

    if (error) {
      logger.warn("ID invalide dans les paramètres - PaymentService", {
        url: req.url,
        method: req.method,
        userId: req.user?.userId,
        providedId: req.params[paramName],
      });

      return res.status(400).json({
        success: false,
        message: "ID invalide",
      });
    }

    next();
  };
};
