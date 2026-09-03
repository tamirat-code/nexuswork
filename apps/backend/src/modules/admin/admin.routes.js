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
  getReports,
  reviewUserReport,
} from "./admin.controller.js";
import { validateBody, validateParams } from "../../shared/validators/ZodValidator.js";
import { adminActionSchema, updateUserRoleSchema, resolveAdminDisputeSchema, reviewUserReportSchema } from "../../shared/validators/schemas.js";
import { objectIdParamsSchema } from "../../shared/validators/schemas.js";

const router = Router();

// All routes require authentication
router.use(requireAuth);

// Dashboard
router.get("/dashboard", getDashboard);

// Users management
router.get("/users", getUsers);
router.get("/users/:userId", validateParams(objectIdParamsSchema("userId")), getUser);
router.patch("/users/:userId/suspend", validateParams(objectIdParamsSchema("userId")), validateBody(adminActionSchema), suspend);
router.patch("/users/:userId/restore", validateParams(objectIdParamsSchema("userId")), validateBody(adminActionSchema), restore);
router.delete("/users/:userId", validateParams(objectIdParamsSchema("userId")), validateBody(adminActionSchema), remove);
router.patch("/users/:userId/role", validateParams(objectIdParamsSchema("userId")), validateBody(updateUserRoleSchema), updateRole);

// Disputes management
router.get("/disputes", getDisputes);
router.patch("/disputes/:disputeId/resolve", validateParams(objectIdParamsSchema("disputeId")), validateBody(resolveAdminDisputeSchema), resolveDisputeHandler);
router.get("/reports", getReports);
router.patch("/reports/:reportId/review", validateParams(objectIdParamsSchema("reportId")), validateBody(reviewUserReportSchema), reviewUserReport);

export default router;
