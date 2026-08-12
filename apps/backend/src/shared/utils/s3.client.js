import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const region = process.env.S3_REGION || process.env.AWS_REGION || "us-east-1";
const endpoint = process.env.S3_ENDPOINT || null;
const forcePathStyle = process.env.S3_FORCE_PATH_STYLE === "true";

const client = new S3Client({
  region,
  endpoint: endpoint || undefined,
  forcePathStyle,
  credentials: process.env.S3_ACCESS_KEY && process.env.S3_SECRET_KEY ? {
    accessKeyId: process.env.S3_ACCESS_KEY,
    secretAccessKey: process.env.S3_SECRET_KEY,
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
