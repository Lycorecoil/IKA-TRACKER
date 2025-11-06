const mongoose = require("mongoose");
const { doHash, hmacProcess } = require("./hashing"); // Chemin vers votre fichier hashing.js

async function createAdmin() {
  try {
    // Connexion à la base (utilisez la même configuration que votre app)
    await mongoose.connect("mongodb://127.0.0.1:27017/ikaUser");
    console.log("Connecté à MongoDB");

    // Importez votre modèle User (identique à votre application)
    const User = require("../models/usersModel"); // Ajustez le chemin

    // Supprimer l'ancien admin s'il existe
    await User.deleteOne({ email: "arleybobm559@gmail.com" });
    console.log("Ancien admin supprimé");

    // Créer le nouvel admin avec VOS fonctions de hachage
    const hashedPassword = await doHash("Password123", 12);

    const admin = new User({
      email: "arleybobm559@gmail.com",
      password: hashedPassword,
      name: "System Administrator",
      role: "admin",
      verified: true,
      verificationCode: null,
      verificationCodeValidation: null,
      forgotPasswordCode: null,
      forgotPasswordCodeValidation: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await admin.save();
    console.log("✅ Nouvel admin créé avec succès !");
    console.log("📧 Email: arleybobm559@gmail.com");
    console.log("🔑 Password: Password123");
    console.log("🔐 Hash utilisé:", hashedPassword);

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("❌ Erreur:", error);
    process.exit(1);
  }
}

createAdmin();
