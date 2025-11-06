// const mongoose = require("mongoose");

// const dechargeSchema = new mongoose.Schema(
//   {
//     colisId: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Colis",
//       required: true,
//     },
//     agentId: { type: String, required: true },
//     userId: { type: String, required: true },

//     // Informations de livraison
//     nomDestinataire: { type: String, required: true },
//     telephoneDestinataire: { type: String },
//     adresseLivraison: { type: String, required: true },

//     // Géolocalisation
//     positionLivraison: {
//       latitude: { type: Number, required: true },
//       longitude: { type: Number, required: true },
//     },

//     // Preuve de livraison
//     signature: { type: String, required: true },
//     photoLivraison: { type: String },

//     // Commentaires
//     commentaireAgent: { type: String },
//     commentaireDestinataire: { type: String },

//     // Timestamps
//     dateLivraison: { type: Date, default: Date.now },
//   },
//   {
//     timestamps: true,
//     versionKey: false,
//   }
// );

// dechargeSchema.index({ colisId: 1 });
// dechargeSchema.index({ userId: 1 });
// dechargeSchema.index({ agentId: 1 });

// module.exports = mongoose.model("Decharge", dechargeSchema);
const mongoose = require("mongoose");

const dechargeSchema = new mongoose.Schema(
  {
    // Référence au colis
    colisId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Colis",
      required: true,
    },

    // Référence à l'agent qui livre
    agentId: { type: String, required: true },

    // Référence au propriétaire du colis (user)
    userId: { type: String, required: true },

    // ==================== INFORMATIONS DESTINATAIRE ====================
    nomDestinataire: {
      type: String,
      required: true,
      trim: true,
    },

    fonctionDestinataire: {
      type: String,
      required: true,
      trim: true,
    },

    telephoneDestinataire: {
      type: String,
      trim: true,
    },

    // ==================== PREUVE DE LIVRAISON ====================
    signature: {
      type: String, // Base64 image de la signature
      required: true,
    },

    // Position GPS au moment de la livraison
    positionLivraison: {
      latitude: {
        type: Number,
        required: true,
      },
      longitude: {
        type: Number,
        required: true,
      },
      precision: {
        type: Number, // Précision en mètres
      },
    },

    adresseLivraison: {
      type: String,
      trim: true,
    },

    // ==================== COMMENTAIRES ====================
    commentaireAgent: {
      type: String,
      trim: true,
    },

    commentaireDestinataire: {
      type: String,
      trim: true,
    },

    // ==================== DATE DE LIVRAISON ====================
    dateLivraison: {
      type: Date,
      default: Date.now,
      required: true,
    },
  },
  {
    timestamps: true, // createdAt, updatedAt automatiques
    versionKey: false,
  }
);

// Index pour optimiser les recherches
dechargeSchema.index({ colisId: 1 });
dechargeSchema.index({ userId: 1 });
dechargeSchema.index({ agentId: 1 });
dechargeSchema.index({ dateLivraison: -1 });

module.exports = mongoose.model("Decharge", dechargeSchema);
