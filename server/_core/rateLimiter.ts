/**
 * Rate Limiter Module
 *
 * Protects API from abuse and respects Clerk API limits.
 */

import type { Request, Response } from "express";
import rateLimit from "express-rate-limit";

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_REQUESTS_USER = 500; // 500 requests per 15 min (SPAs need headroom for batch queries)
const MAX_REQUESTS_AUTH = 10; // 10 auth attempts per 15 min

// ═══════════════════════════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Extract user ID from request (Clerk auth).
 */
function _getUserIdFromRequest(req: Request): string {
  // @ts-expect-error - Clerk adds auth to request
  const auth = req.auth;
  return auth?.userId || req.ip || "anonymous";
}

/**
 * Check if user is admin (skip rate limiting).
 */
function isAdmin(req: Request): boolean {
  // @ts-expect-error - Clerk adds auth to request
  const auth = req.auth;
  return auth?.sessionClaims?.metadata?.role === "admin";
}

// ═══════════════════════════════════════════════════════════════════════════
// RATE LIMITERS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * User rate limiter for general API requests.
 * Admins are exempt from rate limiting.
 */
// Helper to bypass express-rate-limit strict validation regex for req.ip
const getClientIp = (req: Request) => req.ip || "unknown";

/**
 * User rate limiter for general API requests.
 * Admins are exempt from rate limiting.
 */
export const userRateLimiter = rateLimit({
  windowMs: WINDOW_MS,
  max: MAX_REQUESTS_USER,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    // @ts-expect-error - Clerk adds auth to request
    const auth = req.auth;
    return auth?.userId || getClientIp(req);
  },
  skip: isAdmin,
  message: {
    error: "Too many requests",
    message: "Você excedeu o limite de requisições. Tente novamente em alguns minutos.",
    retryAfterMs: WINDOW_MS,
  },
  handler: (_req: Request, res: Response) => {
    res.status(429).json({
      error: "Too many requests",
      message: "Você excedeu o limite de requisições. Tente novamente em alguns minutos.",
    });
  },
});

/**
 * Auth rate limiter for login/webhook endpoints.
 * More restrictive to prevent brute force.
 */
export const authRateLimiter = rateLimit({
  windowMs: WINDOW_MS,
  max: MAX_REQUESTS_AUTH,
  standardHeaders: true,
  legacyHeaders: false,
  // keyGenerator removed: defaults to req.ip which is what we want
  skipSuccessfulRequests: true, // Only count failed attempts
  message: {
    error: "Too many authentication attempts",
    message: "Muitas tentativas de autenticação. Aguarde alguns minutos.",
    retryAfterMs: WINDOW_MS,
  },
  handler: (_req: Request, res: Response) => {
    res.status(429).json({
      error: "Too many authentication attempts",
      message: "Muitas tentativas de autenticação. Aguarde alguns minutos.",
    });
  },
});
