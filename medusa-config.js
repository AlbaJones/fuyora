const dotenv = require("dotenv");

let ENV_FILE_NAME = "";
switch (process.env.NODE_ENV) {
  case "production":
    ENV_FILE_NAME = ".env.production";
    break;
  case "staging":
    ENV_FILE_NAME = ".env.staging";
    break;
  case "test":
    ENV_FILE_NAME = ".env.test";
    break;
  case "development":
  default:
    ENV_FILE_NAME = ".env";
    break;
}

try {
  dotenv.config({ path: process.cwd() + "/" + ENV_FILE_NAME });
} catch (e) {}

const DATABASE_URL = process.env.DATABASE_URL || "postgres://localhost/fuyora_db";
const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

const plugins = [
  `medusa-fulfillment-manual`,
  `medusa-payment-manual`,
  {
    resolve: `@medusajs/cache-redis`,
    options: {
      redisUrl: REDIS_URL,
    },
  },
  {
    resolve: `@medusajs/event-bus-redis`,
    options: {
      redisUrl: REDIS_URL,
    },
  },
];

const modules = {};

module.exports = {
  projectConfig: {
    jwtSecret: process.env.JWT_SECRET || "supersecret",
    cookieSecret: process.env.COOKIE_SECRET || "supersecret",
    database_url: DATABASE_URL,
    database_type: "postgres",
    store_cors: process.env.STORE_CORS || "http://localhost:8000",
    admin_cors: process.env.ADMIN_CORS || "http://localhost:7000,http://localhost:7001",
    redis_url: REDIS_URL,
  },
  plugins,
  modules,
};
