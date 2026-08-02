// middleware/asyncHandler.js
// Wraps async controllers so rejected promises flow to the central error handler,
// removing repetitive try/catch blocks throughout the controllers.
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

export default asyncHandler;
