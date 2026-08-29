import { logger } from "./logger.js";

export function reportValidation(message, context = {}) {
  const error = new Error(message);
  logger.warn("Frontend validation blocked submission", { ...context, error: { name: error.name, message: error.message } });
  return message;
}

export function validEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());
}

export function passwordIssue(value) {
  const password = String(value || "");
  if (password.length < 8) return "Password must be at least 8 characters.";
  if (password.length > 128) return "Password must be 128 characters or fewer.";
  if (!/[a-z]/.test(password)) return "Password needs a lowercase letter.";
  if (!/[A-Z]/.test(password)) return "Password needs an uppercase letter.";
  if (!/[0-9]/.test(password)) return "Password needs a number.";
  return "";
}

export function validHttpUrl(value) {
  try {
    const url = new URL(String(value || "").trim());
    return ["http:", "https:"].includes(url.protocol);
  } catch {
    return false;
  }
}
