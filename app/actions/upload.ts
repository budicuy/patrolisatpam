"use server";

import { auth } from "@/lib/auth";
import { uploadToS3 } from "@/lib/s3";

// Allowed image MIME types (JPEG, PNG, WebP, and iPhone HEIC/HEIF)
const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
  "image/heic-sequence",
  "image/heif-sequence",
];

// Allowed file extensions (case insensitive)
const ALLOWED_EXTENSIONS = [
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".heic",
  ".heif",
];

export async function uploadImage(formData: FormData) {
  // Auth check
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized: Please login first");
  }

  const file = formData.get("file") as File;
  if (!file) {
    throw new Error("No file uploaded");
  }

  // Validate file size (max 100KB)
  if (file.size > 100 * 1024) {
    throw new Error("File too large (max 100KB)");
  }

  // Validate file extension
  const fileName = file.name.toLowerCase();
  const hasValidExtension = ALLOWED_EXTENSIONS.some((ext) =>
    fileName.endsWith(ext),
  );
  if (!hasValidExtension) {
    throw new Error(
      "Invalid file extension. Only .jpg, .jpeg, .png, .webp, .heic, and .heif are allowed.",
    );
  }

  // Detect and normalize MIME type (handling iOS Safari empty or generic octet-stream)
  let mimeType = file.type.toLowerCase();
  if (!mimeType || mimeType === "application/octet-stream") {
    if (fileName.endsWith(".heic") || fileName.endsWith(".heif")) {
      mimeType = "image/heic";
    } else if (fileName.endsWith(".jpg") || fileName.endsWith(".jpeg")) {
      mimeType = "image/jpeg";
    } else if (fileName.endsWith(".png")) {
      mimeType = "image/png";
    } else if (fileName.endsWith(".webp")) {
      mimeType = "image/webp";
    }
  }

  if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
    throw new Error(
      "Invalid file type. Only JPG, PNG, WEBP, and HEIC (iPhone) images are allowed.",
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const { url } = await uploadToS3({
    fileBuffer: buffer,
    fileName: file.name,
    mimeType,
    folder: "patrol",
  });

  return url;
}
