import rateLimit from "express-rate-limit";

// General rate limiter for most endpoints
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Stricter rate limiter for auth-required endpoints
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Limit each IP to 50 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

// Very strict rate limiter for KYC submission (prevent spam)
export const kycSubmissionLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // Only 5 KYC submissions per hour per IP
  message: "Too many KYC submissions. Please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

// Admin endpoint rate limiter (stricter than auth)
export const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Admins can make more requests, but still limited
  message: "Too many admin requests from this IP, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

// Presigned URL rate limiter (prevent storage exhaustion)
export const presignLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // 20 presigned URLs per hour per IP
  message: "Too many presigned URL requests. Please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});
