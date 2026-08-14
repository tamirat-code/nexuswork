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

const router = Router();

// All routes require authentication
router.use(requireAuth);

// Dashboard
router.get("/dashboard", getDashboard);

// Users management
router.get("/users", getUsers);
router.get("/users/:userId", getUser);
router.patch("/users/:userId/suspend", suspend);
router.patch("/users/:userId/restore", restore);
router.delete("/users/:userId", remove);
router.patch("/users/:userId/role", updateRole);

// Disputes management
router.get("/disputes", getDisputes);
router.patch("/disputes/:disputeId/resolve", resolveDisputeHandler);

export default router;
