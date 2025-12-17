"use server";

import { put } from "@vercel/blob";

export async function uploadImage(formData: FormData) {
  const file = formData.get("file") as File;
  if (!file) {
    throw new Error("No file uploaded");
  }

  if (file.size > 100 * 1024) {
    throw new Error("File too large (max 100KB)");
  }

  const blob = await put(file.name, file, {
    access: "public",
  });

  return blob.url;
}
