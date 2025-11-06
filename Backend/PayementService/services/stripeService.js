const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

class StripeService {
  // 🎯 CRÉER UN CLIENT STRIPE
  async createCustomer(userId, email, name) {
    try {
      const customer = await stripe.customers.create({
        email,
        name,
        metadata: { userId: userId.toString() },
      });
      return customer;
    } catch (error) {
      console.error("Erreur création client Stripe:", error);
      throw error;
    }
  }

  // 🎯 CRÉER UN ABONNEMENT
  async createSubscription(customerId, priceId) {
    try {
      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: priceId }],
        payment_behavior: "default_incomplete",
        payment_settings: { save_default_payment_method: "on_subscription" },
        expand: ["latest_invoice.payment_intent"],
      });
      return subscription;
    } catch (error) {
      console.error("Erreur création abonnement:", error);
      throw error;
    }
  }

  // 🎯 CRÉER UN PAYMENT INTENT
  async createPaymentIntent(amount, currency, customerId, metadata = {}) {
    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount,
        currency,
        customer: customerId,
        automatic_payment_methods: { enabled: true },
        metadata,
      });
      return paymentIntent;
    } catch (error) {
      console.error("Erreur création payment intent:", error);
      throw error;
    }
  }

  // 🎯 ANNULER UN ABONNEMENT
  async cancelSubscription(subscriptionId) {
    try {
      const subscription = await stripe.subscriptions.del(subscriptionId);
      return subscription;
    } catch (error) {
      console.error("Erreur annulation abonnement:", error);
      throw error;
    }
  }

  // 🎯 RÉCUPÉRER UN ABONNEMENT
  async getSubscription(subscriptionId) {
    try {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      return subscription;
    } catch (error) {
      console.error("Erreur récupération abonnement:", error);
      throw error;
    }
  }

  // 🎯 CRÉER UNE SESSION DE CHECKOUT
  async createCheckoutSession(
    customerId,
    priceId,
    successUrl,
    cancelUrl,
    metadata = {}
  ) {
    try {
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        line_items: [{ price: priceId, quantity: 1 }],
        mode: "subscription",
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata, // <-- ici
      });
      return session;
    } catch (error) {
      console.error("Erreur création session checkout:", error);
      throw error;
    }
  }

  // 🎯 CONSTRUIRE UN ÉVÉNEMENT WEBHOOK SÉCURISÉ
  constructWebhookEvent(payload, signature) {
    try {
      return stripe.webhooks.constructEvent(
        payload,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (error) {
      console.error("Erreur vérification webhook:", error);
      throw error;
    }
  }
}

module.exports = new StripeService();
