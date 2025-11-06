const redisClient = require("./redis");

// Invalider cache par pattern
const invalidateCache = async (pattern) => {
  try {
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(keys);
      console.log(`🗑️ [CACHE] Invalidated ${keys.length} keys: ${pattern}`);
    }
  } catch (error) {
    console.error("❌ [CACHE] Erreur invalidation:", error.message);
  }
};

module.exports = { invalidateCache };
