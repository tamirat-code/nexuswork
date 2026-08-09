import { recaptchaConfig } from "../../config/recaptcha.config.js";
import { ValidationError } from "../exceptions/AppError.js";
import { logger } from "../logger/logger.js";

if (!recaptchaConfig.secretKey) {
  console.warn(
    "[recaptcha] RECAPTCHA_SECRET_KEY is not set. Registration will reject every request until it's configured in .env."
  );
}


export async function verifyRecaptcha(token) {
  if (!token) {
    throw new ValidationError("Missing reCAPTCHA verification");
  }

  const params = new URLSearchParams({ secret: recaptchaConfig.secretKey, response: token });
  const res = await fetch("https://www.google.com/recaptcha/api/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params,
  });
  const result = await res.json();

  if (!result.success) {
    logger.warn("[recaptcha] verification failed:", result["error-codes"]);
    throw new ValidationError("reCAPTCHA verification failed. Please try again.");
  }
  if (typeof result.score === "number" && result.score < recaptchaConfig.minScore) {
    logger.warn(`[recaptcha] score too low: ${result.score}`);
    throw new ValidationError("This request looks automated and was blocked.");
  }
}