export const recaptchaConfig = {
  secretKey: process.env.RECAPTCHA_SECRET_KEY,
  minScore: Number(process.env.RECAPTCHA_MIN_SCORE || 0.5), // v3 returns 0 (bot) to 1 (human)
};