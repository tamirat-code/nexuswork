import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";

import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { storageConfig } from "../../config/storage.config.js";

const client = new S3Client({
  region: storageConfig.region,
  endpoint: storageConfig.endpoint || undefined,
  forcePathStyle: storageConfig.forcePathStyle,
  credentials:
    storageConfig.accessKey && storageConfig.secretKey
      ? {
          accessKeyId: storageConfig.accessKey,
          secretAccessKey: storageConfig.secretKey,
        }
      : undefined,
});

export async function uploadToS3({
  bucket,
  key,
  body,
  contentType,
}) {
  if (!storageConfig.region) {
    throw new Error("S3 region is not configured");
  }

  if (!storageConfig.accessKey || !storageConfig.secretKey) {
    throw new Error("S3 credentials are not configured");
  }

  if (!bucket) {
    throw new Error("S3 bucket is required");
  }

  if (!key) {
    throw new Error("S3 object key is required");
  }

  const putCommand = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: body,
    ContentType: contentType,
  });

  await client.send(putCommand);

  const getCommand = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
  });

  return getSignedUrl(client, getCommand, {
    expiresIn: 86400,
  });
}