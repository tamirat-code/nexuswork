export const storageConfig = {
  driver: process.env.STORAGE_DRIVER || "local", // "local" | "s3"
  uploadDir: process.env.UPLOAD_DIR || "uploads",
};
