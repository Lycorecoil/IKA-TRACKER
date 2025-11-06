const app = require("./app");
const PORT = process.env.PORT || 8001;

app.listen(PORT, () => {
  console.log(`✅ Courier Service running on port ${PORT}`);
  console.log(`📊 Service: Gestion des coursiers/agents`);
  console.log(`🌐 Health: http://localhost:${PORT}/health`);
});
