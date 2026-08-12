import { ValidationError } from "../exceptions/AppError.js";

function formatIssues(issues) {
  return issues.map((issue) => `${issue.path.join(".") || "body"}: ${issue.message}`).join("; ");
}



export function validateBody(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return next(new ValidationError(formatIssues(result.error.issues)));
    }
    req.body = result.data;
    next();
  };
}

export function validateParams(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.params);
    if (!result.success) {
      return next(new ValidationError(formatIssues(result.error.issues)));
    }
    req.params = result.data;
    next();
  };
}

export function validateQuery(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      return next(new ValidationError(formatIssues(result.error.issues)));
    }
    req.validatedQuery = result.data;
    next();
  };
}