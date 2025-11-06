const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, "L'adresse mail est requise"],
      trim: true,
      lowercase: true,
      minlength: [5, "L'adresse mail doit contenir au moins 5 caractères"],
      maxlength: [50, "L'adresse mail ne doit pas dépasser 50 caractères"],
      unique: [true, "L'adresse mail doit être unique"],
    },
    password: {
      type: String,
      trim: true,
      select: true,
      required: [true, "Le mot de passe est requis"],
    },
    name: {
      type: String,
      trim: true,
    },
    role: {
      type: String,
      enum: ["user", "admin", "agent"],
      default: "user",
    },
    verified: {
      type: Boolean,
      default: false,
    },
    actif: {
      type: Boolean,
      default: true,
    },

    // ==================== CODES DE VÉRIFICATION ====================
    verificationCode: {
      type: String,
      select: false,
    },
    verificationCodeValidation: {
      type: Number,
      select: false,
    },
    forgotPasswordCode: {
      type: String,
      select: false,
    },
    forgotPasswordCodeValidation: {
      type: Number,
      select: false,
    },

    // ==================== STRIPE & ABONNEMENTS ====================
    stripeCustomerId: {
      type: String,
      default: null,
    },
    subscriptionStatus: {
      type: String,
      enum: ["none", "active", "inactive", "canceled", "past_due", "trialing"],
      default: "none",
    },
    subscriptionId: {
      type: String,
      default: null,
    },
    planId: {
      type: String,
      default: null,
    },
    subscriptionStartDate: {
      type: Date,
      default: null,
    },
    subscriptionEndDate: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("User", userSchema);
