// middleware/authMiddleware.js
// Route protection: verifies the JWT (from HTTP-only cookie or Bearer header),
// loads the user, and enforces role-based access for admin routes.
import jwt from 'jsonwebtoken';
import asyncHandler from './asyncHandler.js';
import User from '../models/User.js';

/**
 * `protect` — requires a valid, non-expired token and an existing user.
 * Attaches the sanitised user document to req.user.
 */
export const protect = asyncHandler(async (req, res, next) => {
  let token;

  // Prefer the HTTP-only cookie; fall back to Authorization: Bearer <token>.
  if (req.cookies && req.cookies[process.env.COOKIE_NAME || 'richbayy_token']) {
    token = req.cookies[process.env.COOKIE_NAME || 'richbayy_token'];
  } else if (req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    res.status(401);
    throw new Error('Not authorised — no token provided');
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const user = await User.findById(decoded.id).select('-password');

  if (!user) {
    res.status(401);
    throw new Error('Not authorised — user no longer exists');
  }

  req.user = user;
  next();
});

/**
 * `admin` — must run AFTER `protect`. Blocks non-admin roles.
 */
export const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') return next();
  res.status(403);
  throw new Error('Access denied — admin privileges required');
};

/**
 * `optionalAuth` — attaches req.user if a valid token exists, but never blocks.
 * Used on public endpoints that personalise output when logged in.
 */
export const optionalAuth = asyncHandler(async (req, res, next) => {
  let token =
    req.cookies?.[process.env.COOKIE_NAME || 'richbayy_token'] ||
    (req.headers.authorization?.startsWith('Bearer ')
      ? req.headers.authorization.split(' ')[1]
      : null);

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');
    } catch {
      req.user = null; // ignore bad tokens on optional routes
    }
  }
  next();
});
