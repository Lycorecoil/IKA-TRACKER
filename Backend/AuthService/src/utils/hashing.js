const bcrypt = require("bcrypt");

exports.doHash = (value, saltValue) => {
  return bcrypt.hash(value, saltValue);
};

exports.doHashValidation = (value, hashedValue) => {
  return bcrypt.compare(value, hashedValue);
};

exports.hmacProcess = (value, key) => {
  const { createHmac } = require("crypto");
  return createHmac("sha256", key).update(value).digest("hex");
};
