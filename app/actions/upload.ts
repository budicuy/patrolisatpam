"use server";

import { put } from "@vercel/blob";
import { auth } from "@/lib/auth";

// Allowed image MIME types (no SVG, GIF)
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/jpg", "image/png"];

// Allowed file extensions (case insensitive)
const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png"];

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

  // Validate MIME type
  const mimeType = file.type.toLowerCase();
  if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
    throw new Error(
      "Invalid file type. Only JPG, JPEG, and PNG images are allowed.",
    );
  }

  // Validate file extension
  const fileName = file.name.toLowerCase();
  const hasValidExtension = ALLOWED_EXTENSIONS.some((ext) =>
    fileName.endsWith(ext),
  );
  if (!hasValidExtension) {
    throw new Error(
      "Invalid file extension. Only .jpg, .jpeg, and .png are allowed.",
    );
  }

  const blob = await put(file.name, file, {
    access: "public",
    addRandomSuffix: true,
  });

  return blob.url;
}
