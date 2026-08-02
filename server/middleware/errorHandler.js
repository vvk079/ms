// middleware/errorHandler.js
// Central Express error handler + 404 fallback. Normalises Mongoose/JWT errors
// into clean JSON so the frontend can always rely on { message } shape.

// 404 for unmatched routes — forwarded into the error handler below.
export const notFound = (req, res, next) => {
  const err = new Error(`Route not found: ${req.originalUrl}`);
  res.status(404);
  next(err);
};

export const errorHandler = (err, req, res, next) => {
  // Default to 500 unless a controller already set a 4xx status.
  let status = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
  let message = err.message || 'Server Error';

  // Mongoose bad ObjectId
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    status = 404;
    message = 'Resource not found';
  }

  // Mongoose duplicate key (e.g. email/slug/SKU already exists)
  if (err.code === 11000) {
    status = 409;
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    message = `${field} already exists`;
  }

  // Mongoose validation error — collapse to first message.
  if (err.name === 'ValidationError') {
    status = 400;
    message = Object.values(err.errors).map((e) => e.message).join(', ');
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') { status = 401; message = 'Invalid token'; }
  if (err.name === 'TokenExpiredError') { status = 401; message = 'Session expired, please log in again'; }

  res.status(status).json({
    message,
    // Only leak stack traces outside production.
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
  });
};
