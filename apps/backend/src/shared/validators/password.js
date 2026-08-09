import { ValidationError } from "../exceptions/AppError.js";

// Enforced everywhere a password is set or changed: registration, reset,
// and change-password. Centralized so the rule can only drift in one place.
export function requireStrongPassword(password) {
  if (typeof password !== "string" || password.length < 8) {
    throw new ValidationError("Password must be at least 8 characters");
  }
  if (!/[a-z]/.test(password)) {
    throw new ValidationError("Password must include at least one lowercase letter");
  }
  if (!/[A-Z]/.test(password)) {
    throw new ValidationError("Password must include at least one uppercase letter");
  }
  if (!/[0-9]/.test(password)) {
    throw new ValidationError("Password must include at least one number");
  }
}