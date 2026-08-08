import { OAuth2Client } from "google-auth-library";
import { googleConfig } from "../../config/google.config.js";

if (!googleConfig.clientId) {
  console.warn(
    "[google-auth] GOOGLE_CLIENT_ID is not set. Google sign-in will reject every request until it's configured in .env."
  );
}

const client = new OAuth2Client(googleConfig.clientId);


export async function verifyGoogleIdToken(idToken) {
  const ticket = await client.verifyIdToken({
    idToken,
    audience: googleConfig.clientId,
  });
  const payload = ticket.getPayload();
  return {
    googleId: payload.sub,
    email: payload.email,
    emailVerified: payload.email_verified,
    name: payload.name,
  };
}