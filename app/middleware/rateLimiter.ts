import rateLimit from 'express-rate-limit';

/**
 * Creates a basic rate limiter middleware.
 * @param maxRequests - Maximum number of requests allowed.
 * @param time - Time window in milliseconds.
 * @returns Express middleware for rate limiting.
 */
export const createBasicRateLimiter = (maxRequests: number, time: number) => {
  return rateLimit({
    max: maxRequests,
    windowMs: time,
    message: 'Too many requests, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
  });
};
