
const jwt = require("jsonwebtoken");
const { logger } = require("./logger");

exports.identifier = (req, res, next) => {
  try {
    const headers = req.headers || {};
    const cookies = req.cookies || {}; 
    let token;

    // Vérifie la provenance du client
    if (headers.client === "not-browser") {
      token = headers.authorization;
    } else {
      token = cookies["Authorization"];
    }

    if (!token) {
      logger.warn("Tentative d'accès sans token", {
        path: req.path,
        method: req.method,
        client: headers.client || "browser",
        ip: req.ip,
      });
      return res
        .status(401)
        .json({ success: false, message: "Token manquant" });
    }

    // ✅ Supporte à la fois "Bearer <token>" ou juste "<token>"
    const tokenParts = token.split(" ");
    const userToken =
      tokenParts.length === 2 && tokenParts[0] === "Bearer"
        ? tokenParts[1]
        : token;

    // ✅ Vérifie la signature
    const jwtverified = jwt.verify(userToken, process.env.TOKEN_SECRET);
    req.user = jwtverified;

    logger.info("Authentification réussie", {
      userId: jwtverified.userId,
      email: jwtverified.email,
      role: jwtverified.role,
      path: req.path,
      method: req.method,
      client: headers.client || "browser",
      ip: req.ip,
    });

    next();
  } catch (error) {
    logger.error("Erreur vérification token", {
      path: req.path,
      method: req.method,
      client: req.headers?.client || "browser",
      ip: req.ip,
      error: error.message,
      errorName: error.name,
    });

    if (error.name === "TokenExpiredError") {
      logger.warn("Token expiré", {
        path: req.path,
        method: req.method,
        client: req.headers?.client || "browser",
        ip: req.ip,
      });
      return res.status(401).json({ success: false, message: "Token expiré" });
    }

    logger.warn("Token invalide", {
      path: req.path,
      method: req.method,
      client: req.headers?.client || "browser",
      ip: req.ip,
      error: error.message,
    });
    return res.status(401).json({ success: false, message: "Token invalide" });
  }
};
