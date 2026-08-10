import path from "path";

export const storageConfig = {
  driver: process.env.STORAGE_DRIVER || "local", 
  uploadDir: process.env.UPLOAD_DIR || "uploads",
  absoluteUploadDir: path.resolve(process.cwd(), process.env.UPLOAD_DIR || "uploads"),
  maxFileSizeMB: Number(process.env.MAX_FILE_SIZE_MB || 20),
};