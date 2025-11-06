function isAgent(req, res, next) {
  if (req.user.role !== "agent") {
    return res.status(403).json({
      success: false,
      message: "Accès réservé aux agents",
    });
  }
  next();
}

module.exports = { isAgent };
