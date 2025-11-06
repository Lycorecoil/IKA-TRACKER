// Charger les variables d'environnement de test
require("dotenv").config({ path: ".env.test" });

// Variables d'environnement de test avec valeurs par défaut
process.env.NODE_ENV = process.env.NODE_ENV || "test";
process.env.MONGO_URI_TEST =
  process.env.MONGO_URI_TEST || "mongodb://localhost:27017/auth_service_test";
process.env.TOKEN_SECRET =
  process.env.TOKEN_SECRET || "test-jwt-secret-key-for-testing-only";
process.env.HMAC_VERIFIATION_KEY =
  process.env.HMAC_VERIFIATION_KEY || "test-hmac-key-for-testing";
process.env.JWT_EXPIRATION = process.env.JWT_EXPIRATION || "1h";
process.env.VERIFICATION_CODE_EXPIRATION =
  process.env.VERIFICATION_CODE_EXPIRATION || "3600000";

// Mock console pour tests plus propres
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
};
