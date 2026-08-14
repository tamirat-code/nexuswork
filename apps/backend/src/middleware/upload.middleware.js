import multer from "multer";
import path from "path";
import crypto from "node:crypto";
import { storageConfig } from "../config/storage.config.js";


const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/plain",
  "text/csv",
  "text/markdown",
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
  "application/zip",
  "application/x-zip-compressed",
  "application/x-rar-compressed",
  "application/x-7z-compressed",
  "application/gzip",
  "application/x-tar",
]);

const storage = multer.diskStorage({
  destination: storageConfig.uploadDir,
  filename: (req, file, cb) => {
  
    const ext = path.extname(file.originalname) || "";
    const safeName = `${crypto.randomUUID()}${ext}`;
    cb(null, safeName);
  },
});

function fileFilter(req, file, cb) {
  if (ALLOWED_MIME_TYPES.has(file.mimetype)) {
    cb(null, true);
  } else {
    const err = new Error(`File type "${file.mimetype}" is not allowed`);
    err.status = 400;
    cb(err);
  }
}

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: Number(storageConfig.maxFileSizeMB || 10) * 1024 * 1024 },
});
