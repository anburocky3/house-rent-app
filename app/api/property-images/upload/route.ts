import { NextResponse } from "next/server";

const sanitizePathSegment = (value: string) =>
  value.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120);

export async function POST(request: Request) {
  try {
    const blobModule = await import("@vercel/blob");
    const { put } = blobModule;

    const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
    if (!blobToken) {
      return NextResponse.json(
        { error: "Missing BLOB_READ_WRITE_TOKEN" },
        { status: 500 },
      );
    }

    const formData = await request.formData();
    const propertyId = String(formData.get("propertyId") || "").trim();
    const file = formData.get("file");

    if (!propertyId) {
      return NextResponse.json(
        { error: "Missing property ID" },
        { status: 400 },
      );
    }

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Missing upload file" },
        { status: 400 },
      );
    }

    if (file.size <= 0) {
      return NextResponse.json(
        { error: "Uploaded file is empty" },
        { status: 400 },
      );
    }

    const safePropertyId = sanitizePathSegment(propertyId);
    const safeFileName = sanitizePathSegment(
      file.name || "before_handover_image",
    );
    const pathname = `properties/${safePropertyId}/before-handover/${safeFileName}`;

    const blob = await put(pathname, file, {
      access: "public",
      contentType: file.type || undefined,
      addRandomSuffix: false,
      token: blobToken,
    });

    return NextResponse.json({
      name: file.name,
      url: blob.url,
      storage_path: blob.pathname,
      content_type: file.type,
      size_bytes: file.size,
      access_mode: "public",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to upload property image", details: message },
      { status: 500 },
    );
  }
}
