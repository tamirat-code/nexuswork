import { paginationQuerySchema } from "./schemas.js";
import { ValidationError } from "../exceptions/AppError.js";

export function validatePagination(req, res, next) {
  const result = paginationQuerySchema.safeParse(req.query || {});
  if (!result.success) {
    return next(new ValidationError(result.error.errors.map((e) => e.message).join("; ")));
  }
  req.pagination = { limit: result.data.limit, skip: result.data.skip };
  next();
}
