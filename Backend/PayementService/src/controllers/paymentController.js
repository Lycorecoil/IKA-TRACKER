const Payment = require("../models/paymentModel");
const Customer = require("../models/customerModel");
const stripeService = require("../../services/stripeService");
const { logger } = require("shared-middlewares");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

// 🎯 CRÉER UN PAIEMENT (User)
exports.createPayment = async (req, res) => {
  try {
    const { amount, description, metadata } = req.body;
    const userId = req.user.userId;

    // Trouver le client
    const customer = await Customer.findOne({ userId });
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Client non trouvé",
      });
    }

    // Créer le payment intent Stripe
    const paymentIntent = await stripeService.createPaymentIntent(
      amount,
      "eur",
      customer.stripeCustomerId,
      metadata
    );

    // Sauvegarder le paiement en base
    const payment = new Payment({
      userId,
      stripePaymentIntentId: paymentIntent.id,
      stripeCustomerId: customer.stripeCustomerId,
      amount,
      currency: "eur",
      status: paymentIntent.status,
      description,
      metadata,
    });

    await payment.save();

    logger.info("Paiement créé avec succès", {
      userId,
      paymentIntentId: paymentIntent.id,
      amount,
    });

    return res.status(201).json({
      success: true,
      data: {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        status: paymentIntent.status,
      },
    });
  } catch (error) {
    logger.error("Erreur création paiement", {
      userId: req.user.userId,
      error: error.message,
    });
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la création du paiement",
    });
  }
};

// 🎯 RÉCUPÉRER MES PAIEMENTS (User)
exports.getMyPayments = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { page = 1, limit = 10 } = req.query;

    const payments = await Payment.find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Payment.countDocuments({ userId });

    return res.status(200).json({
      success: true,
      data: payments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error("Erreur récupération paiements", {
      userId: req.user.userId,
      error: error.message,
    });
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des paiements",
    });
  }
};

// 🎯 CONFIRMER UN PAIEMENT (User)
exports.confirmPayment = async (req, res) => {
  try {
    const { paymentIntentId } = req.params;

    const payment = await Payment.findOne({
      stripePaymentIntentId: paymentIntentId,
      userId: req.user.userId,
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Paiement non trouvé",
      });
    }

    // Récupérer les infos à jour depuis Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId); // ⬅️ MAINTENANT stripe EST DÉFINI

    // Mettre à jour le statut
    payment.status = paymentIntent.status;
    await payment.save();

    return res.status(200).json({
      success: true,
      data: payment,
    });
  } catch (error) {
    logger.error("Erreur confirmation paiement", {
      userId: req.user.userId,
      paymentIntentId: req.params.paymentIntentId,
      error: error.message,
    });
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la confirmation du paiement",
    });
  }
};
