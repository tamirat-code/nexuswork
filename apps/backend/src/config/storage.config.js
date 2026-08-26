import path from "path";
import { env } from "./env.js";

export const storageConfig = {
  driver: env.storageDriver,
  uploadDir: env.uploadDir,
  absoluteUploadDir: path.resolve(process.cwd(), env.uploadDir),
  maxFileSizeMB: env.maxFileSizeMB,
  region: env.s3Region,
  endpoint: env.s3Endpoint,
  bucket: env.s3Bucket,
  accessKey: env.s3AccessKey,
  secretKey: env.s3SecretKey,
  forcePathStyle: env.s3ForcePathStyle,
};
