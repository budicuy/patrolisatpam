import { NextRequest, NextResponse } from "next/server";
import { getPresignedDownloadUrl } from "@/lib/s3";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ key: string[] }> },
) {
  try {
    const { key } = await params;
    if (!key || key.length === 0) {
      return NextResponse.json({ error: "Missing image key" }, { status: 400 });
    }

    const fullKey = key.join("/");
    const presignedUrl = await getPresignedDownloadUrl(fullKey, 3600);

    return NextResponse.redirect(presignedUrl, {
      status: 307,
      headers: {
        "Cache-Control": "public, max-age=1800, s-maxage=3600",
      },
    });
  } catch (error) {
    console.error("Failed to resolve S3 image:", error);
    return NextResponse.json({ error: "Image not found" }, { status: 404 });
  }
}
