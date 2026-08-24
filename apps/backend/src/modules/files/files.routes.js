import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { upload } from "./files.upload.js";
import { uploadFile, getForContract, getOne, content, remove } from "./files.controller.js";

const router = Router();

router.post("/upload", requireAuth, upload.single("file"), uploadFile);
router.get("/contract/:contractId", requireAuth, getForContract);
router.get("/content/:id", requireAuth, content);
router.get("/:id", requireAuth, getOne);
router.delete("/:id", requireAuth, remove);

export default router;