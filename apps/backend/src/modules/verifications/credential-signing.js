import {
  createHash,
  createPrivateKey,
  createPublicKey,
  generateKeyPairSync,
  sign,
  verify,
} from "node:crypto";
import { env } from "../../config/env.js";

const KEY_ENDPOINT = "/.well-known/nexuswork-issuer-key";
let issuerKeys;

function normalizePem(value) {
  return String(value || "").replace(/\\n/g, "\n").trim();
}

function loadIssuerKeys() {
  if (issuerKeys) return issuerKeys;

  const configuredPrivateKey = normalizePem(env.credentialIssuerPrivateKey);
  const configuredPublicKey = normalizePem(env.credentialIssuerPublicKey);

  if (configuredPrivateKey) {
    const privateKey = createPrivateKey(configuredPrivateKey);
    const publicKey = configuredPublicKey
      ? createPublicKey(configuredPublicKey)
      : createPublicKey(privateKey);
    issuerKeys = { privateKey, publicKey, source: "environment" };
    return issuerKeys;
  }

  if (env.isProduction) {
    throw new Error("CREDENTIAL_ISSUER_PRIVATE_KEY is required in production");
  }

  // Development/test fallback only. Production credentials must use a stable
  // environment-supplied key so their proof remains verifiable after restart.
  const generated = generateKeyPairSync("ed25519");
  issuerKeys = { privateKey: generated.privateKey, publicKey: generated.publicKey, source: "ephemeral-development" };
  return issuerKeys;
}

function canonicalize(value) {
  if (value instanceof Date) return JSON.stringify(value.toISOString());
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value)
      .filter((key) => value[key] !== undefined)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonicalize(value[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

export function canonicalizeCredential(credential) {
  return canonicalize(credential);
}

export function getCredentialIssuerPublicKey() {
  const { publicKey, source } = loadIssuerKeys();
  const publicKeyDer = publicKey.export({ type: "spki", format: "der" });
  const publicKeyPem = publicKey.export({ type: "spki", format: "pem" });
  return {
    id: `${env.credentialIssuerUrl}${KEY_ENDPOINT}`,
    type: "JsonWebKey2020",
    controller: env.credentialIssuerUrl,
    publicKeyJwk: publicKey.export({ format: "jwk" }),
    publicKeyPem,
    fingerprint: `sha256-${createHash("sha256").update(publicKeyDer).digest("hex")}`,
    source,
  };
}

export function signCredential(credential) {
  const { privateKey } = loadIssuerKeys();
  const signingPayload = canonicalizeCredential(credential);
  const proof = {
    type: "Ed25519Signature2020",
    created: new Date().toISOString(),
    verificationMethod: `${env.credentialIssuerUrl}${KEY_ENDPOINT}`,
    proofPurpose: "assertionMethod",
    proofValue: sign(null, Buffer.from(signingPayload), privateKey).toString("base64url"),
  };
  return { ...credential, proof };
}

export function verifyCredentialProof(credential) {
  if (!credential || typeof credential !== "object" || Array.isArray(credential)) {
    return { valid: false, reason: "Credential must be a JSON object" };
  }

  const { proof, ...unsignedCredential } = credential;
  if (!proof?.proofValue) {
    return { valid: false, reason: "Credential is missing a proof value" };
  }

  if (proof.verificationMethod !== `${env.credentialIssuerUrl}${KEY_ENDPOINT}`) {
    return { valid: false, reason: "Credential was not signed by this NexusWork issuer" };
  }

  try {
    const { publicKey } = loadIssuerKeys();
    const signingPayload = canonicalizeCredential(unsignedCredential);
    const valid = verify(
      null,
      Buffer.from(signingPayload),
      publicKey,
      Buffer.from(proof.proofValue, "base64url")
    );

    return valid
      ? { valid: true, reason: "Credential signature is valid" }
      : { valid: false, reason: "Credential signature is invalid or the credential was changed" };
  } catch (err) {
    return { valid: false, reason: "Credential proof could not be verified" };
  }
}
