import AppError from "../utils/AppError.js";
import redisClient from "../config/redisConfig.js";

/**
 * Check and increment rate limit counter in Redis without Lua scripts.
 */
async function checkLimit(key, limit, window) {
  const multi = redisClient.multi();
  multi.incr(key);
  multi.ttl(key);
  const results = await multi.exec();

  const count = results[0][1];
  let ttl = results[1][1];

  if (count === 1 || ttl === -1) {
    await redisClient.expire(key, window);
    ttl = window;
  }

  return {
    count,
    ttl: ttl > 0 ? ttl : window,
    allowed: count <= limit
  };
}

/**
 * Reusable Rate Limiter Middleware
 */
const rateLimiter = (config) => {
  return async (req, res, next) => {
    try {
      const { name, global, ip, identity } = config;
      const checks = [];

      // 1. Global limit (Shared across all incoming requests)
      if (global) {
        checks.push({
          key: `rate-limit:global:${name}`,
          limit: global.limit,
          window: global.window
        });
      }

      // 2. IP limit (Per client IP)
      if (ip) {
        const ipAddress = req.ip || req.socket?.remoteAddress || "127.0.0.1";
        checks.push({
          key: `rate-limit:${name}:ip:${ipAddress}`,
          limit: ip.limit,
          window: ip.window
        });
      }

      // 3. Identity limit (Email for unauthenticated, UserId for authenticated)
      if (identity) {
        let identityValue = null;

        if (identity.type === "email") {
          const rawEmail = req.body?.email || req.query?.email;
          if (typeof rawEmail === "string" && rawEmail.trim().length > 0) {
            identityValue = rawEmail.trim().toLowerCase();
          }
        } else if (identity.type === "user") {
          // For authenticated APIs from JWT (req.user.userId) or MFA body (req.body.userId)
          identityValue = req.user?.userId || req.body?.userId;
        }

        if (identityValue) {
          checks.push({
            key: `rate-limit:${name}:${identity.type}:${identityValue}`,
            limit: identity.limit,
            window: identity.window
          });
        }
      }

      // If no limiters configured, continue
      if (checks.length === 0) {
        return next();
      }

      // Run checks in parallel
      const results = await Promise.all(
        checks.map(async (c) => {
          const outcome = await checkLimit(c.key, c.limit, c.window);
          return { ...c, ...outcome };
        })
      );

      // If any limit is exceeded, block with 429
      const blocked = results.filter((r) => !r.allowed);
      if (blocked.length > 0) {
        const maxTtl = Math.max(...blocked.map((b) => b.ttl));
        res.set("Retry-After", String(maxTtl));
        return next(new AppError(429, "Too many requests. Please try again later."));
      }
      next();
    } catch (error) {
      console.error(`[RateLimiter] Redis error on ${config.name}:`, error.message);
      // Fail-open: allow request through if Redis fails
      next();
    }
  };
};

/**
 * Endpoint configurations
 */
const RATE_LIMIT_CONFIGS = {
  login: {
    name: "login",
    global: { limit: 1000, window: 60 },
    ip: { limit: 30, window: 60 },
    identity: { type: "email", limit: 5, window: 300 }
  },

  signup: {
    name: "signup",
    global: { limit: 500, window: 60 },
    ip: { limit: 20, window: 600 },
    identity: { type: "email", limit: 5, window: 600 }
  },

  forgotPassword: {
    name: "forgot-password",
    global: { limit: 500, window: 60 },
    ip: { limit: 10, window: 900 },
    identity: { type: "email", limit: 3, window: 900 }
  },

  verifyOtp: {
    name: "verify-otp",
    global: { limit: 500, window: 60 },
    ip: { limit: 20, window: 600 },
    identity: { type: "email", limit: 5, window: 600 }
  },

  resetPassword: {
    name: "reset-password",
    global: { limit: 500, window: 60 },
    ip: { limit: 10, window: 600 },
    identity: { type: "email", limit: 5, window: 600 }
  },

  verifyMfa: {
    name: "verify-mfa",
    global: { limit: 500, window: 60 },
    ip: { limit: 20, window: 600 },
    identity: { type: "user", limit: 5, window: 600 }
  },

  refreshToken: {
    name: "refresh-token",
    global: { limit: 1000, window: 60 },
    ip: { limit: 30, window: 60 }
  },

  changePassword: {
    name: "change-password",
    global: { limit: 5000, window: 60 },
    identity: { type: "user", limit: 100, window: 60 }
  }
};

export { rateLimiter, RATE_LIMIT_CONFIGS };

