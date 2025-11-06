// Middleware pour capturer le body brut (nécessaire pour Stripe webhook)
const rawBody = (req, res, next) => {
  if (req.originalUrl === "/api/payments/webhook") {
    let data = "";
    req.setEncoding("utf8");

    req.on("data", (chunk) => {
      data += chunk;
    });

    req.on("end", () => {
      req.rawBody = data;
      next();
    });
  } else {
    next();
  }
};

module.exports = rawBody;
