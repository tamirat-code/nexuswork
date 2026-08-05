import jwt from "jsonwebtoken";
import { authConfig } from "../config/auth.config.js";

// Authenticates a socket connection using the same JWT issued by /v1/auth/login.
export function socketAuth(socket, next) {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error("Unauthorized"));
    const payload = jwt.verify(token, authConfig.jwtSecret);
    socket.userId = payload.sub;
    next();
  } catch (err) {
    next(new Error("Unauthorized"));
  }
}
