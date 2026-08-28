import jwt from "jsonwebtoken";
import { authConfig } from "../config/auth.config.js";
import User from "../modules/users/users.model.js";
import { isTokenRevoked } from "../modules/auth/auth.service.js";
import { isCurrentSession } from "../modules/auth/session-version.js";

// Authenticates a socket connection using the same JWT issued by /v1/auth/login.
export async function socketAuth(socket, next) {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error("Unauthorized"));
    const payload = jwt.verify(token, authConfig.jwtSecret);
    if (!payload.jti || await isTokenRevoked(payload.jti)) return next(new Error("Unauthorized"));
    const user = await User.findById(payload.sub);
    if (!user || user.status !== "active" || !isCurrentSession(payload, user)) return next(new Error("Unauthorized"));
    socket.userId = payload.sub;
    socket.user = user;
    next();
  } catch (err) {
    next(new Error("Unauthorized"));
  }
}
