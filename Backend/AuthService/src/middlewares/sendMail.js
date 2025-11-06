const nodemailer = require("nodemailer");

// Création du transporteur SMTP avec Gmail
const transport = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER, // ton adresse Gmail
    pass: process.env.EMAIL_PASS, // mot de passe d'application
  },
});

// Vérifie la configuration à l'initialisation
transport.verify((error, success) => {
  if (error) {
    console.error(
      "❌ Erreur de configuration du transport mail :",
      error.message
    );
  } else {
    console.log("✅ Transport mail prêt. Prêt à envoyer des emails !");
  }
});

module.exports = transport;
