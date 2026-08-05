import { Router } from "express";
import { getMyContracts, getOne, sign } from "./contracts.controller.js";
import { requireAuth } from "../../middleware/auth.middleware.js";

const router = Router();

router.get("/", requireAuth, getMyContracts);
router.get("/:id", requireAuth, getOne);
router.post("/:id/sign", requireAuth, sign);

export default router;
