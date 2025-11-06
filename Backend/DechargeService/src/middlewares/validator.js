// const Joi = require("joi");
// const { logger } = require("shared-middlewares");

// // ==================== SCHÉMAS DE VALIDATION ====================

// // Schéma pour Colis
// const colisSchema = Joi.object({
//   title: Joi.string().trim().min(1).max(100).required().messages({
//     "string.empty": "Le titre est obligatoire",
//     "any.required": "Le titre est obligatoire",
//   }),
//   description: Joi.string().trim().min(1).max(500).required().messages({
//     "string.empty": "La description est obligatoire",
//     "any.required": "La description est obligatoire",
//   }),
//   referenceNumber: Joi.string().trim().max(50).optional(),
//   destination: Joi.string().trim().min(1).max(255).required().messages({
//     "string.empty": "La destination est obligatoire",
//     "any.required": "La destination est obligatoire",
//   }),
// });

// // Schéma pour assignation colis
// const assignColisSchema = Joi.object({
//   agentId: Joi.string().hex().length(24).required().messages({
//     "string.hex": "L'ID agent est invalide",
//     "string.length": "L'ID agent doit avoir 24 caractères",
//     "any.required": "L'agent est obligatoire",
//   }),
// });

// // Schéma pour Décharge
// const dechargeSchema = Joi.object({
//   colisId: Joi.string().hex().length(24).required().messages({
//     "string.hex": "L'ID colis est invalide",
//     "string.length": "L'ID colis doit avoir 24 caractères",
//     "any.required": "Le colis est obligatoire",
//   }),
//   nomDestinataire: Joi.string().trim().min(1).max(100).required().messages({
//     "string.empty": "Le nom du destinataire est obligatoire",
//     "any.required": "Le nom du destinataire est obligatoire",
//   }),
//   telephoneDestinataire: Joi.string()
//     .trim()
//     .pattern(/^\+?[0-9\s\-\(\)]{10,}$/)
//     .optional()
//     .messages({
//       "string.pattern.base": "Le format du téléphone est invalide",
//     }),
//   positionLivraison: Joi.object({
//     latitude: Joi.number().min(-90).max(90).required(),
//     longitude: Joi.number().min(-180).max(180).required(),
//   })
//     .required()
//     .messages({
//       "any.required": "La position est obligatoire",
//     }),
//   adresseLivraison: Joi.string().trim().min(1).max(255).required().messages({
//     "string.empty": "L'adresse de livraison est obligatoire",
//     "any.required": "L'adresse de livraison est obligatoire",
//   }),
//   signature: Joi.string().trim().min(1).required().messages({
//     "string.empty": "La signature est obligatoire",
//     "any.required": "La signature est obligatoire",
//   }),
//   photoLivraison: Joi.string().uri().optional().messages({
//     "string.uri": "La photo doit être une URL valide",
//   }),
//   commentaireAgent: Joi.string().trim().max(500).optional(),
// });

// // Schéma pour unassign agent (interne)
// const unassignAgentSchema = Joi.object({
//   agentId: Joi.string().hex().length(24).required(),
// });

// // ==================== MIDDLEWARES DE VALIDATION ====================

// const validateRequest = (schema, property = "body") => {
//   return (req, res, next) => {
//     console.log("🔍 [VALIDATOR] validateRequest - Début", {
//       property,
//       url: req.url,
//       method: req.method,
//     });

//     const { error, value } = schema.validate(req[property], {
//       abortEarly: false,
//       stripUnknown: true,
//     });

//     if (error) {
//       console.log("❌ [VALIDATOR] validateRequest - Erreur", error.details);
//       const errorDetails = error.details.map((detail) => ({
//         field: detail.path.join("."),
//         message: detail.message,
//       }));

//       logger.warn("Validation échouée", {
//         url: req.url,
//         method: req.method,
//         userId: req.user?.userId,
//         errors: errorDetails,
//       });

//       return res.status(400).json({
//         success: false,
//         message: "Données invalides",
//         errors: errorDetails,
//       });
//     }

//     console.log("✅ [VALIDATOR] validateRequest - Succès");
//     req[property] = value;
//     next();
//   };
// };

// // ==================== MIDDLEWARES SPÉCIFIQUES ====================

// // Colis
// exports.validateCreateColis = validateRequest(colisSchema);
// exports.validateAssignColis = validateRequest(assignColisSchema);

// // Décharge
// exports.validateCreateDecharge = validateRequest(dechargeSchema);

// // Interne
// exports.validateUnassignAgent = validateRequest(unassignAgentSchema);

// // Validation des paramètres ID
// exports.validateObjectId = (paramName = "id") => {
//   return (req, res, next) => {
//     console.log("🔍 [VALIDATOR] validateObjectId - Début", {
//       paramName,
//       id: req.params[paramName],
//       url: req.url,
//     });

//     const idSchema = Joi.string().hex().length(24).required();
//     const { error } = idSchema.validate(req.params[paramName]);

//     if (error) {
//       console.log("❌ [VALIDATOR] validateObjectId - Erreur", error.message);
//       logger.warn("ID invalide dans les paramètres", {
//         url: req.url,
//         method: req.method,
//         userId: req.user?.userId,
//         providedId: req.params[paramName],
//       });

//       return res.status(400).json({
//         success: false,
//         message: "ID invalide",
//       });
//     }

//     console.log("✅ [VALIDATOR] validateObjectId - Succès");
//     next();
//   };
// };

// // 🎯 EXPORT DU MIDDLEWARE GÉNÉRIQUE
// exports.validateRequest = validateRequest;

// console.log("✅ Validateur DechargeService chargé avec logs de debug");
const Joi = require("joi");
const { logger } = require("shared-middlewares");

// ==================== SCHÉMAS DE VALIDATION ====================

// Schéma pour Colis
const colisSchema = Joi.object({
  title: Joi.string().trim().min(1).max(100).required().messages({
    "string.empty": "Le titre est obligatoire",
    "any.required": "Le titre est obligatoire",
  }),
  description: Joi.string().trim().min(1).max(500).required().messages({
    "string.empty": "La description est obligatoire",
    "any.required": "La description est obligatoire",
  }),
  referenceNumber: Joi.string().trim().max(50).optional(),
  destination: Joi.string().trim().min(1).max(255).required().messages({
    "string.empty": "La destination est obligatoire",
    "any.required": "La destination est obligatoire",
  }),
  deliveryDate: Joi.date().optional(),
});

// Schéma pour assigner un colis à un agent
const assignColisSchema = Joi.object({
  agentId: Joi.string().hex().length(24).required().messages({
    "string.empty": "L'ID de l'agent est obligatoire",
    "string.hex": "L'ID de l'agent doit être un ID valide",
    "string.length": "L'ID de l'agent doit faire 24 caractères",
    "any.required": "L'ID de l'agent est obligatoire",
  }),
});

// Schéma pour créer une décharge
const dechargeSchema = Joi.object({
  colisId: Joi.string().hex().length(24).required().messages({
    "string.empty": "L'ID du colis est obligatoire",
    "string.hex": "L'ID du colis doit être un ID valide",
    "string.length": "L'ID du colis doit faire 24 caractères",
    "any.required": "L'ID du colis est obligatoire",
  }),

  nomDestinataire: Joi.string().trim().min(1).max(100).required().messages({
    "string.empty": "Le nom du destinataire est obligatoire",
    "string.min": "Le nom doit contenir au moins 1 caractère",
    "string.max": "Le nom ne peut pas dépasser 100 caractères",
    "any.required": "Le nom du destinataire est obligatoire",
  }),

  fonctionDestinataire: Joi.string()
    .trim()
    .min(1)
    .max(100)
    .required()
    .messages({
      "string.empty": "La fonction du destinataire est obligatoire",
      "string.min": "La fonction doit contenir au moins 1 caractère",
      "string.max": "La fonction ne peut pas dépasser 100 caractères",
      "any.required": "La fonction du destinataire est obligatoire",
    }),

  telephoneDestinataire: Joi.string()
    .trim()
    .pattern(/^\+?[0-9\s\-\(\)]{10,}$/)
    .optional()
    .messages({
      "string.pattern.base": "Le format du téléphone est invalide",
    }),

  signature: Joi.string().required().messages({
    "string.empty": "La signature est obligatoire",
    "any.required": "La signature est obligatoire",
  }),

  positionLivraison: Joi.object({
    latitude: Joi.number().min(-90).max(90).required().messages({
      "number.base": "La latitude doit être un nombre",
      "number.min": "La latitude doit être supérieure ou égale à -90",
      "number.max": "La latitude doit être inférieure ou égale à 90",
      "any.required": "La latitude est obligatoire",
    }),
    longitude: Joi.number().min(-180).max(180).required().messages({
      "number.base": "La longitude doit être un nombre",
      "number.min": "La longitude doit être supérieure ou égale à -180",
      "number.max": "La longitude doit être inférieure ou égale à 180",
      "any.required": "La longitude est obligatoire",
    }),
    precision: Joi.number().optional(),
  })
    .required()
    .messages({
      "any.required": "La position GPS est obligatoire",
      "object.base": "La position GPS doit être un objet valide",
    }),

  adresseLivraison: Joi.string().trim().max(255).optional(),

  commentaireAgent: Joi.string().trim().max(500).optional().messages({
    "string.max": "Le commentaire ne peut pas dépasser 500 caractères",
  }),

  commentaireDestinataire: Joi.string().trim().max(500).optional().messages({
    "string.max": "Le commentaire ne peut pas dépasser 500 caractères",
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

// Colis
exports.validateCreateColis = validateRequest(colisSchema);
exports.validateAssignColis = validateRequest(assignColisSchema);

// Décharge
exports.validateCreateDecharge = validateRequest(dechargeSchema);

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
