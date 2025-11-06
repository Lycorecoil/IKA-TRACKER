const redis = require("redis");

const client = redis.createClient({
  host: process.env.REDIS_HOST || "localhost",
  port: process.env.REDIS_PORT || 6379,
});

client.on("error", (err) => {
  console.error("❌ Redis Error:", err);
});

client.on("connect", () => {
  console.log("✅ Redis Connected");
});

client.connect().catch((err) => {
  console.error("❌ Redis connection failed:", err);
});

module.exports = client;
