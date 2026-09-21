import crypto from "node:crypto";
import User from "../users/users.model.js";
import Wallet from "../wallets/wallets.model.js";
import ClientProfile from "../clients/clients.model.js";
import Organization from "../organizations/organizations.model.js";
import OrgMembership from "../organizations/org-membership.model.js";
import SsoTransaction from "./sso-transaction.model.js";
import { requireOrganizationRole } from "../organizations/organizations.service.js";
import { recordEvent } from "../audit-logs/audit-logs.service.js";
import { issueTokenForUser } from "./auth.service.js";
import { authConfig } from "../../config/auth.config.js";
import { env } from "../../config/env.js";
import { legalConfig } from "../../config/legal.config.js";
import { ForbiddenError, NotFoundError, ValidationError } from "../../shared/exceptions/AppError.js";

const SSO_ROLES = ["admin", "recruiter", "billing_viewer"];

function base64url(value) {
  return Buffer.from(value).toString("base64url");
}

function decodePart(value) {
  return JSON.parse(Buffer.from(value, "base64url").toString("utf8"));
}

function validHttpUrl(value) {
  const url = new URL(value);
  if (env.isProduction && url.protocol !== "https:") throw new ValidationError("OIDC endpoints must use HTTPS in production");
  return url.toString().replace(/\/$/, "");
}

function secretKey() {
  if (!authConfig.jwtSecret) throw new ValidationError("JWT_SECRET is required for SSO configuration");
  return crypto.createHash("sha256").update(authConfig.jwtSecret).digest();
}

function encryptSecret(value) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", secretKey(), iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  return [iv, cipher.getAuthTag(), encrypted].map((part) => part.toString("base64url")).join(".");
}

function decryptSecret(value) {
  const [iv, tag, encrypted] = String(value || "").split(".").map((part) => Buffer.from(part, "base64url"));
  if (!iv || !tag || !encrypted) throw new ValidationError("Stored OIDC client secret is invalid");
  const decipher = crypto.createDecipheriv("aes-256-gcm", secretKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
}

function claimValue(claims, path) {
  return String(path || "groups").split(".").reduce((value, key) => value?.[key], claims);
}

function claimValues(value) {
  if (Array.isArray(value)) return value.map(String);
  return value === undefined || value === null ? [] : [String(value)];
}

function roleFromClaims(claims, sso) {
  const values = claimValues(claimValue(claims, sso.role_claim));
  for (const role of SSO_ROLES) {
    const mapped = Array.isArray(sso.role_mapping?.[role]) ? sso.role_mapping[role].map(String) : [];
    if (values.some((value) => mapped.includes(value))) return role;
  }
  return "recruiter";
}

async function discover(issuer) {
  const response = await fetch(`${issuer.replace(/\/$/, "")}/.well-known/openid-configuration`);
  if (!response.ok) throw new ValidationError("OIDC discovery failed for this issuer");
  const metadata = await response.json();
  for (const key of ["authorization_endpoint", "token_endpoint", "jwks_uri"]) if (!metadata[key]) throw new ValidationError(`OIDC discovery is missing ${key}`);
  return metadata;
}

async function audit(eventType, action, organizationId, actor, metadata = {}) {
  await recordEvent({
    actor: actor || { role: "system" }, eventType, action,
    entityType: "organization", entityId: organizationId, organizationId,
    correlationId: crypto.randomUUID(), metadata,
  });
}

export async function configureOrganizationSso(organizationId, actor, input, req) {
  await requireOrganizationRole(organizationId, actor._id, ["admin"]);
  const organization = await Organization.findOne({ _id: organizationId, status: "active" }).select("+sso.client_secret");
  if (!organization) throw new NotFoundError("Organization not found");
  const enabled = input.enabled !== false;
  const issuer = input.issuer ? validHttpUrl(input.issuer) : organization.sso?.issuer;
  if (enabled && !issuer) throw new ValidationError("OIDC issuer is required when SSO is enabled");
  let metadata = organization.sso?.authorization_endpoint ? organization.sso : null;
  if (input.issuer || input.client_id || input.client_secret) metadata = await discover(issuer);
  const clientSecret = input.client_secret ? encryptSecret(input.client_secret) : organization.sso?.client_secret;
  if (enabled && (!input.client_id && !organization.sso?.client_id || !clientSecret)) throw new ValidationError("OIDC client ID and client secret are required");
  const domains = (input.allowed_domains || organization.sso?.allowed_domains || []).map((domain) => domain.trim().toLowerCase()).filter(Boolean);
  if (enabled && !domains.length) throw new ValidationError("At least one organization email domain is required");
  organization.sso = {
    ...(organization.sso?.toObject?.() || organization.sso || {}),
    enabled,
    enforced: enabled ? Boolean(input.enforced) : false,
    provider: "oidc",
    issuer: issuer || null,
    client_id: input.client_id || organization.sso?.client_id || null,
    client_secret: clientSecret || null,
    authorization_endpoint: metadata?.authorization_endpoint || organization.sso?.authorization_endpoint || null,
    token_endpoint: metadata?.token_endpoint || organization.sso?.token_endpoint || null,
    jwks_uri: metadata?.jwks_uri || organization.sso?.jwks_uri || null,
    allowed_domains: domains,
    role_claim: input.role_claim || organization.sso?.role_claim || "groups",
    role_mapping: input.role_mapping || organization.sso?.role_mapping || { admin: ["admin"], recruiter: ["recruiter"], billing_viewer: ["billing_viewer"] },
    configured_at: new Date(),
    configured_by: actor._id,
  };
  await organization.save();
  await audit("SSO_CONFIGURATION_UPDATED", "organization.sso_configuration_updated", organization._id, actor, { enabled, enforced: organization.sso.enforced, domains });
  return publicSso(organization.sso);
}

export function publicSso(sso = {}) {
  return {
    enabled: Boolean(sso.enabled), enforced: Boolean(sso.enforced), provider: sso.provider || "oidc",
    issuer: sso.issuer || null, client_id: sso.client_id || null, allowed_domains: sso.allowed_domains || [],
    role_claim: sso.role_claim || "groups", role_mapping: sso.role_mapping || {}, configured_at: sso.configured_at || null,
  };
}

export async function getOrganizationSso(organizationId, userId) {
  await requireOrganizationRole(organizationId, userId);
  const organization = await Organization.findById(organizationId).select("sso").lean();
  if (!organization) throw new NotFoundError("Organization not found");
  return publicSso(organization.sso);
}

export async function startSso(email) {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const domain = normalizedEmail.split("@")[1];
  if (!domain) throw new ValidationError("Enter your organization email to continue with SSO");
  const organizations = await Organization.find({ status: "active", "sso.enabled": true, "sso.allowed_domains": domain }).select("+sso.client_secret sso owner_id name").lean();
  if (!organizations.length) throw new NotFoundError("No organization SSO is configured for this email domain");
  if (organizations.length > 1) throw new ValidationError("This email domain is associated with multiple organization SSO configurations");
  const organization = organizations[0];
  const state = base64url(crypto.randomBytes(32));
  const nonce = base64url(crypto.randomBytes(32));
  const verifier = base64url(crypto.randomBytes(48));
  const challenge = base64url(crypto.createHash("sha256").update(verifier).digest());
  await SsoTransaction.create({ state, nonce, code_verifier: verifier, organization_id: organization._id, expires_at: new Date(Date.now() + 10 * 60 * 1000) });
  const url = new URL(organization.sso.authorization_endpoint);
  url.searchParams.set("client_id", organization.sso.client_id);
  url.searchParams.set("redirect_uri", env.ssoCallbackUrl);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid profile email");
  url.searchParams.set("state", state);
  url.searchParams.set("nonce", nonce);
  url.searchParams.set("code_challenge", challenge);
  url.searchParams.set("code_challenge_method", "S256");
  await audit("SSO_LOGIN_STARTED", "organization.sso_login_started", organization._id, null, { email_domain: domain });
  return url.toString();
}

async function verifyIdToken(idToken, sso, expectedNonce) {
  const [encodedHeader, encodedPayload, encodedSignature] = String(idToken || "").split(".");
  if (!encodedHeader || !encodedPayload || !encodedSignature) throw new ValidationError("OIDC returned an invalid ID token");
  const header = decodePart(encodedHeader);
  const claims = decodePart(encodedPayload);
  if (header.alg !== "RS256") throw new ValidationError("Only RS256 OIDC ID tokens are supported");
  if (claims.iss !== sso.issuer || !(Array.isArray(claims.aud) ? claims.aud.includes(sso.client_id) : claims.aud === sso.client_id) || claims.nonce !== expectedNonce || Number(claims.exp) < Math.floor(Date.now() / 1000)) throw new ValidationError("OIDC ID token validation failed");
  const jwksResponse = await fetch(sso.jwks_uri);
  const jwks = await jwksResponse.json();
  const jwk = jwks.keys?.find((key) => key.kid === header.kid && key.kty === "RSA");
  if (!jwk) throw new ValidationError("OIDC signing key was not found");
  const publicKey = crypto.createPublicKey({ key: jwk, format: "jwk" });
  const verifier = crypto.createVerify("RSA-SHA256");
  verifier.update(`${encodedHeader}.${encodedPayload}`);
  if (!verifier.verify(publicKey, Buffer.from(encodedSignature, "base64url"))) throw new ValidationError("OIDC ID token signature is invalid");
  return claims;
}

export async function finishSso({ code, state }) {
  const transaction = await SsoTransaction.findOneAndUpdate(
    { state, expires_at: { $gt: new Date() }, consumed_at: null },
    { $set: { consumed_at: new Date() } },
    { new: true },
  );
  if (!transaction) throw new ValidationError("SSO session expired or was already used");
  const organization = await Organization.findById(transaction.organization_id).select("+sso.client_secret");
  if (!organization?.sso?.enabled) throw new ForbiddenError("Organization SSO is disabled");
  const response = await fetch(organization.sso.token_endpoint, { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ grant_type: "authorization_code", code, redirect_uri: env.ssoCallbackUrl, client_id: organization.sso.client_id, client_secret: decryptSecret(organization.sso.client_secret), code_verifier: transaction.code_verifier }) });
  if (!response.ok) throw new ValidationError("OIDC token exchange failed");
  const tokens = await response.json();
  const claims = await verifyIdToken(tokens.id_token, organization.sso, transaction.nonce);
  const email = String(claims.email || "").toLowerCase();
  const domain = email.split("@")[1];
  if (!claims.email_verified || !organization.sso.allowed_domains.includes(domain)) throw new ForbiddenError("Your verified identity is not allowed in this organization");
  let user = await User.findOne({ $or: [{ oidc_issuer: organization.sso.issuer, oidc_subject: claims.sub }, { email }] }).select("+password_hash");
  let role = roleFromClaims(claims, organization.sso);
  const existingMembership = user && await OrgMembership.findOne({ organization_id: organization._id, user_id: user._id, status: "active" });
  const accountLinked = Boolean(existingMembership && (!user.oidc_issuer || !user.oidc_subject));
  if (user && !existingMembership) throw new ForbiddenError("Your account is not a member of this organization");
  if (!user) {
    user = await User.create({ email, name: claims.name || claims.preferred_username || email.split("@")[0], role: "client", auth_provider: "oidc", oidc_issuer: organization.sso.issuer, oidc_subject: claims.sub, email_verified: true, terms_accepted_at: new Date(), terms_version: legalConfig.currentTermsVersion });
    await Wallet.create({ user_id: user._id });
    await ClientProfile.create({ user_id: user._id, organization_type: "organization", organization_name: organization.name });
    await OrgMembership.create({ organization_id: organization._id, user_id: user._id, role, invited_by: organization.owner_id });
  } else {
    if (!user.oidc_issuer || !user.oidc_subject) { user.oidc_issuer = organization.sso.issuer; user.oidc_subject = claims.sub; user.auth_provider = "oidc"; user.email_verified = true; await user.save(); }
    role = existingMembership.role;
  }
  await audit("SSO_LOGIN_SUCCEEDED", "organization.sso_login_succeeded", organization._id, user, { user_id: user._id, role, account_linked: Boolean(existingMembership) });
  await audit("SSO_ROLE_MAPPED", "organization.sso_role_mapped", organization._id, user, { user_id: user._id, role });
  if (accountLinked) await audit("SSO_ACCOUNT_LINKED", "organization.sso_account_linked", organization._id, user, { user_id: user._id });
  return { token: issueTokenForUser(user), user, organizationId: organization._id };
}
