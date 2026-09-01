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
  ["image/gif", new Set([".gif"])],
  ["image/svg+xml", new Set([".svg"])],
  ["text/plain", new Set([".txt", ".md", ".markdown", ".js", ".jsx", ".mjs", ".cjs", ".ts", ".tsx", ".py", ".html", ".htm", ".css", ".csv", ".xml"])],
  ["text/markdown", new Set([".md", ".markdown"])],
  ["text/javascript", new Set([".js", ".jsx", ".mjs", ".cjs"])],
  ["application/javascript", new Set([".js", ".jsx", ".mjs", ".cjs"])],
  ["text/typescript", new Set([".ts", ".tsx"])],
  ["application/typescript", new Set([".ts", ".tsx"])],
  ["text/html", new Set([".html", ".htm"])],
  ["text/css", new Set([".css"])],
  ["application/json", new Set([".json"])],
  ["text/csv", new Set([".csv"])],
  ["application/xml", new Set([".xml"])],
  ["text/xml", new Set([".xml"])],
  ["text/x-python", new Set([".py"])],
  ["application/x-python-code", new Set([".py"])],
  ["application/msword", new Set([".doc"])],
  ["application/vnd.openxmlformats-officedocument.wordprocessingml.document", new Set([".docx"])],
  ["application/vnd.ms-excel", new Set([".xls", ".csv"])],
  ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", new Set([".xlsx"])],
  ["application/vnd.ms-powerpoint", new Set([".ppt"])],
  ["application/vnd.openxmlformats-officedocument.presentationml.presentation", new Set([".pptx"])],
  ["video/mp4", new Set([".mp4"])],
  ["video/webm", new Set([".webm"])],
  ["video/quicktime", new Set([".mov"])],
  ["audio/mpeg", new Set([".mp3"])],
  ["audio/wav", new Set([".wav"])],
  ["audio/x-wav", new Set([".wav"])],
  ["application/zip", new Set([".zip"])],
  ["application/x-zip-compressed", new Set([".zip"])],
]);

const isZip = (bytes) => bytes[0] === 0x50 && bytes[1] === 0x4b;
const isOleCompoundDocument = (bytes) => bytes.subarray(0, 8).equals(Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]));
const isMp4Container = (bytes) => bytes.subarray(4, 8).toString("ascii") === "ftyp";
const isWebmContainer = (bytes) => bytes.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3]));
const isMp3Audio = (bytes) => bytes.subarray(0, 3).toString("ascii") === "ID3" || (bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0);
const isWavAudio = (bytes) => bytes.subarray(0, 4).toString("ascii") === "RIFF" && bytes.subarray(8, 12).toString("ascii") === "WAVE";

const SIGNATURES = new Map([
  ["application/pdf", (bytes) => bytes.subarray(0, 5).toString("ascii") === "%PDF-"],
  ["image/jpeg", (bytes) => bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff],
  ["image/png", (bytes) => bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))],
  ["image/webp", (bytes) => bytes.subarray(0, 4).toString("ascii") === "RIFF" && bytes.subarray(8, 12).toString("ascii") === "WEBP"],
  ["image/gif", (bytes) => ["GIF87a", "GIF89a"].includes(bytes.subarray(0, 6).toString("ascii"))],
  ["application/msword", isOleCompoundDocument],
  ["application/vnd.ms-excel", (bytes) => isOleCompoundDocument(bytes) || isValidText(bytes)],
  ["application/vnd.ms-powerpoint", isOleCompoundDocument],
  ["application/vnd.openxmlformats-officedocument.wordprocessingml.document", isZip],
  ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", isZip],
  ["application/vnd.openxmlformats-officedocument.presentationml.presentation", isZip],
  ["video/mp4", isMp4Container],
  ["video/quicktime", isMp4Container],
  ["video/webm", isWebmContainer],
  ["audio/mpeg", isMp3Audio],
  ["audio/wav", isWavAudio],
  ["audio/x-wav", isWavAudio],
  ["application/zip", isZip],
  ["application/x-zip-compressed", isZip],
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
