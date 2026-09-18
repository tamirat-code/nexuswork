import { env } from "./env.js";

export const legalConfig = {
  currentTermsVersion: env.termsVersion,
  net30Enabled: env.net30BillingEnabled && Boolean(env.net30PolicyVersion),
  net30PolicyVersion: env.net30PolicyVersion,
};
