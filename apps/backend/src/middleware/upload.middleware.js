import multer from "multer";
import { storageConfig } from "../config/storage.config.js";

// Local-disk storage for development; swap the storage engine for S3 in production
// without changing controllers, since they just read req.file / req.files.
const storage = multer.diskStorage({
  destination: storageConfig.uploadDir,
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});

export const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });
