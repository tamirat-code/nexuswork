import Stripe from "stripe";
import { paymentConfig } from "../../config/payment.config.js";
import { appConfig } from "../../config/app.config.js";


if (appConfig.env === "production" && !paymentConfig.stripeSecretKey) {
  throw new Error("[stripe] STRIPE_SECRET_KEY must be set in production environment");
}

if (!paymentConfig.stripeSecretKey) {
  console.warn(
    "[stripe] STRIPE_SECRET_KEY is not set. Payment endpoints will throw until it's configured in .env."
  );
}

export const stripe = new Stripe(paymentConfig.stripeSecretKey || "sk_test_placeholder", {
  apiVersion: "2024-06-20",
});