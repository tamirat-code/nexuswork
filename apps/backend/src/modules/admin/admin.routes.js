import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware.js";
import {
  getDashboard,
  getUsers,
  getUser,
  suspend,
  restore,
  remove,
  updateRole,
  getDisputes,
  resolveDisputeHandler,
} from "./admin.controller.js";
import { validateBody } from "../../shared/validators/ZodValidator.js";
import { adminActionSchema, updateUserRoleSchema, resolveAdminDisputeSchema } from "../../shared/validators/schemas.js";

const router = Router();

// All routes require authentication
router.use(requireAuth);

// Dashboard
router.get("/dashboard", getDashboard);

// Users management
router.get("/users", getUsers);
router.get("/users/:userId", getUser);
router.patch("/users/:userId/suspend", validateBody(adminActionSchema), suspend);
router.patch("/users/:userId/restore", validateBody(adminActionSchema), restore);
router.delete("/users/:userId", validateBody(adminActionSchema), remove);
router.patch("/users/:userId/role", validateBody(updateUserRoleSchema), updateRole);

// Disputes management
router.get("/disputes", getDisputes);
router.patch("/disputes/:disputeId/resolve", validateBody(resolveAdminDisputeSchema), resolveDisputeHandler);

export default router;
