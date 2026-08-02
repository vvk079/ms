// middleware/validate.js
// Runs express-validator chains and short-circuits with a 400 if any fail.
import { validationResult } from 'express-validator';

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();

  // Return the first error message per field for a clean UI.
  res.status(400).json({
    message: errors.array()[0].msg,
    errors: errors.array().map((e) => ({ field: e.path, msg: e.msg })),
  });
};

export default validate;
