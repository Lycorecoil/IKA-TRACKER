const errorHandler = require("./middlewares/errorHandler");
const { identifier } = require("./middlewares/identification");
const { isAdmin } = require("./middlewares/isAdmin");
const { isAgent } = require("./middlewares/isAgent");
const { sendMail } = require("./middlewares/sendMail");
const { logger } = require("./middlewares/logger");
const {
  ServiceClient,
  createServiceClient,
} = require("./middlewares/serviceClient"); // ← NOUVEAU

module.exports = {
  identifier,
  isAdmin,
  isAgent,
  sendMail,
  logger,
  errorHandler,
  ServiceClient,
  createServiceClient,
};
