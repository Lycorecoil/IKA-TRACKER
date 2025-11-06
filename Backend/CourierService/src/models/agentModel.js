const mongoose = require("mongoose");

const agentSchema = new mongoose.Schema(
  {
    _id: { type: String }, // ✅ AJOUT: Permet de définir l'ID manuellement
    numeroAgent: { type: Number, required: true },
    nom: { type: String, required: true },
    prenom: { type: String, required: true },
    telephone: { type: String, required: true },
    email: { type: String, required: true },
    adresse: { type: String },

    // Référence à l'utilisateur dans AuthService
    userId: { type: String, required: true },

    // Statut
    actif: { type: Boolean, default: true },
    disponible: { type: Boolean, default: true },

    // Statistiques
    nombreLivraisons: { type: Number, default: 0 },
    derniereLivraison: { type: Date },

    // Position
    position: {
      latitude: { type: Number },
      longitude: { type: Number },
      lastUpdate: { type: Date },
    },
  },
  {
    timestamps: true,
    versionKey: false,
    _id: false, // ✅ IMPORTANT: Désactive l'_id automatique de Mongoose
  }
);

agentSchema.index({ userId: 1 });
agentSchema.index({ numeroAgent: 1 });

module.exports = mongoose.model("Agent", agentSchema);
