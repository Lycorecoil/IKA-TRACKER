const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    stripePaymentIntentId: {
      type: String,
      required: true,
      unique: true,
    },
    stripeCustomerId: { type: String, required: true },

    // Détails du paiement
    amount: { type: Number, required: true }, // en centimes
    currency: { type: String, default: "eur" },
    status: {
      type: String,
      enum: [
        "requires_payment_method",
        "requires_confirmation",
        "requires_action",
        "processing",
        "requires_capture",
        "canceled",
        "succeeded",
      ],
      required: true,
    },

    // Description
    description: { type: String },
    metadata: { type: Object },

    // Méthode de paiement
    paymentMethod: { type: String },
    paymentMethodType: { type: String },

    actif: { type: Boolean, default: true },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

paymentSchema.index({ userId: 1 });
paymentSchema.index({ stripePaymentIntentId: 1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ createdAt: 1 });

module.exports = mongoose.model("Payment", paymentSchema);
