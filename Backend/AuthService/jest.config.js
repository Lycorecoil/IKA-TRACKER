module.exports = {
  testEnvironment: "node",
  setupFilesAfterEnv: ["<rootDir>/tests/setup.js"],
  testMatch: ["**/tests/**/*.test.js"],
  collectCoverageFrom: ["src/**/*.js", "!src/index.js"],
  coverageDirectory: "coverage",
  coverageReporters: ["text", "lcov", "html"],
  // Ajouts spécifiques Windows
  testPathIgnorePatterns: ["\\\\node_modules\\\\"],
  transformIgnorePatterns: ["\\\\node_modules\\\\"],
};
