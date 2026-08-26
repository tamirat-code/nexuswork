import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { storageConfig } from "../../config/storage.config.js";

const region = storageConfig.region;
const endpoint = storageConfig.endpoint;
const forcePathStyle = storageConfig.forcePathStyle;

const client = new S3Client({
  region,
  endpoint: endpoint || undefined,
  forcePathStyle,
  credentials: storageConfig.accessKey && storageConfig.secretKey ? {
    accessKeyId: storageConfig.accessKey,
    secretAccessKey: storageConfig.secretKey,
  } : undefined,
});

export async function uploadToS3({ bucket, key, body, contentType }) {
  const cmd = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: body,
    ContentType: contentType,
    ACL: "public-read",
  });
  await client.send(cmd);

  // Construct a sensible public URL.
  if (endpoint) {
    // If using a custom endpoint (e.g. MinIO), use path-style URL
    return `${endpoint.replace(/\/$/, "")}/${bucket}/${encodeURIComponent(key)}`;
  }
  // Default S3 URL
  return `https://${bucket}.s3.${region}.amazonaws.com/${encodeURIComponent(key)}`;
}
