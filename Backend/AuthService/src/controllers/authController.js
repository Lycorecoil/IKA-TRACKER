// const {
//   signupSchema,
//   signinSchema,
//   acceptCodeSchema,
//   changePasswordSchema,
//   acceptFPCodeSchema,
// } = require("../middlewares/validator");
// const { doHash, doHashValidation, hmacProcess } = require("../utils/hashing");
// const transport = require("../middlewares/sendMail");
// const User = require("../models/usersModel");
// const jwt = require("jsonwebtoken");
// const { logger } = require("shared-middlewares");
// const VERIFICATION_CODE_EXPIRATION = parseInt(
//   process.env.VERIFICATION_CODE_EXPIRATION || "3600000"
// );

// exports.signup = async (req, res) => {
//   const { email, password, name } = req.body;
//   try {
//     const { error, value } = signupSchema.validate({ email, password, name });

//     if (error) {
//       logger.warn("Validation signup échouée", {
//         email,
//         error: error.details[0].message,
//       });
//       return res
//         .status(401)
//         .json({ success: false, message: error.details[0].message });
//     }

//     const existingUser = await User.findOne({ email }).select("+password");
//     if (existingUser) {
//       logger.warn("Tentative inscription email existant", { email });
//       return res
//         .status(409)
//         .json({ success: false, message: "Cet utilisateur existe deja" });
//     }

//     const hashedPassword = await doHash(password, 12);
//     const codevalue = Math.floor(100000 + Math.random() * 900000).toString();
//     const hashedCodeValue = await hmacProcess(
//       codevalue,
//       process.env.HMAC_VERIFIATION_KEY
//     );

//     // ✅ AJOUT: Afficher le code dans la console pour le debug
//     console.log("🎯 CODE DE VÉRIFICATION GÉNÉRÉ:", codevalue);
//     console.log("📧 Pour l'email:", email);
//     console.log("⏰ Code valable 1 heure");

//     const newUser = new User({
//       email,
//       password: hashedPassword,
//       name,
//       role: "user",
//       verified: false,
//       verificationCode: hashedCodeValue,
//       verificationCodeValidation: Date.now() + VERIFICATION_CODE_EXPIRATION,
//     });

//     const result = await newUser.save();

//     // ✅ LOG: Nouvelle inscription
//     logger.info("Nouvelle inscription", {
//       userId: result._id,
//       email: result.email,
//       name: result.name,
//     });

//     // ✅ ENVOYER L'EMAIL DE VÉRIFICATION (AMÉLIORÉ)
//     try {
//       let info = await transport.sendMail({
//         from: process.env.EMAIL_USER,
//         to: result.email,
//         subject: "Bienvenue ! Activez votre compte",
//         html: `
//           <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
//             <h2 style="color: #333;">Bienvenue sur notre plateforme !</h2>
//             <p>Bonjour <strong>${name}</strong>,</p>
//             <p>Votre code de vérification est :</p>
//             <div style="background: #f4f4f4; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; margin: 20px 0; border-radius: 5px;">
//               ${codevalue}
//             </div>
//             <p>Ce code expirera dans 1 heure.</p>
//             <p>Si vous n'avez pas créé de compte, veuillez ignorer cet email.</p>
//             <hr style="margin: 20px 0;">
//             <p style="color: #666; font-size: 12px;">Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
//           </div>
//         `,
//         text: `
// Bienvenue sur notre plateforme !

// Bonjour ${name},

// Votre code de vérification est : ${codevalue}

// Ce code expirera dans 1 heure.

// Si vous n'avez pas créé de compte, veuillez ignorer cet email.

// ---
// Cet email a été envoyé automatiquement, merci de ne pas y répondre.
//         `,
//       });

//       logger.info("Email vérification envoyé", {
//         email: result.email,
//         messageId: info.messageId,
//       });
//       console.log("✅ Email de vérification envoyé à:", result.email);
//     } catch (emailError) {
//       console.error("❌ Erreur envoi email vérification:", emailError.message);
//       logger.error("Erreur envoi email vérification", {
//         email: result.email,
//         error: emailError.message,
//       });
//     }

//     result.password = undefined;
//     result.verificationCode = undefined;

//     return res.status(201).json({
//       success: true,
//       message:
//         "Compte créé avec succès ! Un code de vérification a été envoyé à votre email.",
//       data: {
//         userId: result._id,
//         email: result.email,
//         name: result.name,
//         verified: result.verified,
//         role: result.role,
//         // ✅ AJOUT TEMPORAIRE: Retourne le code pour les tests (à retirer en production)
//         debug_verification_code: codevalue,
//       },
//     });
//   } catch (error) {
//     console.error("💥 Erreur lors de l'inscription:", error);
//     logger.error("Erreur lors de l'inscription", {
//       email: req.body.email,
//       error: error.message,
//     });
//     return res.status(500).json({ success: false, message: "Erreur serveur." });
//   }
// };

// exports.signin = async (req, res) => {
//   const { email, password } = req.body;
//   try {
//     console.log("🔐 Tentative de connexion pour:", email);

//     const { error, value } = signinSchema.validate({ email, password });
//     if (error) {
//       logger.warn("Validation signin échouée", {
//         email,
//         error: error.details[0].message,
//       });
//       return res
//         .status(401)
//         .json({ success: false, message: error.details[0].message });
//     }

//     const existingUser = await User.findOne({ email }).select("+password");

//     if (!existingUser) {
//       console.log("❌ Utilisateur non trouvé:", email);
//       logger.warn("Tentative connexion utilisateur inexistant", { email });
//       return res
//         .status(404)
//         .json({ success: false, message: "Utilisateur non trouvé" });
//     }

//     console.log("🔍 Vérification du mot de passe...");
//     const result = await doHashValidation(password, existingUser.password);
//     console.log("🔑 Résultat vérification mot de passe:", result);

//     if (!result) {
//       logger.warn("Mot de passe incorrect", {
//         email,
//         userId: existingUser._id,
//       });
//       return res
//         .status(404)
//         .json({ success: false, message: "Mot De Passe incorrect" });
//     }

//     const token = jwt.sign(
//       {
//         userId: existingUser._id,
//         email: existingUser.email,
//         verified: existingUser.verified,
//         name: existingUser.name,
//         role: existingUser.role,
//       },
//       process.env.TOKEN_SECRET,
//       { expiresIn: process.env.JWT_EXPIRATION || "1h" }
//     );

//     // ✅ LOG: Connexion réussie
//     logger.info("Connexion réussie", {
//       userId: existingUser._id,
//       email: existingUser.email,
//       role: existingUser.role,
//     });

//     console.log("✅ Connexion réussie pour:", email);

//     res
//       .cookie("Authorization", "Bearer " + token, {
//         expires: new Date(Date.now() + 3600000),
//         httpOnly: process.env.NODE_ENV === "production",
//         secure: process.env.NODE_ENV === "production",
//       })
//       .json({
//         success: true,
//         message: "Connexion réussie",
//         data: {
//           userId: existingUser._id,
//           email: existingUser.email,
//           name: existingUser.name,
//           verified: existingUser.verified,
//           role: existingUser.role,
//           token,
//         },
//       });
//   } catch (error) {
//     console.error("💥 Erreur de connexion:", error);
//     logger.error("Erreur de connexion", { email, error: error.message });
//     return res.status(500).json({ success: false, message: "Erreur serveur." });
//   }
// };

// exports.signout = async (req, res) => {
//   logger.info("Déconnexion", {
//     userId: req.user.userId,
//     email: req.user.email,
//   });
//   res.clearCookie("Authorization").status(200).json({
//     success: true,
//     message: "Déconnexion réussie",
//   });
// };

// exports.sendVerificationCode = async (req, res) => {
//   const { email } = req.body;
//   try {
//     console.log("📧 Renvoi code vérification pour:", email);

//     const existingUser = await User.findOne({ email });
//     if (!existingUser) {
//       return res
//         .status(404)
//         .json({ success: false, message: "Utilisateur non trouvé" });
//     }
//     if (existingUser.verified) {
//       return res
//         .status(400)
//         .json({ success: false, message: "L'utilisateur est déjà vérifié" });
//     }

//     const codevalue = Math.floor(100000 + Math.random() * 900000).toString();
//     console.log("🎯 NOUVEAU CODE GÉNÉRÉ:", codevalue);

//     let info = await transport.sendMail({
//       from: process.env.EMAIL_USER,
//       to: existingUser.email,
//       subject: "Code de vérification",
//       html: `
//         <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
//           <h2 style="color: #333;">Votre code de vérification</h2>
//           <p>Votre nouveau code de vérification est :</p>
//           <div style="background: #f4f4f4; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; margin: 20px 0; border-radius: 5px;">
//             ${codevalue}
//           </div>
//           <p>Ce code expirera dans 1 heure.</p>
//         </div>
//       `,
//       text: `Votre code de vérification est : ${codevalue}. Ce code expirera dans 1 heure.`,
//     });

//     if (info.accepted && info.accepted[0] === existingUser.email) {
//       const hashedCodeValue = await hmacProcess(
//         codevalue,
//         process.env.HMAC_VERIFIATION_KEY
//       );
//       existingUser.verificationCode = hashedCodeValue;
//       existingUser.verificationCodeValidation =
//         Date.now() + VERIFICATION_CODE_EXPIRATION;
//       await existingUser.save();

//       logger.info("Code vérification envoyé", { email });
//       console.log("✅ Code de vérification renvoyé à:", email);

//       return res.status(200).json({
//         success: true,
//         message: "Code de vérification envoyé avec succès",
//         // ✅ AJOUT TEMPORAIRE: Retourne le code pour les tests
//         debug_code: codevalue,
//       });
//     }

//     logger.error("Erreur envoi code vérification", { email });
//     console.error("❌ Erreur envoi email pour:", email);
//     res.status(200).json({
//       success: false,
//       message: "Erreur dans l'envoie du code de verification",
//     });
//   } catch (error) {
//     console.error("💥 Erreur envoi code vérification:", error);
//     logger.error("Erreur envoi code vérification", {
//       email,
//       error: error.message,
//     });
//     return res.status(500).json({ success: false, message: "Erreur serveur." });
//   }
// };

// exports.verifyVerificationCode = async (req, res) => {
//   const { email, providedCode } = req.body;
//   try {
//     console.log("🔍 Vérification code pour:", email, "Code:", providedCode);

//     const { error, value } = acceptCodeSchema.validate({ email, providedCode });
//     if (error) {
//       return res
//         .status(401)
//         .json({ success: false, message: error.details[0].message });
//     }

//     const codeValue = providedCode.toString();
//     const existingUser = await User.findOne({ email }).select(
//       "+verificationCode +verificationCodeValidation"
//     );
//     if (!existingUser) {
//       return res
//         .status(401)
//         .json({ success: false, message: "Utilisateur non trouvé" });
//     }
//     if (existingUser.verified) {
//       return res
//         .status(400)
//         .json({ success: false, message: "L'utilisateur est déjà vérifié" });
//     }
//     if (
//       !existingUser.verificationCode ||
//       !existingUser.verificationCodeValidation
//     ) {
//       return res.status(400).json({
//         success: false,
//         message:
//           "Nous avons rencontrer une erreur avec votre code de verification",
//       });
//     }

//     if (Date.now() > existingUser.verificationCodeValidation) {
//       logger.warn("Code vérification expiré", { email });
//       return res.status(400).json({ success: false, message: "Code expiré" });
//     }

//     const hashedCodeValue = await hmacProcess(
//       codeValue,
//       process.env.HMAC_VERIFIATION_KEY
//     );

//     if (hashedCodeValue === existingUser.verificationCode) {
//       existingUser.verified = true;
//       existingUser.verificationCode = undefined;
//       existingUser.verificationCodeValidation = undefined;
//       await existingUser.save();

//       logger.info("Email vérifié avec succès", {
//         email,
//         userId: existingUser._id,
//       });
//       console.log("✅ Email vérifié avec succès pour:", email);

//       return res.status(200).json({
//         success: true,
//         message: "Utilisateur vérifié avec succès",
//       });
//     }

//     logger.warn("Code vérification incorrect", { email });
//     console.log("❌ Code incorrect pour:", email);
//     return res.status(400).json({
//       success: false,
//       message: "Code de vérification incorrect",
//     });
//   } catch (error) {
//     console.error("💥 Erreur vérification code:", error);
//     logger.error("Erreur vérification code", { email, error: error.message });
//     return res.status(500).json({ success: false, message: "Erreur serveur." });
//   }
// };

// exports.changePassword = async (req, res) => {
//   const { userId, verified } = req.user;
//   const { oldPassword, newPassword } = req.body;

//   try {
//     const { error, value } = changePasswordSchema.validate({
//       oldPassword,
//       newPassword,
//     });
//     if (error) {
//       return res
//         .status(401)
//         .json({ success: false, message: error.details[0].message });
//     }
//     if (!verified) {
//       return res
//         .status(403)
//         .json({ success: false, message: "Utilisateur non vérifié" });
//     }

//     const existingUser = await User.findById({ _id: userId }).select(
//       "+password"
//     );
//     if (!existingUser) {
//       return res
//         .status(404)
//         .json({ success: false, message: "Utilisateur non trouvé" });
//     }

//     const result = await doHashValidation(oldPassword, existingUser.password);
//     if (!result) {
//       logger.warn("Changement mot de passe - ancien mot de passe incorrect", {
//         userId,
//       });
//       return res
//         .status(404)
//         .json({ success: false, message: "Mot de passe incorrect" });
//     }

//     const hashedNewPassword = await doHash(newPassword, 12);
//     existingUser.password = hashedNewPassword;
//     await existingUser.save();

//     logger.info("Mot de passe changé avec succès", {
//       userId,
//       email: existingUser.email,
//     });
//     return res
//       .status(200)
//       .json({ success: true, message: "Mot de passe changé avec succès" });
//   } catch (error) {
//     logger.error("Erreur changement mot de passe", {
//       userId,
//       error: error.message,
//     });
//     return res.status(500).json({ success: false, message: "Erreur serveur." });
//   }
// };

// exports.sendForgotPasswordCode = async (req, res) => {
//   const { email } = req.body;
//   try {
//     const existingUser = await User.findOne({ email });
//     if (!existingUser) {
//       logger.warn(
//         "Tentative réinitialisation mot de passe - utilisateur inexistant",
//         { email }
//       );
//       return res
//         .status(404)
//         .json({ success: false, message: "Utilisateur non trouvé" });
//     }

//     const codevalue = Math.floor(100000 + Math.random() * 900000).toString();
//     let info = await transport.sendMail({
//       from: process.env.EMAIL_USER,
//       to: existingUser.email,
//       subject: "Code de modification de mot de passe",
//       text: `Votre code de modification du mot de passe est : ${codevalue}`,
//     });

//     if (info.accepted[0] === existingUser.email) {
//       const hashedCodeValue = await hmacProcess(
//         codevalue,
//         process.env.HMAC_VERIFIATION_KEY
//       );
//       existingUser.forgotPasswordCode = hashedCodeValue;
//       existingUser.forgotPasswordCodeValidation =
//         Date.now() + VERIFICATION_CODE_EXPIRATION;
//       existingUser.verified = false;
//       await existingUser.save();

//       logger.info("Code réinitialisation mot de passe envoyé", {
//         email,
//         userId: existingUser._id,
//       });
//       return res.status(200).json({
//         success: true,
//         message:
//           "Code de modification du mot de passe a été envoyé avec succès",
//       });
//     }

//     logger.error("Erreur envoi code réinitialisation", { email });
//     res.status(200).json({
//       success: false,
//       message: "Erreur dans l'envoie du code de modification du mot de passe",
//     });
//   } catch (error) {
//     logger.error("Erreur envoi code réinitialisation", {
//       email,
//       error: error.message,
//     });
//     return res.status(500).json({ success: false, message: "Erreur serveur." });
//   }
// };

// exports.verifyForgotPasswordCode = async (req, res) => {
//   const { email, providedCode, newPassword } = req.body;
//   try {
//     const { error, value } = acceptFPCodeSchema.validate({
//       email,
//       providedCode,
//       newPassword,
//     });
//     if (error) {
//       return res
//         .status(401)
//         .json({ success: false, message: error.details[0].message });
//     }

//     const codeValue = providedCode.toString();
//     const existingUser = await User.findOne({ email }).select(
//       "+forgotPasswordCode +forgotPasswordCodeValidation"
//     );
//     if (!existingUser) {
//       return res
//         .status(401)
//         .json({ success: false, message: "Utilisateur non trouvé" });
//     }

//     if (
//       !existingUser.forgotPasswordCode ||
//       !existingUser.forgotPasswordCodeValidation
//     ) {
//       return res.status(400).json({
//         success: false,
//         message:
//           "Nous avons rencontrer une erreur avec votre code de verification",
//       });
//     }

//     if (Date.now() > existingUser.forgotPasswordCodeValidation) {
//       logger.warn("Code réinitialisation expiré", { email });
//       return res.status(400).json({ success: false, message: "Code expiré" });
//     }

//     const hashedCodeValue = await hmacProcess(
//       codeValue,
//       process.env.HMAC_VERIFIATION_KEY
//     );

//     if (hashedCodeValue === existingUser.forgotPasswordCode) {
//       const hashedNewPassword = await doHash(newPassword, 12);
//       existingUser.password = hashedNewPassword;
//       existingUser.verified = true;
//       existingUser.forgotPasswordCode = undefined;
//       existingUser.forgotPasswordCodeValidation = undefined;
//       await existingUser.save();

//       logger.info("Mot de passe réinitialisé avec succès", {
//         email,
//         userId: existingUser._id,
//       });
//       return res.status(200).json({
//         success: true,
//         message: "Mot de passe modifié avec succès",
//       });
//     }

//     logger.warn("Code réinitialisation incorrect", { email });
//     return res.status(400).json({
//       success: false,
//       message: "Code de réinitialisation incorrect",
//     });
//   } catch (error) {
//     logger.error("Erreur vérification code réinitialisation", {
//       email,
//       error: error.message,
//     });
//     return res.status(500).json({ success: false, message: "Erreur serveur." });
//   }
// };

// exports.getMe = async (req, res) => {
//   const { userId } = req.user;
//   try {
//     const existingUser = await User.findById(userId).select("-password");
//     if (!existingUser) {
//       return res
//         .status(404)
//         .json({ success: false, message: "Utilisateur non trouvé" });
//     }
//     if (!existingUser.verified) {
//       return res
//         .status(403)
//         .json({ success: false, message: "Utilisateur non vérifié" });
//     }

//     return res.status(200).json({
//       success: true,
//       message: "Utilisateur récupéré avec succès",
//       data: {
//         userId: existingUser._id,
//         email: existingUser.email,
//         name: existingUser.name,
//         verified: existingUser.verified,
//         role: existingUser.role,
//       },
//     });
//   } catch (error) {
//     logger.error("Erreur récupération profil", {
//       userId,
//       error: error.message,
//     });
//     return res.status(500).json({ success: false, message: "Erreur serveur." });
//   }
// };
// // ✅ AJOUTER CETTE FONCTION À LA FIN DU FICHIER EXISTANT

// // Création de compte agent (appelé par CoursierService)
// // ✅ AJOUTER CETTE FONCTION À LA FIN DU FICHIER EXISTANT

// // Création de compte agent (appelé par CoursierService)
// exports.signupAgent = async (req, res) => {
//   const { email, password, name, role, agentNumber } = req.body;

//   try {
//     console.log("👤 Création compte agent par CoursierService:", email);

//     // Validation basique
//     if (!email || !password || !name) {
//       return res.status(400).json({
//         success: false,
//         message: "Email, mot de passe et nom sont obligatoires",
//       });
//     }

//     const existingUser = await User.findOne({ email });
//     if (existingUser) {
//       console.log("❌ Email déjà utilisé:", email);
//       return res.status(409).json({
//         success: false,
//         message: "Un agent avec cet email existe déjà",
//       });
//     }

//     // Créer le compte agent (vérifié automatiquement - pas d'email de vérification)
//     const hashedPassword = await doHash(password, 12);
//     const newUser = new User({
//       email,
//       password: hashedPassword,
//       name,
//       role: role || "agent",
//       verified: true, // ✅ COMPTE VÉRIFIÉ AUTOMATIQUEMENT
//       agentNumber: agentNumber,
//     });

//     const result = await newUser.save();

//     logger.info("Compte agent créé avec succès", {
//       userId: result._id,
//       email: result.email,
//       role: result.role,
//     });

//     console.log("✅ Compte agent créé avec succès:", email);

//     result.password = undefined;

//     return res.status(201).json({
//       success: true,
//       message: "Compte agent créé avec succès",
//       data: {
//         userId: result._id,
//         email: result.email,
//         name: result.name,
//         verified: result.verified,
//         role: result.role,
//       },
//     });
//   } catch (error) {
//     console.error("💥 Erreur création compte agent:", error);
//     logger.error("Erreur création compte agent", {
//       email: req.body.email,
//       error: error.message,
//     });
//     return res.status(500).json({
//       success: false,
//       message: "Erreur lors de la création du compte agent",
//     });
//   }
// };

const {
  signupSchema,
  signinSchema,
  acceptCodeSchema,
  changePasswordSchema,
  acceptFPCodeSchema,
} = require("../middlewares/validator");
const { doHash, doHashValidation, hmacProcess } = require("../utils/hashing");
const transport = require("../middlewares/sendMail");
const User = require("../models/usersModel");
const jwt = require("jsonwebtoken");
const { logger } = require("shared-middlewares");

const VERIFICATION_CODE_EXPIRATION = parseInt(
  process.env.VERIFICATION_CODE_EXPIRATION || "3600000"
);

// ==================== INSCRIPTION ====================
exports.signup = async (req, res) => {
  const { email, password, name } = req.body;
  try {
    const { error, value } = signupSchema.validate({ email, password, name });

    if (error) {
      logger.warn("Validation signup échouée", {
        email,
        error: error.details[0].message,
      });
      return res
        .status(401)
        .json({ success: false, message: error.details[0].message });
    }

    const existingUser = await User.findOne({ email }).select("+password");
    if (existingUser) {
      logger.warn("Tentative inscription email existant", { email });
      return res
        .status(409)
        .json({ success: false, message: "Cet utilisateur existe déjà" });
    }

    const hashedPassword = await doHash(password, 12);
    const codevalue = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedCodeValue = await hmacProcess(
      codevalue,
      process.env.HMAC_VERIFIATION_KEY
    );

    console.log("🎯 CODE DE VÉRIFICATION GÉNÉRÉ:", codevalue);
    console.log("📧 Pour l'email:", email);

    const newUser = new User({
      email,
      password: hashedPassword,
      name,
      role: "user",
      verified: false,
      verificationCode: hashedCodeValue,
      verificationCodeValidation: Date.now() + VERIFICATION_CODE_EXPIRATION,
    });

    const result = await newUser.save();

    logger.info("Nouvelle inscription", {
      userId: result._id,
      email: result.email,
      name: result.name,
    });

    // Envoyer email de vérification
    try {
      let info = await transport.sendMail({
        from: process.env.EMAIL_USER,
        to: result.email,
        subject: "Bienvenue ! Activez votre compte",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Bienvenue sur notre plateforme !</h2>
            <p>Bonjour <strong>${name}</strong>,</p>
            <p>Votre code de vérification est :</p>
            <div style="background: #f4f4f4; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; margin: 20px 0; border-radius: 5px;">
              ${codevalue}
            </div>
            <p>Ce code expirera dans 1 heure.</p>
            <p>Si vous n'avez pas créé de compte, veuillez ignorer cet email.</p>
            <hr style="margin: 20px 0;">
            <p style="color: #666; font-size: 12px;">Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
          </div>
        `,
        text: `Bienvenue sur notre plateforme !\n\nBonjour ${name},\n\nVotre code de vérification est : ${codevalue}\n\nCe code expirera dans 1 heure.`,
      });

      logger.info("Email vérification envoyé", {
        email: result.email,
        messageId: info.messageId,
      });
      console.log("✅ Email de vérification envoyé à:", result.email);
    } catch (emailError) {
      console.error("❌ Erreur envoi email:", emailError.message);
      logger.error("Erreur envoi email vérification", {
        email: result.email,
        error: emailError.message,
      });
    }

    return res.status(201).json({
      success: true,
      message:
        "Compte créé avec succès ! Un code de vérification a été envoyé à votre email.",
      data: {
        userId: result._id,
        email: result.email,
        name: result.name,
        verified: result.verified,
        role: result.role,
      },
    });
  } catch (error) {
    console.error("💥 Erreur inscription:", error);
    logger.error("Erreur lors de l'inscription", {
      email: req.body.email,
      error: error.message,
    });
    return res.status(500).json({ success: false, message: "Erreur serveur." });
  }
};

// ==================== CONNEXION ====================
exports.signin = async (req, res) => {
  const { email, password } = req.body;
  try {
    console.log("🔐 Tentative de connexion pour:", email);

    const { error, value } = signinSchema.validate({ email, password });
    if (error) {
      logger.warn("Validation signin échouée", {
        email,
        error: error.details[0].message,
      });
      return res
        .status(401)
        .json({ success: false, message: error.details[0].message });
    }

    const existingUser = await User.findOne({ email }).select("+password");

    if (!existingUser) {
      console.log("❌ Utilisateur non trouvé:", email);
      logger.warn("Tentative connexion utilisateur inexistant", { email });
      return res
        .status(404)
        .json({ success: false, message: "Utilisateur non trouvé" });
    }

    // ✅ VÉRIFIER SI LE COMPTE EST VÉRIFIÉ
    if (!existingUser.verified) {
      console.log("❌ Compte non vérifié:", email);
      logger.warn("Tentative connexion compte non vérifié", {
        email,
        userId: existingUser._id,
      });
      return res.status(403).json({
        success: false,
        message:
          "Veuillez vérifier votre email avant de vous connecter. Un code de vérification vous a été envoyé.",
        needsVerification: true,
      });
    }

    console.log("🔍 Vérification du mot de passe...");
    const result = await doHashValidation(password, existingUser.password);
    console.log("🔑 Résultat vérification mot de passe:", result);

    if (!result) {
      logger.warn("Mot de passe incorrect", {
        email,
        userId: existingUser._id,
      });
      return res
        .status(401)
        .json({ success: false, message: "Mot de passe incorrect" });
    }

    // Générer le token JWT
    const token = jwt.sign(
      {
        userId: existingUser._id,
        email: existingUser.email,
        verified: existingUser.verified,
        name: existingUser.name,
        role: existingUser.role,
      },
      process.env.TOKEN_SECRET,
      { expiresIn: process.env.JWT_EXPIRATION || "24h" }
    );

    logger.info("Connexion réussie", {
      userId: existingUser._id,
      email: existingUser.email,
      role: existingUser.role,
    });

    console.log("✅ Connexion réussie pour:", email);

    res
      .cookie("Authorization", "Bearer " + token, {
        expires: new Date(Date.now() + 86400000),
        httpOnly: process.env.NODE_ENV === "production",
        secure: process.env.NODE_ENV === "production",
      })
      .json({
        success: true,
        message: "Connexion réussie",
        data: {
          userId: existingUser._id,
          email: existingUser.email,
          name: existingUser.name,
          verified: existingUser.verified,
          role: existingUser.role,
          token,
        },
      });
  } catch (error) {
    console.error("💥 Erreur de connexion:", error);
    logger.error("Erreur de connexion", { email, error: error.message });
    return res.status(500).json({ success: false, message: "Erreur serveur." });
  }
};

// ==================== DÉCONNEXION ====================
exports.signout = async (req, res) => {
  logger.info("Déconnexion", {
    userId: req.user.userId,
    email: req.user.email,
  });
  res.clearCookie("Authorization").status(200).json({
    success: true,
    message: "Déconnexion réussie",
  });
};

// ==================== RENVOYER CODE VÉRIFICATION ====================
exports.sendVerificationCode = async (req, res) => {
  const { email } = req.body;
  try {
    console.log("📧 Renvoi code vérification pour:", email);

    const existingUser = await User.findOne({ email });
    if (!existingUser) {
      return res
        .status(404)
        .json({ success: false, message: "Utilisateur non trouvé" });
    }
    if (existingUser.verified) {
      return res
        .status(400)
        .json({ success: false, message: "L'utilisateur est déjà vérifié" });
    }

    const codevalue = Math.floor(100000 + Math.random() * 900000).toString();
    console.log("🎯 NOUVEAU CODE GÉNÉRÉ:", codevalue);

    let info = await transport.sendMail({
      from: process.env.EMAIL_USER,
      to: existingUser.email,
      subject: "Code de vérification",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Votre code de vérification</h2>
          <p>Votre nouveau code de vérification est :</p>
          <div style="background: #f4f4f4; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; margin: 20px 0; border-radius: 5px;">
            ${codevalue}
          </div>
          <p>Ce code expirera dans 1 heure.</p>
        </div>
      `,
      text: `Votre code de vérification est : ${codevalue}. Ce code expirera dans 1 heure.`,
    });

    if (info.accepted && info.accepted[0] === existingUser.email) {
      const hashedCodeValue = await hmacProcess(
        codevalue,
        process.env.HMAC_VERIFIATION_KEY
      );
      existingUser.verificationCode = hashedCodeValue;
      existingUser.verificationCodeValidation =
        Date.now() + VERIFICATION_CODE_EXPIRATION;
      await existingUser.save();

      logger.info("Code vérification renvoyé", { email });
      console.log("✅ Code de vérification renvoyé à:", email);

      return res.status(200).json({
        success: true,
        message: "Code de vérification envoyé avec succès",
      });
    }

    logger.error("Erreur envoi code vérification", { email });
    console.error("❌ Erreur envoi email pour:", email);
    res.status(500).json({
      success: false,
      message: "Erreur dans l'envoi du code de vérification",
    });
  } catch (error) {
    console.error("💥 Erreur envoi code vérification:", error);
    logger.error("Erreur envoi code vérification", {
      email,
      error: error.message,
    });
    return res.status(500).json({ success: false, message: "Erreur serveur." });
  }
};

// ==================== VÉRIFIER CODE ====================
exports.verifyVerificationCode = async (req, res) => {
  const { email, providedCode } = req.body;
  try {
    console.log("🔍 Vérification code pour:", email, "Code:", providedCode);

    const { error, value } = acceptCodeSchema.validate({ email, providedCode });
    if (error) {
      return res
        .status(401)
        .json({ success: false, message: error.details[0].message });
    }

    const codeValue = providedCode.toString();
    const existingUser = await User.findOne({ email }).select(
      "+verificationCode +verificationCodeValidation"
    );

    if (!existingUser) {
      return res
        .status(401)
        .json({ success: false, message: "Utilisateur non trouvé" });
    }

    if (existingUser.verified) {
      return res
        .status(400)
        .json({ success: false, message: "L'utilisateur est déjà vérifié" });
    }

    if (
      !existingUser.verificationCode ||
      !existingUser.verificationCodeValidation
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Code de vérification manquant. Veuillez demander un nouveau code.",
      });
    }

    if (Date.now() > existingUser.verificationCodeValidation) {
      logger.warn("Code vérification expiré", { email });
      return res.status(400).json({
        success: false,
        message: "Code expiré. Veuillez demander un nouveau code.",
      });
    }

    const hashedCodeValue = await hmacProcess(
      codeValue,
      process.env.HMAC_VERIFIATION_KEY
    );

    if (hashedCodeValue === existingUser.verificationCode) {
      existingUser.verified = true;
      existingUser.verificationCode = undefined;
      existingUser.verificationCodeValidation = undefined;
      await existingUser.save();

      logger.info("Email vérifié avec succès", {
        email,
        userId: existingUser._id,
      });
      console.log("✅ Email vérifié avec succès pour:", email);

      // ✅ GÉNÉRER TOKEN APRÈS VÉRIFICATION
      const token = jwt.sign(
        {
          userId: existingUser._id,
          email: existingUser.email,
          verified: existingUser.verified,
          name: existingUser.name,
          role: existingUser.role,
        },
        process.env.TOKEN_SECRET,
        { expiresIn: process.env.JWT_EXPIRATION || "24h" }
      );

      return res.status(200).json({
        success: true,
        message: "Email vérifié avec succès",
        token,
        data: {
          userId: existingUser._id,
          email: existingUser.email,
          name: existingUser.name,
          verified: existingUser.verified,
          role: existingUser.role,
        },
      });
    }

    logger.warn("Code vérification incorrect", { email });
    console.log("❌ Code incorrect pour:", email);
    return res.status(400).json({
      success: false,
      message: "Code de vérification incorrect",
    });
  } catch (error) {
    console.error("💥 Erreur vérification code:", error);
    logger.error("Erreur vérification code", { email, error: error.message });
    return res.status(500).json({ success: false, message: "Erreur serveur." });
  }
};

// ==================== CHANGER MOT DE PASSE ====================
exports.changePassword = async (req, res) => {
  const { userId, verified } = req.user;
  const { oldPassword, newPassword } = req.body;

  try {
    const { error, value } = changePasswordSchema.validate({
      oldPassword,
      newPassword,
    });
    if (error) {
      return res
        .status(401)
        .json({ success: false, message: error.details[0].message });
    }

    if (!verified) {
      return res
        .status(403)
        .json({ success: false, message: "Utilisateur non vérifié" });
    }

    const existingUser = await User.findById({ _id: userId }).select(
      "+password"
    );
    if (!existingUser) {
      return res
        .status(404)
        .json({ success: false, message: "Utilisateur non trouvé" });
    }

    const result = await doHashValidation(oldPassword, existingUser.password);
    if (!result) {
      logger.warn("Changement mot de passe - ancien mot de passe incorrect", {
        userId,
      });
      return res
        .status(401)
        .json({ success: false, message: "Ancien mot de passe incorrect" });
    }

    const hashedNewPassword = await doHash(newPassword, 12);
    existingUser.password = hashedNewPassword;
    await existingUser.save();

    logger.info("Mot de passe changé avec succès", {
      userId,
      email: existingUser.email,
    });
    return res
      .status(200)
      .json({ success: true, message: "Mot de passe changé avec succès" });
  } catch (error) {
    logger.error("Erreur changement mot de passe", {
      userId,
      error: error.message,
    });
    return res.status(500).json({ success: false, message: "Erreur serveur." });
  }
};

// ==================== MOT DE PASSE OUBLIÉ - ENVOYER CODE ====================
exports.sendForgotPasswordCode = async (req, res) => {
  const { email } = req.body;
  try {
    const existingUser = await User.findOne({ email });
    if (!existingUser) {
      logger.warn(
        "Tentative réinitialisation mot de passe - utilisateur inexistant",
        { email }
      );
      return res
        .status(404)
        .json({ success: false, message: "Utilisateur non trouvé" });
    }

    const codevalue = Math.floor(100000 + Math.random() * 900000).toString();
    console.log("🔑 CODE RÉINITIALISATION:", codevalue, "pour", email);

    let info = await transport.sendMail({
      from: process.env.EMAIL_USER,
      to: existingUser.email,
      subject: "Réinitialisation de mot de passe",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Réinitialisation de mot de passe</h2>
          <p>Vous avez demandé à réinitialiser votre mot de passe.</p>
          <p>Votre code de réinitialisation est :</p>
          <div style="background: #f4f4f4; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; margin: 20px 0; border-radius: 5px;">
            ${codevalue}
          </div>
          <p>Ce code expirera dans 1 heure.</p>
          <p>Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.</p>
        </div>
      `,
      text: `Code de réinitialisation de mot de passe : ${codevalue}. Ce code expirera dans 1 heure.`,
    });

    if (info.accepted[0] === existingUser.email) {
      const hashedCodeValue = await hmacProcess(
        codevalue,
        process.env.HMAC_VERIFIATION_KEY
      );
      existingUser.forgotPasswordCode = hashedCodeValue;
      existingUser.forgotPasswordCodeValidation =
        Date.now() + VERIFICATION_CODE_EXPIRATION;
      await existingUser.save();

      logger.info("Code réinitialisation mot de passe envoyé", {
        email,
        userId: existingUser._id,
      });
      return res.status(200).json({
        success: true,
        message: "Code de réinitialisation envoyé avec succès",
      });
    }

    logger.error("Erreur envoi code réinitialisation", { email });
    res.status(500).json({
      success: false,
      message: "Erreur dans l'envoi du code",
    });
  } catch (error) {
    logger.error("Erreur envoi code réinitialisation", {
      email,
      error: error.message,
    });
    return res.status(500).json({ success: false, message: "Erreur serveur." });
  }
};

// ==================== MOT DE PASSE OUBLIÉ - VÉRIFIER CODE ====================
exports.verifyForgotPasswordCode = async (req, res) => {
  const { email, providedCode, newPassword } = req.body;
  try {
    const { error, value } = acceptFPCodeSchema.validate({
      email,
      providedCode,
      newPassword,
    });
    if (error) {
      return res
        .status(401)
        .json({ success: false, message: error.details[0].message });
    }

    const codeValue = providedCode.toString();
    const existingUser = await User.findOne({ email }).select(
      "+forgotPasswordCode +forgotPasswordCodeValidation"
    );

    if (!existingUser) {
      return res
        .status(401)
        .json({ success: false, message: "Utilisateur non trouvé" });
    }

    if (
      !existingUser.forgotPasswordCode ||
      !existingUser.forgotPasswordCodeValidation
    ) {
      return res.status(400).json({
        success: false,
        message: "Code manquant. Veuillez demander un nouveau code.",
      });
    }

    if (Date.now() > existingUser.forgotPasswordCodeValidation) {
      logger.warn("Code réinitialisation expiré", { email });
      return res.status(400).json({
        success: false,
        message: "Code expiré. Veuillez demander un nouveau code.",
      });
    }

    const hashedCodeValue = await hmacProcess(
      codeValue,
      process.env.HMAC_VERIFIATION_KEY
    );

    if (hashedCodeValue === existingUser.forgotPasswordCode) {
      const hashedNewPassword = await doHash(newPassword, 12);
      existingUser.password = hashedNewPassword;
      existingUser.verified = true;
      existingUser.forgotPasswordCode = undefined;
      existingUser.forgotPasswordCodeValidation = undefined;
      await existingUser.save();

      logger.info("Mot de passe réinitialisé avec succès", {
        email,
        userId: existingUser._id,
      });
      return res.status(200).json({
        success: true,
        message: "Mot de passe modifié avec succès",
      });
    }

    logger.warn("Code réinitialisation incorrect", { email });
    return res.status(400).json({
      success: false,
      message: "Code de réinitialisation incorrect",
    });
  } catch (error) {
    logger.error("Erreur vérification code réinitialisation", {
      email,
      error: error.message,
    });
    return res.status(500).json({ success: false, message: "Erreur serveur." });
  }
};

// ==================== OBTENIR PROFIL ====================
exports.getMe = async (req, res) => {
  const { userId } = req.user;
  try {
    const existingUser = await User.findById(userId).select("-password");
    if (!existingUser) {
      return res
        .status(404)
        .json({ success: false, message: "Utilisateur non trouvé" });
    }

    if (!existingUser.verified) {
      return res
        .status(403)
        .json({ success: false, message: "Utilisateur non vérifié" });
    }

    return res.status(200).json({
      success: true,
      message: "Profil récupéré avec succès",
      data: {
        userId: existingUser._id,
        email: existingUser.email,
        name: existingUser.name,
        verified: existingUser.verified,
        role: existingUser.role,
      },
    });
  } catch (error) {
    logger.error("Erreur récupération profil", {
      userId,
      error: error.message,
    });
    return res.status(500).json({ success: false, message: "Erreur serveur." });
  }
};

// ==================== CRÉATION COMPTE AGENT (CourierService) ====================
exports.signupAgent = async (req, res) => {
  const { email, password, name, role, agentNumber } = req.body;

  try {
    console.log("👤 Création compte agent par CoursierService:", email);

    if (!email || !password || !name) {
      return res.status(400).json({
        success: false,
        message: "Email, mot de passe et nom sont obligatoires",
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log("❌ Email déjà utilisé:", email);
      return res.status(409).json({
        success: false,
        message: "Un agent avec cet email existe déjà",
      });
    }

    const hashedPassword = await doHash(password, 12);
    const newUser = new User({
      email,
      password: hashedPassword,
      name,
      role: role || "agent",
      verified: true, // ✅ Agents vérifiés automatiquement
      agentNumber: agentNumber,
    });

    const result = await newUser.save();

    logger.info("Compte agent créé avec succès", {
      userId: result._id,
      email: result.email,
      role: result.role,
    });

    console.log("✅ Compte agent créé avec succès:", email);

    return res.status(201).json({
      success: true,
      message: "Compte agent créé avec succès",
      data: {
        userId: result._id,
        email: result.email,
        name: result.name,
        verified: result.verified,
        role: result.role,
      },
    });
  } catch (error) {
    console.error("💥 Erreur création compte agent:", error);
    logger.error("Erreur création compte agent", {
      email: req.body.email,
      error: error.message,
    });
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la création du compte agent",
    });
  }
};
