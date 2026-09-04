import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "node:crypto";
import User from "../users/users.model.js";
import Wallet from "../wallets/wallets.model.js";
import StudentProfile from "../students/students.model.js";
import ClientProfile from "../clients/clients.model.js";
import University from "../universities/universities.model.js";
import { RevokedToken, PasswordResetToken, EmailVerificationToken } from "./tokens.model.js";
import { authConfig } from "../../config/auth.config.js";
import { legalConfig } from "../../config/legal.config.js";
import { sendPasswordResetEmail, sendVerificationEmail, sendWelcomeEmail } from "../../shared/mailer/mailer.service.js";
import { verifyGoogleIdToken } from "./google.client.js";
import { verifyRecaptcha } from "../../shared/recaptcha/recaptcha.service.js";
import { requireStrongPassword } from "../../shared/validators/password.js";
import { ValidationError } from "../../shared/exceptions/AppError.js";
import { logger } from "../../shared/logger/logger.js";
import { getSessionVersion } from "./session-version.js";
import {
  buildOtpAuthUri,
  decryptMfaSecret,
  encryptMfaSecret,
  generateRecoveryCodes,
  generateTotpSecret,
  hashRecoveryCode,
  verifyTotpCode,
} from "./mfa.utils.js";

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;
const RESET_TOKEN_TTL_MINUTES = 60;
const VERIFY_TOKEN_TTL_HOURS = 24;
const SELF_REGISTERABLE_ROLES = ["student", "client", "university_staff"];

function signToken(user, amr = ["pwd"]) {
  const jti = crypto.randomUUID();
  return jwt.sign({ sub: user._id, role: user.role, jti, amr, sessionVersion: getSessionVersion(user) }, authConfig.jwtSecret, {
    expiresIn: authConfig.jwtExpiresIn,
  });
}

function generateRawToken() {
  return crypto.randomBytes(32).toString("hex");
}
function hashToken(raw) {
  return crypto.createHash("sha256").update(raw).digest("hex");
}

export async function registerUser({
  email,
  password,
  name,
  role,
  termsAccepted,
  recaptchaToken,
  phone,
  organizationName,
  organizationType,
  university_id,
  student_id_number,
  program,
  enrollment_status,
}) {
  await verifyRecaptcha(recaptchaToken);

  if (!SELF_REGISTERABLE_ROLES.includes(role)) {
    // admin accounts are never self-registered — see auth.service.js top-of-file note.
    throw new ValidationError(`role must be one of: ${SELF_REGISTERABLE_ROLES.join(", ")}`);
  }

  if (termsAccepted !== true) {
    throw new ValidationError("You must accept the Terms of Service and Privacy Policy to register");
  }

  requireStrongPassword(password);

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    const err = new Error("Email already registered");
    err.status = 409;
    throw err;
  }

  let university = null;
  if (role === "student") {
    // University and the rest of the student profile are optional at signup —
    // students can complete them later from their profile settings.
    if (university_id) {
      university = await University.findById(university_id);
      if (!university) throw new ValidationError("Selected university was not found");
    }
  } else if (role === "university_staff") {
    const domain = email.toLowerCase().split("@")[1];
    university = await University.findOne({ domain });
    if (!university) {
      throw new ValidationError(
        "Your email domain isn't registered to a university on NexusWork yet. Ask a platform admin to add your university first."
      );
    }
   
  }

  const password_hash = await bcrypt.hash(password, authConfig.bcryptSaltRounds);
  const user = await User.create({
    email,
    password_hash,
    name,
    phone: (phone || "").trim(),
    role,
    auth_provider: "local",
    terms_accepted_at: new Date(),
    terms_version: legalConfig.currentTermsVersion,
  });

  if (role === "student") {
    await Wallet.create({ user_id: user._id });
    await StudentProfile.create({
      user_id: user._id,
      ...(university_id ? { university_id } : {}),
      student_id_number: (student_id_number || "").trim(),
      program: (program || "").trim(),
      enrollment_status: enrollment_status || "unknown",
      verification_status: "pending",
    });
  } else if (role === "client") {
    await Wallet.create({ user_id: user._id });
    await ClientProfile.create({
      user_id: user._id,
      organization_type: organizationType || "individual",
      ...(organizationName ? { organization_name: organizationName } : {}),
    });
  }
  
  try {
    await issueVerificationEmail(user);
  } catch (err) {
    // Keep the account usable when the mail provider is temporarily down;
    // the authenticated user can resend from the verification banner.
    logger.error("[auth] verification email delivery failed:", err.message);
  }

  return { token: signToken(user), user };
}

export async function loginUser({ email, password }) {
  const user = await User.findOne({ email: email.toLowerCase() }).select(
    "+password_hash +mfa_secret_encrypted +mfa_pending_secret_encrypted +mfa_recovery_code_hashes"
  );
  if (!user) {
    const err = new Error("Invalid credentials");
    err.status = 401;
    throw err;
  }

  if (user.auth_provider === "google" && !user.password_hash) {
    throw new ValidationError("This account uses Google Sign-In. Continue with Google instead of a password.");
  }

  if (user.locked_until && user.locked_until > new Date()) {
    const minutesLeft = Math.ceil((user.locked_until - new Date()) / 60000);
    const err = new Error(`Account temporarily locked due to repeated failed logins. Try again in ${minutesLeft} minute(s).`);
    err.status = 423;
    throw err;
  }

  const match = await bcrypt.compare(password, user.password_hash);
  if (!match) {
    user.failed_login_attempts += 1;
    if (user.failed_login_attempts >= MAX_FAILED_ATTEMPTS) {
      user.locked_until = new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000);
      user.failed_login_attempts = 0;
    }
    await user.save();
    const err = new Error("Invalid credentials");
    err.status = 401;
    throw err;
  }

  if (user.failed_login_attempts > 0 || user.locked_until) {
    user.failed_login_attempts = 0;
    user.locked_until = null;
    await user.save();
  }

  return beginMfaForUser(user);
}

function createMfaSetupChallenge(user) {
  const secret = generateTotpSecret();
  user.mfa_pending_secret_encrypted = encryptMfaSecret(secret);
  return user.save().then(() => ({
    mfaSetupRequired: true,
    setupToken: jwt.sign(
      { sub: user._id, purpose: "mfa_setup" },
      authConfig.jwtSecret,
      { expiresIn: "15m" }
    ),
    secret,
    otpauthUri: buildOtpAuthUri(secret, user.email),
  }));
}

function beginMfaForUser(user) {
  if (user.mfa_enabled && user.mfa_secret_encrypted) {
    const challengeToken = jwt.sign(
      { sub: user._id, purpose: "mfa_challenge" },
      authConfig.jwtSecret,
      { expiresIn: "5m" }
    );
    return { mfaRequired: true, challengeToken };
  }

  // MFA is an optional account security setting. New registrations and
  // existing users who have not opted in should receive a normal session;
  // setup is initiated explicitly from the authenticated Settings page.
  return { token: signToken(user), user };
}

// Lets an already-authenticated user opt into MFA proactively from Settings,
// rather than only being offered setup during login.
export async function initiateMfaSetup(userId) {
  const user = await User.findById(userId).select("+mfa_secret_encrypted +mfa_pending_secret_encrypted");
  if (!user) throw new ValidationError("User not found");
  if (user.mfa_enabled && user.mfa_secret_encrypted) {
    throw new ValidationError("Two-factor authentication is already enabled on this account.");
  }
  return createMfaSetupChallenge(user);
}

export async function setupMfa(setupToken, code) {
  const payload = jwt.verify(setupToken, authConfig.jwtSecret);
  if (payload.purpose !== "mfa_setup") throw new ValidationError("Invalid MFA setup session");

  const user = await User.findById(payload.sub).select("+mfa_pending_secret_encrypted +mfa_recovery_code_hashes");
  if (!user || !user.mfa_pending_secret_encrypted) throw new ValidationError("MFA setup has expired. Please log in again.");

  const secret = decryptMfaSecret(user.mfa_pending_secret_encrypted);
  if (!verifyTotpCode(secret, code)) throw new ValidationError("Invalid authenticator code");

  const recoveryCodes = generateRecoveryCodes();
  user.mfa_secret_encrypted = user.mfa_pending_secret_encrypted;
  user.mfa_pending_secret_encrypted = null;
  user.mfa_recovery_code_hashes = recoveryCodes.map(hashRecoveryCode);
  user.mfa_enabled = true;
  await user.save();

  return { token: signToken(user, ["pwd", "mfa"]), user, recoveryCodes };
}

export async function verifyMfa(challengeToken, code) {
  const payload = jwt.verify(challengeToken, authConfig.jwtSecret);
  if (payload.purpose !== "mfa_challenge") throw new ValidationError("Invalid MFA challenge");

  const user = await User.findById(payload.sub).select("+mfa_secret_encrypted +mfa_recovery_code_hashes");
  if (!user || !user.mfa_enabled || !user.mfa_secret_encrypted) throw new ValidationError("MFA is not configured for this account");

  const normalized = String(code || "").trim();
  const secret = decryptMfaSecret(user.mfa_secret_encrypted);
  let valid = verifyTotpCode(secret, normalized);

  if (!valid) {
    const hash = hashRecoveryCode(normalized);
    const index = user.mfa_recovery_code_hashes.findIndex((value) => value === hash);
    if (index !== -1) {
      user.mfa_recovery_code_hashes.splice(index, 1);
      await user.save();
      valid = true;
    }
  }

  if (!valid) throw new ValidationError("Invalid MFA code");
  return { token: signToken(user, ["pwd", "mfa"]), user };
}


export async function loginOrRegisterWithGoogle(
  idToken,
  {
    role,
    termsAccepted,
    phone,
    organizationName,
    organizationType,
    university_id,
    student_id_number,
    program,
    enrollment_status,
    recaptchaToken,
  } = {}
) {
  await verifyRecaptcha(recaptchaToken);
  const { googleId, email, emailVerified, name } = await verifyGoogleIdToken(idToken);

  let user = await User.findOne({ google_id: googleId }).select("+mfa_secret_encrypted +mfa_pending_secret_encrypted +mfa_recovery_code_hashes");
  if (user) {
    if (user.mfa_enabled) {
      return { ...(await beginMfaForUser(user)), user, isNewUser: false };
    }
    return { ...(await beginMfaForUser(user)), user, isNewUser: false };
  }

  user = await User.findOne({ email: email.toLowerCase() }).select("+mfa_secret_encrypted +mfa_pending_secret_encrypted +mfa_recovery_code_hashes");
  if (user) {
    user.google_id = googleId;
    if (emailVerified) user.email_verified = true;
    await user.save();
    return { ...(await beginMfaForUser(user)), user, isNewUser: false };
  }

  if (!role || !SELF_REGISTERABLE_ROLES.includes(role)) {
    const err = new Error(`New Google sign-ins need a role (${SELF_REGISTERABLE_ROLES.join(", ")}) to create an account`);
    err.status = 422;
    err.needsRole = true;
    throw err;
  }

  if (termsAccepted !== true) {
    throw new ValidationError("You must accept the Terms of Service and Privacy Policy to create an account");
  }

  let university = null;
  if (role === "university_staff") {
    const domain = email.toLowerCase().split("@")[1];
    university = await University.findOne({ domain });
  }

  user = await User.create({
    email: email.toLowerCase(),
    name,
    ...(phone ? { phone: phone.trim() } : {}),
    role,
    auth_provider: "google",
    google_id: googleId,
    email_verified: Boolean(emailVerified),
    terms_accepted_at: new Date(),
    terms_version: legalConfig.currentTermsVersion,
  });

  if (role === "client") {
    await Wallet.create({ user_id: user._id });
    await ClientProfile.create({
      user_id: user._id,
      organization_type: organizationType || "individual",
      ...(organizationName ? { organization_name: organizationName } : {}),
    });
  } else {
    await Wallet.create({ user_id: user._id });
    if (role === "student") {
      // University, student ID, program, and enrollment status are optional at
      // sign-up — students can fill these in later from their profile settings.
      let studentUniversity = null;
      if (university_id) {
        studentUniversity = await University.findById(university_id);
        if (!studentUniversity) throw new ValidationError("Selected university was not found");
      }
      await StudentProfile.create({
        user_id: user._id,
        ...(university_id ? { university_id } : {}),
        student_id_number: (student_id_number || "").trim(),
        program: (program || "").trim(),
        enrollment_status: enrollment_status || "unknown",
        verification_status: "pending",
      });
    }
  }

  return { ...(await beginMfaForUser(user)), user, isNewUser: true };
}

export async function logoutUser(decodedToken) {
  if (!decodedToken?.jti || !decodedToken?.exp) return;
  await RevokedToken.create({
    jti: decodedToken.jti,
    expires_at: new Date(decodedToken.exp * 1000),
  });
}

export async function isTokenRevoked(jti) {
  if (!jti) return false;
  const revoked = await RevokedToken.findOne({ jti });
  return Boolean(revoked);
}

export async function changePassword(userId, currentPassword, newPassword) {
  const user = await User.findById(userId).select("+password_hash");
  if (user.auth_provider === "google" && !user.password_hash) {
    throw new ValidationError("This account uses Google Sign-In and has no password to change.");
  }
  const match = await bcrypt.compare(currentPassword, user.password_hash);
  if (!match) {
    throw new ValidationError("Current password is incorrect");
  }
  requireStrongPassword(newPassword);
  user.password_hash = await bcrypt.hash(newPassword, authConfig.bcryptSaltRounds);
  await user.save();
}

export async function requestPasswordReset(email) {
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user || (user.auth_provider === "google" && !user.password_hash)) return;

  const rawToken = generateRawToken();
  await PasswordResetToken.create({
    user_id: user._id,
    token_hash: hashToken(rawToken),
    expires_at: new Date(Date.now() + RESET_TOKEN_TTL_MINUTES * 60 * 1000),
  });
  await sendPasswordResetEmail(user.email, rawToken);
}

export async function resetPassword(rawToken, newPassword) {
  const record = await PasswordResetToken.findOne({
    token_hash: hashToken(rawToken),
    used: false,
    expires_at: { $gt: new Date() },
  });
  if (!record) {
    throw new ValidationError("This reset link is invalid or has expired");
  }
  const user = await User.findById(record.user_id);
  if (!user) throw new ValidationError("This reset link is invalid or has expired");

  requireStrongPassword(newPassword);
  user.password_hash = await bcrypt.hash(newPassword, authConfig.bcryptSaltRounds);
  user.auth_session_version = getSessionVersion(user) + 1;
  user.failed_login_attempts = 0;
  user.locked_until = null;
  await user.save();

  record.used = true;
  await record.save();
}

async function issueVerificationEmail(user) {
  const rawToken = generateRawToken();
  await EmailVerificationToken.create({
    user_id: user._id,
    token_hash: hashToken(rawToken),
    expires_at: new Date(Date.now() + VERIFY_TOKEN_TTL_HOURS * 60 * 60 * 1000),
  });
  await sendVerificationEmail(user.email, rawToken);
}

export async function resendVerificationEmail(userId) {
  const user = await User.findById(userId);
  if (!user) throw new ValidationError("User not found");
  if (user.email_verified) throw new ValidationError("Email is already verified");
  await EmailVerificationToken.deleteMany({ user_id: user._id });
  await issueVerificationEmail(user);
}

export async function verifyEmail(rawToken) {
  const record = await EmailVerificationToken.findOne({
    token_hash: hashToken(rawToken),
    expires_at: { $gt: new Date() },
  });
  if (!record) {
    throw new ValidationError("This verification link is invalid or has expired");
  }
  const user = await User.findByIdAndUpdate(record.user_id, { email_verified: true }, { new: true });
  if (!user) throw new ValidationError("This verification link is invalid or has expired");
  await EmailVerificationToken.deleteOne({ _id: record._id });

  try {
    await sendWelcomeEmail(user.email, user.name);
  } catch (err) {
    logger.error("[auth] welcome email delivery failed:", err.message);
  }
}
