const Joi = require("joi");
const { logger } = require("shared-middlewares");

// ==================== SCHÉMAS DE VALIDATION AGENTS ====================

// Schéma pour Agent
const agentSchema = Joi.object({
  numeroAgent: Joi.number().integer().positive().required().messages({
    "number.base": "Le numéro d'agent doit être un nombre",
    "number.positive": "Le numéro d'agent doit être positif",
    "any.required": "Le numéro d'agent est obligatoire",
  }),
  nom: Joi.string().trim().min(1).max(100).required().messages({
    "string.empty": "Le nom est obligatoire",
    "string.min": "Le nom doit contenir au moins 1 caractère",
    "any.required": "Le nom est obligatoire",
  }),
  prenom: Joi.string().trim().min(1).max(100).required().messages({
    "string.empty": "Le prénom est obligatoire",
    "any.required": "Le prénom est obligatoire",
  }),
  telephone: Joi.string()
    .trim()
    .pattern(/^\+?[0-9\s\-\(\)]{10,}$/)
    .required()
    .messages({
      "string.pattern.base": "Le format du téléphone est invalide",
      "any.required": "Le téléphone est obligatoire",
    }),
  email: Joi.string().email().trim().lowercase().required().messages({
    "string.email": "L'email est invalide",
    "any.required": "L'email est obligatoire",
  }),
  adresse: Joi.string().trim().max(255).optional(),
});

// Schéma pour admin - suspension utilisateur
const toggleUserStatusSchema = Joi.object({
  actif: Joi.boolean().required().messages({
    "boolean.base": "Le statut doit être vrai ou faux",
    "any.required": "Le statut est obligatoire",
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

      logger.warn("Validation échouée", {
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

// Agent
exports.validateCreateAgent = validateRequest(agentSchema);
exports.validateUpdateAgent = validateRequest(agentSchema);

// Admin
exports.validateToggleUserStatus = validateRequest(toggleUserStatusSchema);

// Validation des paramètres ID
exports.validateObjectId = (paramName = "id") => {
  return (req, res, next) => {
    const idSchema = Joi.string().hex().length(24).required();
    const { error } = idSchema.validate(req.params[paramName]);

    if (error) {
      logger.warn("ID invalide dans les paramètres", {
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
