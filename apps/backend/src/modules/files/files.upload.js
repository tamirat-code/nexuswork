import fs from "fs";
import path from "path";
import crypto from "crypto";
import multer from "multer";
import { storageConfig } from "../../config/storage.config.js";
import { ValidationError } from "../../shared/exceptions/AppError.js";


const BLOCKED_EXTENSIONS = new Set([
  ".exe", ".bat", ".cmd", ".sh", ".ps1", ".msi", ".dll", ".com", ".vbs", ".js", ".jar",
]);

const diskStorage = multer.diskStorage({
  destination(req, file, cb) {
    fs.mkdirSync(storageConfig.absoluteUploadDir, { recursive: true });
    cb(null, storageConfig.absoluteUploadDir);
  },
  filename(req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, `${crypto.randomUUID()}${ext}`);
  },
});

function fileFilter(req, file, cb) {
  const ext = path.extname(file.originalname).toLowerCase();
  if (BLOCKED_EXTENSIONS.has(ext)) {
    return cb(new ValidationError(`File type "${ext}" is not allowed`));
  }
  cb(null, true);
}

const storage = storageConfig.driver === "s3" ? multer.memoryStorage() : diskStorage;

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: storageConfig.maxFileSizeMB * 1024 * 1024 },
});