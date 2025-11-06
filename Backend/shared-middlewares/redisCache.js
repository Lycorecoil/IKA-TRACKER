const redisClient = require("./redis");

const redisCache = (ttl = 300) => {
  return async (req, res, next) => {
    // Seulement GET requests
    if (req.method !== "GET") return next();

    const key = `cache:${req.originalUrl}`;

    try {
      // Vérifier le cache
      const cached = await redisClient.get(key);

      if (cached) {
        console.log(`✅ [CACHE] HIT: ${key}`);
        return res.json(JSON.parse(cached));
      }

      console.log(`❌ [CACHE] MISS: ${key}`);

      // Intercepter res.json()
      const originalJson = res.json.bind(res);

      res.json = function (data) {
        // Stocker dans Redis
        redisClient.setEx(key, ttl, JSON.stringify(data)).catch((err) => {
          console.error("❌ Redis cache error:", err);
        });

        return originalJson(data);
      };

      next();
    } catch (error) {
      console.error("❌ Redis middleware error:", error);
      next();
    }
  };
};

module.exports = redisCache;
