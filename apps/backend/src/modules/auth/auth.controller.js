import { asyncHandler } from "../../shared/utils/asyncHandler.js";
import { requireFields } from "../../shared/validators/validate.js";
import { registerUser, loginUser } from "./auth.service.js";

function toPublicUser(user) {
  return { id: user._id, email: user.email, name: user.name, role: user.role };
}

export const register = asyncHandler(async (req, res) => {
  requireFields(req.body, ["email", "password", "name", "role"]);
  const { token, user } = await registerUser(req.body);
  res.status(201).json({ success: true, data: { token, user: toPublicUser(user) } });
});

export const login = asyncHandler(async (req, res) => {
  requireFields(req.body, ["email", "password"]);
  const { token, user } = await loginUser(req.body);
  res.json({ success: true, data: { token, user: toPublicUser(user) } });
});

export const me = asyncHandler(async (req, res) => {
  res.json({ success: true, data: toPublicUser(req.user) });
});
