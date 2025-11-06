const stripeService = require("../../services/stripeService");
const Payment = require("../models/paymentModel");
const Subscription = require("../models/subscriptionModel");
const Customer = require("../models/customerModel");
const { logger, createServiceClient } = require("shared-middlewares");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const authClient = createServiceClient("auth");

exports.handleStripeWebhook = async (req, res) => {
  console.log("🎯 [WEBHOOK] REQUÊTE REÇUE à:", new Date().toISOString());

  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripeService.constructWebhookEvent(req.body, sig);
    console.log("✅ [WEBHOOK] Événement vérifié:", event.type);
  } catch (err) {
    console.error("❌ [WEBHOOK] Erreur signature:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        console.log("💰 [WEBHOOK] Session ID:", session.id);
        console.log("💰 [WEBHOOK] Customer:", session.customer);
        console.log("💰 [WEBHOOK] Subscription:", session.subscription);

        const customer = await Customer.findOne({
          stripeCustomerId: session.customer,
        });

        if (!customer) {
          console.log("❌ [WEBHOOK] Customer non trouvé");
          return res.json({ received: true });
        }

        console.log("✅ [WEBHOOK] Customer trouvé - User ID:", customer.userId);

        // ✅ CRÉER L'ABONNEMENT
        if (session.subscription) {
          try {
            const subscription = await stripe.subscriptions.retrieve(
              session.subscription
            );

            const existingSubscription = await Subscription.findOne({
              stripeSubscriptionId: subscription.id,
            });

            if (!existingSubscription) {
              // ✅ CALCUL DES DATES STRIPE
              const startDate = new Date(subscription.created * 1000);
              let endDate = subscription.current_period_end
                ? new Date(subscription.current_period_end * 1000)
                : new Date(subscription.billing_cycle_anchor * 1000);

              // ✅ FIX : SI DATES IDENTIQUES = AJOUTER 30 JOURS
              if (startDate.getTime() === endDate.getTime()) {
                console.log(
                  "⚠️ [WEBHOOK] Dates identiques détectées - Ajout 30 jours"
                );
                endDate = new Date(startDate);
                endDate.setDate(endDate.getDate() + 30);
              }

              const interval =
                subscription.items.data[0]?.plan?.interval || "month";

              console.log("📅 [WEBHOOK] Dates finales:");
              console.log("   - Début:", startDate.toISOString());
              console.log("   - Fin:", endDate.toISOString());
              console.log("   - Intervalle:", interval);

              const newSubscription = new Subscription({
                userId: customer.userId,
                stripeSubscriptionId: subscription.id,
                stripeCustomerId: session.customer,
                status: subscription.status,
                subscriptionStartDate: startDate,
                subscriptionEndDate: null,
                currentPeriodStart: startDate,
                currentPeriodEnd: endDate,
                renewalDate: endDate,
                planId: session.metadata?.priceId || "price_default",
                planName: "Abonnement Standard",
                amount: subscription.items.data[0]?.price?.unit_amount || 9900,
                currency: subscription.currency || "eur",
                interval: interval,
                cancelAtPeriodEnd: subscription.cancel_at_period_end || false,
                metadata: session.metadata || {},
              });

              await newSubscription.save();
              console.log("✅ [WEBHOOK] Abonnement créé:", newSubscription._id);

              // ✅ NOTIFIER AUTHSERVICE AVEC TOUTES LES DONNÉES
              try {
                await authClient.put(
                  `/api/internal/users/${customer.userId}/subscription`,
                  {
                    subscriptionStatus: "active",
                    subscriptionStartDate: startDate,
                    subscriptionEndDate: endDate,
                    subscriptionId: subscription.id,
                    stripeCustomerId: session.customer,
                    planId: session.metadata?.priceId || "price_default",
                  }
                );
                console.log("✅ [WEBHOOK] AuthService notifié avec dates");
              } catch (e) {
                console.warn("⚠️ [WEBHOOK] Erreur AuthService:", e.message);
              }
            } else {
              console.log("ℹ️ [WEBHOOK] Abonnement déjà existant");
            }
          } catch (err) {
            console.error("❌ [WEBHOOK] Erreur abonnement:", err.message);
          }
        }

        // ✅ CRÉER LE PAIEMENT
        try {
          const paymentIntentId = session.payment_intent || `cs_${session.id}`;
          const existingPayment = await Payment.findOne({
            stripePaymentIntentId: paymentIntentId,
          });

          if (!existingPayment) {
            const payment = new Payment({
              userId: customer.userId,
              stripePaymentIntentId: paymentIntentId,
              stripeCustomerId: session.customer,
              amount: session.amount_total || 9900,
              currency: session.currency || "eur",
              status: "succeeded",
              description: "Abonnement",
              metadata: session.metadata || {},
            });

            await payment.save();
            console.log("✅ [WEBHOOK] Paiement créé");
          }
        } catch (err) {
          console.error("❌ [WEBHOOK] Erreur paiement:", err.message);
        }

        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object;
        try {
          const sub = await Subscription.findOne({
            stripeSubscriptionId: subscription.id,
          });
          if (sub) {
            const newEndDate = new Date(subscription.current_period_end * 1000);
            sub.status = subscription.status;
            sub.currentPeriodEnd = newEndDate;
            sub.renewalDate = newEndDate;
            await sub.save();
            console.log("✅ [WEBHOOK] Abonnement MAJ");
          }
        } catch (err) {
          console.error("❌ Erreur MAJ:", err.message);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        try {
          const sub = await Subscription.findOne({
            stripeSubscriptionId: subscription.id,
          });
          if (sub) {
            sub.status = "canceled";
            sub.canceledAt = new Date();
            await sub.save();
            console.log("✅ [WEBHOOK] Abonnement annulé");

            await authClient.put(
              `/api/internal/users/${sub.userId}/subscription`,
              { subscriptionStatus: "canceled" }
            );
          }
        } catch (err) {
          console.error("❌ Erreur suppression:", err.message);
        }
        break;
      }

      default:
        console.log("ℹ️ Événement ignoré:", event.type);
    }

    res.json({ received: true });
  } catch (err) {
    console.error("💥 Erreur:", err.message);
    res.status(200).json({ received: true });
  }
};
