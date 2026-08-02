// utils/generateToken.js
// Creates a signed JWT and sets it as an HTTP-only cookie on the response.
import jwt from 'jsonwebtoken';

/**
 * Sign a JWT for a user id.
 */
export const signToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '30d',
  });

/**
 * Sign the token AND attach it as a secure, HTTP-only cookie.
 * HTTP-only prevents JS access (XSS-safe); SameSite/secure harden CSRF + transit.
 */
export const sendTokenCookie = (res, userId) => {
  const token = signToken(userId);
  const isProd = process.env.NODE_ENV === 'production';

  res.cookie(process.env.COOKIE_NAME || 'richbayy_token', token, {
    httpOnly: true,
    secure: isProd,                       // HTTPS-only in production
    sameSite: isProd ? 'none' : 'lax',    // 'none' allows cross-site (Vercel↔Render)
    maxAge: 30 * 24 * 60 * 60 * 1000,     // 30 days
  });

  return token;
};

/**
 * Clear the auth cookie (logout).
 */
export const clearTokenCookie = (res) => {
  const isProd = process.env.NODE_ENV === 'production';
  res.cookie(process.env.COOKIE_NAME || 'richbayy_token', '', {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    expires: new Date(0),
  });
};
