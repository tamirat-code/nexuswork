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

const SIGNATURES = new Map([
  ["application/pdf", (bytes) => bytes.subarray(0, 5).toString("ascii") === "%PDF-"],
  ["image/jpeg", (bytes) => bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff],
  ["image/png", (bytes) => bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))],
  ["image/webp", (bytes) => bytes.subarray(0, 4).toString("ascii") === "RIFF" && bytes.subarray(8, 12).toString("ascii") === "WEBP"],
  ["application/zip", (bytes) => bytes[0] === 0x50 && bytes[1] === 0x4b],
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

function isValidText(buffer) {
  if (buffer.includes(0)) return false;
  const decoded = buffer.toString("utf8");
  return Buffer.from(decoded, "utf8").equals(buffer);
}

export async function validateUploadedFile(file) {
  const buffer = file.buffer || await fs.promises.readFile(file.path);
  const signatureCheck = SIGNATURES.get(file.mimetype);
  const valid = signatureCheck ? signatureCheck(buffer) : isValidText(buffer);
  if (!valid) {
    if (file.path) await fs.promises.unlink(file.path).catch(() => {});
    throw new ValidationError("File content does not match its declared type");
  }

  return {
    sha256: crypto.createHash("sha256").update(buffer).digest("hex"),
    buffer,
  };
}
