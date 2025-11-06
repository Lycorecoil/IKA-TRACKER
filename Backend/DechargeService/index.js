const app = require("./app");
const PORT = process.env.PORT || 8002;

app.listen(PORT, () => {
  console.log(`✅ Decharge Service running on port ${PORT}`);
  console.log(`📦 Service: Gestion des colis et décharges`);
  console.log(`🌐 Health: http://localhost:${PORT}/health`);
});
