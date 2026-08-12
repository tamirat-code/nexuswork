import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { getNotifications, readNotification, readAll } from "./notifications.controller.js";

const router = Router();

router.get("/", requireAuth, getNotifications);
router.patch("/read-all", requireAuth, readAll);
router.patch("/:id/read", requireAuth, readNotification);

export default router;