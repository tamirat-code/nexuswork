import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { storageConfig } from "../../config/storage.config.js";

const region = storageConfig.region;
const endpoint = storageConfig.endpoint;
const bucket = storageConfig.bucket;
const forcePathStyle = storageConfig.forcePathStyle;

const client = new S3Client({
  region,
  endpoint,
  forcePathStyle,
  credentials:
    storageConfig.accessKey && storageConfig.secretKey
      ? {
          accessKeyId: storageConfig.accessKey,
          secretAccessKey: storageConfig.secretKey,
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

export async function getPrivateObjectUrl(key, expiresIn = 300) {
  assertConfigured();
  return getSignedUrl(client, new GetObjectCommand({ Bucket: bucket, Key: key }), { expiresIn });
}

export async function deletePrivateObject(key) {
  assertConfigured();
  await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
}
