const fetch = require("node-fetch");
const { logger } = require("shared-middlewares");
const serviceConfig = require("../config/serviceconfig");

class ApiClient {
  constructor(serviceName) {
    this.serviceName = serviceName;
  }

  async request(endpoint, options = {}) {
    const config = serviceConfig.services[this.serviceName];
    if (!config) {
      throw new Error(
        `Configuration manquante pour le service: ${this.serviceName}`
      );
    }

    const url = `${config.url}${endpoint}`;
    const timeout = config.timeout || 5000;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          "X-Internal-API-Key": config.apiKey,
          ...options.headers,
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);

      if (error.name === "AbortError") {
        logger.error(`Timeout calling ${this.serviceName}`, {
          service: this.serviceName,
          endpoint,
          timeout,
        });
        throw new Error(`Service ${this.serviceName} non disponible (timeout)`);
      }

      logger.error(`Error calling ${this.serviceName}`, {
        service: this.serviceName,
        endpoint,
        error: error.message,
      });
      throw error;
    }
  }

  async post(endpoint, data) {
    return this.request(endpoint, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }
}

// Client pour CoursierService
const coursierClient = new ApiClient("coursier");

module.exports = {
  ApiClient,
  coursierClient,
};
