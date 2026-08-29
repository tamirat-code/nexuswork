import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";

import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { storageConfig } from "../../config/storage.config.js";

const region = storageConfig.region;
const endpoint = storageConfig.endpoint;
const forcePathStyle = storageConfig.forcePathStyle;

if (!region) {
  throw new Error("S3 region is not configured");
}

if (!storageConfig.accessKey || !storageConfig.secretKey) {
  throw new Error("S3 credentials are not configured");
}

const client = new S3Client({
  region,
  endpoint: endpoint || undefined,
  forcePathStyle,
  credentials: {
    accessKeyId: storageConfig.accessKey,
    secretAccessKey: storageConfig.secretKey,
  },
});

export async function uploadToS3({
  bucket,
  key,
  body,
  contentType,
}) {
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