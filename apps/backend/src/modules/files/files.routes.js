import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { upload } from "./files.upload.js";
import { uploadFile, getOne, remove } from "./files.controller.js";

const router = Router();

router.post("/upload", requireAuth, upload.single("file"), uploadFile);
router.get("/:id", requireAuth, getOne);
router.delete("/:id", requireAuth, remove);

export default router;