import fs from "fs";
import path from "path";
import crypto from "crypto";
import multer from "multer";
import { storageConfig } from "../../config/storage.config.js";
import { ValidationError } from "../../shared/exceptions/AppError.js";


const ALLOWED_TYPES = new Map([
  ["application/pdf", new Set([".pdf"])],
  ["image/jpeg", new Set([".jpg", ".jpeg"])],
  ["image/png", new Set([".png"])],
  ["image/webp", new Set([".webp"])],
  ["text/plain", new Set([".txt"])],
  ["application/zip", new Set([".zip"])],
]);

const diskStorage = multer.diskStorage({
  destination(req, file, cb) {
    fs.mkdirSync(storageConfig.absoluteUploadDir, { recursive: true });
    cb(null, storageConfig.absoluteUploadDir);
  },
  filename(req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${crypto.randomUUID()}${ext}`);
  },
});

function fileFilter(req, file, cb) {
  const ext = path.extname(file.originalname).toLowerCase();
  const allowedExtensions = ALLOWED_TYPES.get(file.mimetype);
  if (!allowedExtensions || !allowedExtensions.has(ext)) {
    return cb(new ValidationError("File MIME type and extension are not allowed"));
  }
  cb(null, true);
}

const storage = storageConfig.driver === "s3" ? multer.memoryStorage() : diskStorage;

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: storageConfig.maxFileSizeMB * 1024 * 1024 },
});
