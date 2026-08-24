import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

const region = process.env.S3_REGION || process.env.AWS_REGION || "us-east-1";
const endpoint = process.env.S3_ENDPOINT || undefined;
const bucket = process.env.S3_BUCKET;
const forcePathStyle = process.env.S3_FORCE_PATH_STYLE === "true";

const client = new S3Client({
  region,
  endpoint,
  forcePathStyle,
  credentials:
    process.env.S3_ACCESS_KEY && process.env.S3_SECRET_KEY
      ? {
          accessKeyId: process.env.S3_ACCESS_KEY,
          secretAccessKey: process.env.S3_SECRET_KEY,
        }
      : undefined,
});

function assertConfigured() {
  if (!bucket) throw new Error("S3_BUCKET is required when STORAGE_DRIVER=s3");
}

export async function putPrivateObject({ key, body, contentType }) {
  assertConfigured();
  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
      // Deliberately no public ACL. Objects remain private and are served only
      // after NexusWork authorization checks.
    })
  );
}

export async function getPrivateObject(key) {
  assertConfigured();
  return client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
}

export async function deletePrivateObject(key) {
  assertConfigured();
  await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
}