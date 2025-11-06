const Subscription = require("../models/subscriptionModel");
const Customer = require("../models/customerModel");
const Payment = require("../models/paymentModel");
const stripeService = require("../../services/stripeService");
const { logger } = require("shared-middlewares");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

// ✅ Vérifier si un abonnement est actif
function isSubscriptionActive(subscription) {
  const now = new Date();

  if (subscription.status === "canceled") {
    return false;
  }

  if (
    subscription.status === "active" &&
    now < new Date(subscription.currentPeriodEnd)
  ) {
    return true;
  }

  return false;
}

// 🎯 CRÉER UNE SESSION CHECKOUT (User)
exports.createCheckoutSession = async (req, res) => {
  try {
    console.log("🛒 [CHECKOUT] Début createCheckoutSession");
    const { priceId } = req.body;
    const userId = req.user.userId;

    const finalPriceId = priceId || process.env.STRIPE_STANDARD_PRICE_ID;
    if (!finalPriceId) {
      return res
        .status(400)
        .json({ success: false, message: "Price ID manquant" });
    }

    // Vérifier ou créer le client Stripe
    let customer = await Customer.findOne({ userId });
    if (!customer) {
      const stripeCustomer = await stripeService.createCustomer(
        userId,
        req.user.email,
        req.user.name
      );

      customer = new Customer({
        userId,
        stripeCustomerId: stripeCustomer.id,
        email: req.user.email,
        name: req.user.name,
      });

      await customer.save();
      console.log(
        "✅ [CHECKOUT] Nouveau client créé:",
        customer.stripeCustomerId
      );
    } else {
      console.log("🔍 [CHECKOUT] Client existant:", customer.stripeCustomerId);
    }

    const successUrl = `${process.env.CLIENT_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${process.env.CLIENT_URL}/payment/cancel`;

    const session = await stripeService.createCheckoutSession(
      customer.stripeCustomerId,
      finalPriceId,
      successUrl,
      cancelUrl,
      { priceId: finalPriceId }
    );

    console.log("✅ [CHECKOUT] Session créée:", session.id);

    return res.status(200).json({
      success: true,
      data: {
        sessionId: session.id,
        url: session.url,
      },
    });
  } catch (error) {
    console.error("💥 [CHECKOUT] Erreur:", error);
    logger.error("Erreur création session checkout", {
      userId: req.user.userId,
      error: error.message,
    });
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la création de la session de paiement",
    });
  }
};

// 🎯 ANNULER UN ABONNEMENT (User)
exports.cancelSubscription = async (req, res) => {
  try {
    const userId = req.user.userId;

    const subscription = await Subscription.findOne({
      userId,
      status: { $in: ["active", "trialing", "past_due"] },
    });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: "Aucun abonnement actif trouvé",
      });
    }

    // Annuler l'abonnement Stripe
    const canceledSubscription = await stripeService.cancelSubscription(
      subscription.stripeSubscriptionId
    );

    // Mettre à jour en base avec les dates
    subscription.status = canceledSubscription.status;
    subscription.cancelAtPeriodEnd = canceledSubscription.cancel_at_period_end;
    subscription.canceledAt = new Date();
    subscription.subscriptionEndDate = new Date(
      canceledSubscription.current_period_end * 1000
    );

    await subscription.save();

    logger.info("Abonnement annulé", {
      userId,
      subscriptionId: subscription.stripeSubscriptionId,
      canceledAt: subscription.canceledAt,
    });

    return res.status(200).json({
      success: true,
      message: "Abonnement annulé avec succès",
      data: {
        status: subscription.status,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
        subscriptionEndDate: subscription.subscriptionEndDate,
      },
    });
  } catch (error) {
    logger.error("Erreur annulation abonnement", {
      userId: req.user.userId,
      error: error.message,
    });
    return res.status(500).json({
      success: false,
      message: "Erreur lors de l'annulation de l'abonnement",
    });
  }
};

// 🎯 RÉCUPÉRER MON ABONNEMENT (User)
exports.getMySubscription = async (req, res) => {
  try {
    const userId = req.user.userId;

    const subscription = await Subscription.findOne({ userId });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: "Aucun abonnement trouvé",
      });
    }

    // ✅ Vérifier si encore actif
    const isActive = isSubscriptionActive(subscription);

    return res.status(200).json({
      success: true,
      data: {
        ...subscription.toObject(),
        isActive: isActive,
        daysRemaining: Math.ceil(
          (new Date(subscription.currentPeriodEnd) - new Date()) /
            (1000 * 60 * 60 * 24)
        ),
      },
    });
  } catch (error) {
    logger.error("Erreur récupération abonnement", {
      userId: req.user.userId,
      error: error.message,
    });
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération de l'abonnement",
    });
  }
};

// 🎯 SYNCHRONISER ABONNEMENT (Après paiement)
exports.syncSubscription = async (req, res) => {
  try {
    console.log("🔄 [SYNC] Début synchronisation");
    const { sessionId } = req.body;
    const userId = req.user.userId;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: "sessionId requis",
      });
    }

    console.log("🔄 [SYNC] Session ID:", sessionId);

    // Récupérer la session Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["subscription", "payment_intent"],
    });

    console.log("🔍 [SYNC] Session status:", session.payment_status);

    if (session.payment_status !== "paid") {
      return res.status(400).json({
        success: false,
        message: "Paiement non complété",
      });
    }

    // Trouver le client
    const customer = await Customer.findOne({ userId });
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Client non trouvé",
      });
    }

    let savedSubscription = null;

    // ✅ Créer l'abonnement avec durée
    if (session.subscription) {
      const subscription = await stripe.subscriptions.retrieve(
        session.subscription
      );

      const existingSubscription = await Subscription.findOne({
        stripeSubscriptionId: session.subscription,
      });

      if (!existingSubscription) {
        const startDate = new Date(subscription.current_period_start * 1000);
        const endDate = new Date(subscription.current_period_end * 1000);

        const newSubscription = new Subscription({
          userId,
          stripeSubscriptionId: subscription.id,
          stripeCustomerId: customer.stripeCustomerId,
          status: subscription.status,

          // ✅ DATES
          subscriptionStartDate: startDate,
          subscriptionEndDate: null,
          currentPeriodStart: startDate,
          currentPeriodEnd: endDate,
          renewalDate: endDate,

          planId: session.metadata?.priceId || "price_default",
          planName: "Abonnement Standard",
          amount: subscription.items.data[0].price.unit_amount,
          currency: subscription.currency,
          interval: subscription.items.data[0].plan.interval,
        });

        await newSubscription.save();
        savedSubscription = newSubscription;
        console.log("✅ [SYNC] Abonnement créé:", newSubscription._id);
      }
    }

    return res.status(200).json({
      success: true,
      message: "Synchronisation réussie",
      data: {
        subscription: savedSubscription,
        subscriptionStartDate: savedSubscription?.subscriptionStartDate,
        subscriptionEndDate: savedSubscription?.currentPeriodEnd,
        daysValid: Math.ceil(
          (new Date(savedSubscription?.currentPeriodEnd) - new Date()) /
            (1000 * 60 * 60 * 24)
        ),
      },
    });
  } catch (error) {
    console.error("💥 [SYNC] Erreur:", error);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la synchronisation",
    });
  }
};
