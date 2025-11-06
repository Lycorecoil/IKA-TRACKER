const app = require("./app");
const PORT = process.env.PORT || 8003;

app.listen(PORT, () => {
  console.log(`✅ Payment Service running on port ${PORT}`);
  console.log(`💳 Service: Gestion des paiements et abonnements`);
  console.log(`🌐 Health: http://localhost:${PORT}/health`);
  console.log(`🔗 Webhook: http://localhost:${PORT}/api/payments/webhook`);
});
