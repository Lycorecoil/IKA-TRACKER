// src/utils/codeGenerator.js

/**
 * Génère un code de vérification numérique
 * @returns {string} Code de 6 chiffres
 */
const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Génère un token de réinitialisation sécurisé
 * @returns {string} Token aléatoire
 */
const generateResetToken = () => {
  const crypto = require("crypto");
  return crypto.randomBytes(32).toString("hex");
};

/**
 * Génère un code de vérification avec expiration
 * @returns {object} Code et timestamp d'expiration
 */
const generateVerificationCodeWithExpiry = () => {
  const code = generateVerificationCode();
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + 15); // Expire dans 15 minutes

  return {
    code,
    expiresAt,
  };
};

module.exports = {
  generateVerificationCode,
  generateResetToken,
  generateVerificationCodeWithExpiry,
};
