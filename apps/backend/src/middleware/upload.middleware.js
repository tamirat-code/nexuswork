import multer from "multer";
import path from "path";
import crypto from "node:crypto";
import { storageConfig } from "../config/storage.config.js";


const storage = multer.diskStorage({
  destination: storageConfig.uploadDir,
  filename: (req, file, cb) => {
  
    const ext = path.extname(file.originalname) || "";
    const safeName = `${crypto.randomUUID()}${ext}`;
    cb(null, safeName);
  },
});

export const upload = multer({
  storage,
  limits: { fileSize: Number(storageConfig.maxFileSizeMB || 10) * 1024 * 1024 },
});
