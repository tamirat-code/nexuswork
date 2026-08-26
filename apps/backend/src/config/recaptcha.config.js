import { env } from "./env.js";

export const recaptchaConfig = {
  secretKey: env.recaptchaSecretKey,
  minScore: env.recaptchaMinScore, // v3 returns 0 (bot) to 1 (human)
};
