import { randomUUID } from "node:crypto";
import { type NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import { problem } from "~/lib/api-response";
import { ValidationError } from "~/lib/errors";
import { clientIp, enforce } from "~/lib/rate-limit";
import { requireUser } from "~/server/providers/auth";
import { getStorageProvider } from "~/server/providers/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser();
    await enforce({ key: `uploads:${user.id}`, limit: 30, windowSec: 24 * 3600 });
    await enforce({ key: `uploads:ip:${clientIp(request)}`, limit: 60, windowSec: 3600 });

    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      throw new ValidationError("Missing file");
    }
    if (file.size > MAX_BYTES) {
      throw new ValidationError("File too large (max 10 MB)");
    }
    if (!ALLOWED_TYPES.has(file.type)) {
      throw new ValidationError(`Unsupported type ${file.type}`);
    }
    const incoming = Buffer.from(await file.arrayBuffer());

    // Strip EXIF, resize to a sane max, transcode to WebP for storage efficiency.
    const processed = await sharp(incoming)
      .rotate() // honor EXIF orientation before stripping
      .resize({ width: 2000, height: 2000, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();

    const id = randomUUID();
    const key = `uploads/${user.id}/${id}.webp`;
    const storage = getStorageProvider();
    const stored = await storage.upload({
      key,
      body: processed,
      contentType: "image/webp",
    });
    return NextResponse.json(
      { mediaId: id, url: stored.url, size: stored.size, contentType: stored.contentType },
      { status: 201, headers: { "Cache-Control": "no-store" } },
    );
  } catch (err) {
    return problem(err, request.url);
  }
}
