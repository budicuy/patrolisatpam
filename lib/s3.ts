import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const endpoint = process.env.AWS_ENDPOINT_URL_S3;
const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
const region = process.env.AWS_REGION || "ap-southeast-1";

export const BUCKET_NAME = process.env.AWS_BUCKET_NAME || "uplods";

export const s3Client = new S3Client({
  endpoint,
  region,
  credentials: {
    accessKeyId: accessKeyId || "",
    secretAccessKey: secretAccessKey || "",
  },
  forcePathStyle: true,
});

/**
 * Uploads a file buffer to S3-compatible storage.
 */
export async function uploadToS3({
  fileBuffer,
  fileName,
  mimeType,
  folder = "patrol",
}: {
  fileBuffer: Buffer;
  fileName: string;
  mimeType: string;
  folder?: string;
}): Promise<{ key: string; url: string }> {
  // Generate safe unique filename
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  const cleanFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
  const key = `${folder}/${timestamp}-${randomSuffix}-${cleanFileName}`;

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: fileBuffer,
    ContentType: mimeType,
  });

  await s3Client.send(command);

  // Return API route URL which acts as a permanent proxy with dynamic presigning/streaming
  const url = `/api/images/${key}`;

  return { key, url };
}

/**
 * Generates a presigned GET URL for an S3 object (valid for expiresIn seconds).
 */
export async function getPresignedDownloadUrl(
  key: string,
  expiresIn = 3600,
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  return await getSignedUrl(s3Client, command, { expiresIn });
}

/**
 * Fetches an object stream and metadata from S3.
 */
export async function getS3Object(key: string) {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  return await s3Client.send(command);
}

/**
 * Deletes an object from S3.
 */
export async function deleteFromS3(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  await s3Client.send(command);
}
