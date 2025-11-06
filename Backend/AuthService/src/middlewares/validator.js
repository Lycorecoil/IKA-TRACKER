// const joi = require("joi");

// // Validation schema for user signup
// exports.signupSchema = joi.object({
//   email: joi.string().min(5).max(50).required().email(),
//   password: joi
//     .string()
//     .required()
//     .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/)
//     .messages({
//       "string.pattern.base":
//         "Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule et un chiffre",
//     }),
//   name: joi.string().min(2).max(50).required().messages({
//     "string.base": "Le nom doit être une chaîne de caractères",
//     "string.empty": "Le nom est requis",
//     "string.min": "Le nom doit contenir au moins 2 caractères",
//     "string.max": "Le nom ne doit pas dépasser 50 caractères",
//   }),
// });

// // Validation schema for user signin
// exports.signinSchema = joi.object({
//   email: joi.string().min(5).max(50).required().email(),
//   password: joi
//     .string()
//     .required()
//     .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/)
//     .messages({
//       "string.pattern.base":
//         "Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule et un chiffre",
//     }),
//   /*name: joi.string().min(2).max(50).required().messages({
//     "string.base": "Le nom doit être une chaîne de caractères",
//     "string.empty": "Le nom est requis",
//     "string.min": "Le nom doit contenir au moins 2 caractères",
//     "string.max": "Le nom ne doit pas dépasser 50 caractères",
//   }),*/
// });

// exports.acceptCodeSchema = joi.object({
//   email: joi.string().min(5).max(50).required().email(),
//   providedCode: joi.number().required(),
// });

// exports.changePasswordSchema = joi.object({
//   newPassword: joi
//     .string()
//     .required()
//     .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/),

//   oldPassword: joi
//     .string()
//     .required()
//     .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/),
// });

// exports.acceptFPCodeSchema = joi.object({
//   email: joi.string().min(5).max(50).required().email(),
//   providedCode: joi
//     .string()
//     .pattern(/^\d{6}$/)
//     .required()
//     .messages({
//       "string.pattern.base": "Le code doit contenir 6 chiffres.",
//     }),
//   newPassword: joi
//     .string()
//     .required()
//     .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/),
// });
const joi = require("joi");

// ==================== SCHÉMAS AUTH PRINCIPAUX ====================

// Schema pour l'inscription user
exports.signupSchema = joi.object({
  email: joi.string().min(5).max(50).required().email().messages({
    "string.email": "L'email est invalide",
    "string.min": "L'email doit contenir au moins 5 caractères",
    "string.max": "L'email ne doit pas dépasser 50 caractères",
    "any.required": "L'email est obligatoire",
  }),
  password: joi
    .string()
    .required()
    .min(8)
    .max(30)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .pattern(/^[a-zA-Z\d!@#$%^&*]+$/)
    .messages({
      "string.pattern.base":
        "Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et peut inclure !@#$%^&*",
      "string.min": "Le mot de passe doit contenir au moins 8 caractères",
      "string.max": "Le mot de passe ne doit pas dépasser 30 caractères",
      "any.required": "Le mot de passe est obligatoire",
    }),
  name: joi.string().min(2).max(50).required().messages({
    "string.base": "Le nom doit être une chaîne de caractères",
    "string.empty": "Le nom est requis",
    "string.min": "Le nom doit contenir au moins 2 caractères",
    "string.max": "Le nom ne doit pas dépasser 50 caractères",
    "any.required": "Le nom est obligatoire",
  }),
});

// Schema pour la connexion user
exports.signinSchema = joi.object({
  email: joi.string().min(5).max(50).required().email().messages({
    "string.email": "L'email est invalide",
    "any.required": "L'email est obligatoire",
  }),
  password: joi
    .string()
    .required()
    .min(8)
    .max(30)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .pattern(/^[a-zA-Z\d!@#$%^&*]+$/)
    .messages({
      "string.pattern.base":
        "Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et peut inclure !@#$%^&*",
      "any.required": "Le mot de passe est obligatoire",
    }),
});

// Schema pour l'inscription agent (appelé par CourierService)
exports.signupAgentSchema = joi.object({
  email: joi.string().min(5).max(50).required().email().messages({
    "string.email": "L'email est invalide",
    "any.required": "L'email est obligatoire",
  }),
  password: joi
    .string()
    .required()
    .min(8)
    .max(30)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .pattern(/^[a-zA-Z\d!@#$%^&*]+$/)
    .messages({
      "string.pattern.base":
        "Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et peut inclure !@#$%^&*",
      "any.required": "Le mot de passe est obligatoire",
    }),
  name: joi.string().min(2).max(50).required().messages({
    "string.base": "Le nom doit être une chaîne de caractères",
    "string.empty": "Le nom est requis",
    "string.min": "Le nom doit contenir au moins 2 caractères",
    "any.required": "Le nom est obligatoire",
  }),
  role: joi.string().valid("agent").default("agent"),
  agentNumber: joi.number().integer().positive().optional(),
  employerId: joi.string().optional(),
});

// ==================== SCHÉMAS VÉRIFICATION CODES ====================

// Schema pour la vérification de code email
exports.acceptCodeSchema = joi.object({
  email: joi.string().min(5).max(50).required().email().messages({
    "string.email": "L'email est invalide",
    "any.required": "L'email est obligatoire",
  }),
  providedCode: joi
    .number()
    .integer()
    .min(100000)
    .max(999999)
    .required()
    .messages({
      "number.base": "Le code doit être un nombre",
      "number.min": "Le code doit contenir 6 chiffres",
      "number.max": "Le code doit contenir 6 chiffres",
      "any.required": "Le code est obligatoire",
    }),
});

// Schema pour la vérification de code mot de passe oublié
exports.acceptFPCodeSchema = joi.object({
  email: joi.string().min(5).max(50).required().email().messages({
    "string.email": "L'email est invalide",
    "any.required": "L'email est obligatoire",
  }),
  providedCode: joi
    .string()
    .pattern(/^\d{6}$/)
    .required()
    .messages({
      "string.pattern.base": "Le code doit contenir exactement 6 chiffres",
      "any.required": "Le code est obligatoire",
    }),
  newPassword: joi
    .string()
    .required()
    .min(8)
    .max(30)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .pattern(/^[a-zA-Z\d!@#$%^&*]+$/)
    .messages({
      "string.pattern.base":
        "Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et peut inclure !@#$%^&*",
      "any.required": "Le nouveau mot de passe est obligatoire",
    }),
});

// ==================== SCHÉMAS MOT DE PASSE ====================

// Schema pour le changement de mot de passe
exports.changePasswordSchema = joi.object({
  oldPassword: joi.string().required().messages({
    "any.required": "L'ancien mot de passe est obligatoire",
  }),
  newPassword: joi
    .string()
    .required()
    .min(8)
    .max(30)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .pattern(/^[a-zA-Z\d!@#$%^&*]+$/)
    .messages({
      "string.pattern.base":
        "Le nouveau mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et peut inclure !@#$%^&*",
      "any.required": "Le nouveau mot de passe est obligatoire",
    }),
});
exports.validateRequest = (schema, property = "body") => {
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

      console.log("❌ Validation échouée:", errorDetails);
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
