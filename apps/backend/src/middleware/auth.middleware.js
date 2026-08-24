import jwt from "jsonwebtoken";
import { authConfig } from "../config/auth.config.js";
import User from "../modules/users/users.model.js";
import { isTokenRevoked } from "../modules/auth/auth.service.js";

export async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) {
      return res.status(401).json({ success: false, message: "Missing or invalid Authorization header" });
    }
    const payload = jwt.verify(token, authConfig.jwtSecret);
    if (!payload.jti) {
      return res.status(401).json({ success: false, message: "Invalid token" });
    }
    if (await isTokenRevoked(payload.jti)) {
      return res.status(401).json({ success: false, message: "Session has been revoked" });
    }
    const user = await User.findById(payload.sub);
    if (!user || user.status !== "active") {
      return res.status(401).json({ success: false, message: "User not found or inactive" });
    }
    req.user = user;
    req.tokenPayload = payload;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
}