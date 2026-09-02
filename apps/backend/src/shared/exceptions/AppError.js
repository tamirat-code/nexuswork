export class AppError extends Error {
  constructor(message, status = 500, code = null) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Resource not found", code = null) {
    super(message, 404, code);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Insufficient permissions", code = null) {
    super(message, 403, code);
  }
}

export class ValidationError extends AppError {
  constructor(message = "Invalid input", code = null) {
    super(message, 400, code);
  }
}

export class ConflictError extends AppError {
  constructor(message = "The requested change conflicts with an existing resource", code = null) {
    super(message, 409, code);
  }
}
