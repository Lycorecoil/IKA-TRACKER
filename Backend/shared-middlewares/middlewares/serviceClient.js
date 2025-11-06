const fetch = require("node-fetch");
const { logger } = require("./logger");

/**
 * Client HTTP centralisé pour la communication inter-services
 * Gère : timeout, retry, logs, erreurs, authentification
 */
class ServiceClient {
  constructor(serviceName, options = {}) {
    this.serviceName = serviceName;
    this.baseUrl =
      options.baseUrl ||
      process.env[`${serviceName.toUpperCase()}_SERVICE_URL`];
    this.apiKey = options.apiKey || process.env.INTERNAL_API_KEY;
    this.timeout = options.timeout || 5000;
    this.retries = options.retries || 2;

    if (!this.baseUrl) {
      throw new Error(
        `URL manquante pour le service ${serviceName}. Vérifiez ${serviceName.toUpperCase()}_SERVICE_URL dans .env`
      );
    }
  }

  /**
   * Effectue un appel HTTP avec gestion retry et timeout
   */
  async call(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    let lastError;

    // Tentatives avec retry
    for (let attempt = 1; attempt <= this.retries + 1; attempt++) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      try {
        logger.info(`Appel service ${this.serviceName}`, {
          url,
          method: options.method || "GET",
          attempt,
        });

        const response = await fetch(url, {
          ...options,
          signal: controller.signal,
          headers: {
            "Content-Type": "application/json",
            "X-Internal-API-Key": this.apiKey,
            ...options.headers,
          },
        });

        clearTimeout(timeoutId);

        // Log de la réponse
        logger.info(`Réponse service ${this.serviceName}`, {
          url,
          status: response.status,
          attempt,
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(
            `HTTP ${response.status}: ${errorText || "Erreur inconnue"}`
          );
        }

        const data = await response.json();
        return data;
      } catch (error) {
        clearTimeout(timeoutId);
        lastError = error;

        // Gestion timeout
        if (error.name === "AbortError") {
          logger.warn(`Timeout appel service ${this.serviceName}`, {
            url,
            timeout: this.timeout,
            attempt,
          });
        } else {
          logger.warn(`Erreur appel service ${this.serviceName}`, {
            url,
            error: error.message,
            attempt,
          });
        }

        // Retry seulement si ce n'est pas la dernière tentative
        if (attempt <= this.retries) {
          const delay = attempt * 1000; // Backoff exponentiel
          logger.info(`Retry dans ${delay}ms`, {
            service: this.serviceName,
            attempt,
          });
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }
      }
    }

    // Si toutes les tentatives échouent
    logger.error(`Échec définitif appel service ${this.serviceName}`, {
      url: `${this.baseUrl}${endpoint}`,
      error: lastError.message,
      retries: this.retries,
    });

    throw new Error(
      `Service ${this.serviceName} indisponible: ${lastError.message}`
    );
  }

  /**
   * Méthode POST simplifiée
   */
  async post(endpoint, data) {
    return this.call(endpoint, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  /**
   * Méthode GET simplifiée
   */
  async get(endpoint) {
    return this.call(endpoint, {
      method: "GET",
    });
  }

  /**
   * Méthode PUT simplifiée
   */
  async put(endpoint, data) {
    return this.call(endpoint, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  /**
   * Méthode DELETE simplifiée
   */
  async delete(endpoint) {
    return this.call(endpoint, {
      method: "DELETE",
    });
  }
}

/**
 * Factory pour créer rapidement des clients
 */
const createServiceClient = (serviceName, options) => {
  return new ServiceClient(serviceName, options);
};

module.exports = {
  ServiceClient,
  createServiceClient,
};
