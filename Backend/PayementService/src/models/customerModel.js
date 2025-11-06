const mongoose = require("mongoose");

const customerSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
    },
    stripeCustomerId: {
      type: String,
      required: true,
      unique: true,
    },
    email: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },

    // Métadonnées Stripe
    metadata: {
      subscriptionActive: { type: Boolean, default: false },
      defaultPaymentMethod: { type: String },
      invoiceSettings: { type: Object },
    },

    actif: { type: Boolean, default: true },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

customerSchema.index({ userId: 1 });
customerSchema.index({ stripeCustomerId: 1 });

module.exports = mongoose.model("Customer", customerSchema);
