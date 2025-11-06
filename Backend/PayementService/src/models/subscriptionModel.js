const mongoose = require("mongoose");

const subscriptionSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    stripeSubscriptionId: {
      type: String,
      required: true,
      unique: true,
    },
    stripeCustomerId: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "trialing", "past_due", "canceled", "unpaid"],
      default: "active",
    },
    planId: {
      type: String,
      required: true,
    },
    planName: {
      type: String,
      default: "Abonnement Standard",
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: "eur",
    },
    interval: {
      type: String,
      enum: ["day", "week", "month", "year"],
      default: "month",
    },

    // ✅ CHAMPS DE TEMPS (IMPORTANTS)
    subscriptionStartDate: {
      type: Date,
      required: true,
      default: () => new Date(),
    },
    subscriptionEndDate: {
      type: Date,
      default: null,
    },
    currentPeriodStart: {
      type: Date,
      required: true,
    },
    currentPeriodEnd: {
      type: Date,
      required: true,
    },
    renewalDate: {
      type: Date,
      default: null,
    },

    // ✅ CHAMPS D'ANNULATION
    cancelAtPeriodEnd: {
      type: Boolean,
      default: false,
    },
    canceledAt: {
      type: Date,
      default: null,
    },

    // ✅ PÉRIODES DE TRIAL
    trialStartDate: {
      type: Date,
      default: null,
    },
    trialEndDate: {
      type: Date,
      default: null,
    },

    // ✅ MÉTADONNÉES
    metadata: {
      type: Object,
      default: {},
    },
    actif: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// ✅ Index pour les requêtes fréquentes
subscriptionSchema.index({ userId: 1, status: 1 });
subscriptionSchema.index({ currentPeriodEnd: 1 });

module.exports = mongoose.model("Subscription", subscriptionSchema);
