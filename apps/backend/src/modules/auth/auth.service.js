import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "node:crypto";
import User from "../users/users.model.js";
import Wallet from "../wallets/wallets.model.js";
import StudentProfile from "../students/students.model.js";
import { RevokedToken, PasswordResetToken, EmailVerificationToken } from "./tokens.model.js";
import { authConfig } from "../../config/auth.config.js";
import { sendPasswordResetEmail, sendVerificationEmail, sendWelcomeEmail } from "../../shared/mailer/mailer.service.js";
import { ValidationError } from "../../shared/exceptions/AppError.js";

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;
const RESET_TOKEN_TTL_MINUTES = 15;
const VERIFY_TOKEN_TTL_HOURS = 24;

function signToken(user) {
  const jti = crypto.randomUUID();
  return jwt.sign({ sub: user._id, role: user.role, jti }, authConfig.jwtSecret, {
    expiresIn: authConfig.jwtExpiresIn,
  });
}

function generateRawToken() {
  return crypto.randomBytes(32).toString("hex");
}
function hashToken(raw) {
  return crypto.createHash("sha256").update(raw).digest("hex");
}

export async function registerUser({ email, password, name, role }) {
  if (!["student", "client"].includes(role)) {
    throw new ValidationError("role must be 'student' or 'client'");
  }
  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    const err = new Error("Email already registered");
    err.status = 409;
    throw err;
  }
  const password_hash = await bcrypt.hash(password, authConfig.bcryptSaltRounds);
  const user = await User.create({ email, password_hash, name, role });
  await Wallet.create({ user_id: user._id });
  if (role === "student") {
    await StudentProfile.create({ user_id: user._id });
  }

  await issueVerificationEmail(user);
sendWelcomeEmail(user.email, user.name).catch((err) =>
    console.error("[mail] welcome email failed:", err.message || err)
  );
  return { token: signToken(user), user };
}

export async function loginUser({ email, password }) {
  const user = await User.findOne({ email: email.toLowerCase() }).select("+password_hash");
  if (!user) {
    const err = new Error("Invalid credentials");
    err.status = 401;
    throw err;
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

  return { token: signToken(user), user };
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
  const match = await bcrypt.compare(currentPassword, user.password_hash);
  if (!match) {
    throw new ValidationError("Current password is incorrect");
  }
  user.password_hash = await bcrypt.hash(newPassword, authConfig.bcryptSaltRounds);
  await user.save();
}

export async function requestPasswordReset(email) {
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) return;

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

  user.password_hash = await bcrypt.hash(newPassword, authConfig.bcryptSaltRounds);
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
  await User.findByIdAndUpdate(record.user_id, { email_verified: true });
  await EmailVerificationToken.deleteOne({ _id: record._id });
}