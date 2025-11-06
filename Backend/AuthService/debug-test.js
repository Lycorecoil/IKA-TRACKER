require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

console.log("=== DÉBUT DU DEBUG ===");

// 1. Test variables d'environnement
console.log("1. Variables environnement:");
console.log(
  "   MONGODB_URI:",
  process.env.MONGO_URI ? "✅ DÉFINI" : "❌ MANQUANT"
);
console.log(
  "   TOKEN_SECRET:",
  process.env.TOKEN_SECRET ? "✅ DÉFINI" : "❌ MANQUANT"
);

// 2. Test connexion MongoDB
console.log("2. Test connexion MongoDB...");
mongoose
  .connect(process.env.MONGO_URI || "mongodb://localhost:27017/test")
  .then(() => {
    console.log("   ✅ MongoDB connecté");

    // 3. Test recherche admin
    const User = require("./src/models/usersModel");
    User.findOne({ email: "arleybobm559@gmail.com" })
      .select("+password")
      .then((user) => {
        if (user) {
          console.log("   ✅ Admin trouvé dans DB");
          console.log("   Role:", user.role);
          console.log("   Verified:", user.verified);

          // 4. Test mot de passe
          bcrypt
            .compare("Password123", user.password)
            .then((match) => {
              console.log("   ✅ Mot de passe valide:", match);
              process.exit(0);
            })
            .catch((err) => {
              console.log(
                "   ❌ Erreur vérification mot de passe:",
                err.message
              );
              process.exit(1);
            });
        } else {
          console.log("   ❌ Admin NON trouvé dans DB");
          process.exit(1);
        }
      })
      .catch((err) => {
        console.log("   ❌ Erreur recherche admin:", err.message);
        process.exit(1);
      });
  })
  .catch((err) => {
    console.log("   ❌ Erreur connexion MongoDB:", err.message);
    process.exit(1);
  });
