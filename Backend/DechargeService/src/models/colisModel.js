const mongoose = require("mongoose");

const colisSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    referenceNumber: { type: String, unique: true },
    destination: { type: String, required: true },

    // Référence à l'utilisateur dans AuthService
    userId: { type: String, required: true },

    // Référence à l'agent dans CourierService
    agentId: { type: String },

    status: {
      type: String,
      enum: ["en_attente", "assigné", "en_cours", "livré", "annulé"],
      default: "en_attente",
    },

    dateAssignation: { type: Date },
    dateLivraison: { type: Date },

    dechargeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Decharge",
    },

    actif: { type: Boolean, default: true },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

colisSchema.index({ userId: 1 });
colisSchema.index({ agentId: 1 });
colisSchema.index({ referenceNumber: 1 });
colisSchema.index({ userId: 1, status: 1 });

module.exports = mongoose.model("Colis", colisSchema);
