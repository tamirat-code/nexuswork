import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
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
  });
  await client.send(cmd);
  if (endpoint) {
    const getCmd = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    });
    return getSignedUrl(client, getCmd, { expiresIn: 86400 });
  }


  const getCmd = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
  });
  return getSignedUrl(client, getCmd, { expiresIn: 86400 });
}