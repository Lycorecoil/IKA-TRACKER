module.exports = {
  services: {
    coursier: {
      url: process.env.COURSIER_SERVICE_URL || "http://localhost:8001",
      apiKey: process.env.INTERNAL_API_KEY,
      timeout: parseInt(process.env.SERVICE_TIMEOUT) || 5000,
    },
  },
  auth: {
    jwt: {
      secret: process.env.TOKEN_SECRET,
      expiration: process.env.JWT_EXPIRATION || "1h",
    },
    verification: {
      codeExpiration:
        parseInt(process.env.VERIFICATION_CODE_EXPIRATION) || 3600000,
      hmacKey: process.env.HMAC_VERIFIATION_KEY,
    },
  },
  email: {
    user: process.env.EMAIL_USER,
    from: process.env.EMAIL_USER,
  },
  server: {
    port: process.env.PORT || 8000,
    nodeEnv: process.env.NODE_ENV || "development",
  },
};
