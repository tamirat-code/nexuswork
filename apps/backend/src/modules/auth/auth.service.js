import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../users/users.model.js";
import { authConfig } from "../../config/auth.config.js";
import Wallet from "../wallets/wallets.model.js";
import StudentProfile from "../students/students.model.js";

function signToken(user) {
  return jwt.sign({ sub: user._id, role: user.role }, authConfig.jwtSecret, {
    expiresIn: authConfig.jwtExpiresIn,
  });
}

export async function registerUser({ email, password, name, role }) {
  if (!["student", "client"].includes(role)) {
    // university_staff and admin accounts are provisioned separately, not self-registered
    const err = new Error("role must be 'student' or 'client'");
    err.status = 400;
    throw err;
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
  return { token: signToken(user), user };
}

export async function loginUser({ email, password }) {
  const user = await User.findOne({ email: email.toLowerCase() }).select("+password_hash");
  if (!user) {
    const err = new Error("Invalid credentials");
    err.status = 401;
    throw err;
  }
  const match = await bcrypt.compare(password, user.password_hash);
  if (!match) {
    const err = new Error("Invalid credentials");
    err.status = 401;
    throw err;
  }
  return { token: signToken(user), user };
}
