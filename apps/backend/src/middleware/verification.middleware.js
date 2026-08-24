import { ForbiddenError } from "../shared/exceptions/AppError.js";

export function requireEmailVerified(req, res, next) {
  if (!req.user?.email_verified) {
    return next(new ForbiddenError("Verify your email address before performing this action."));
  }
  next();
}