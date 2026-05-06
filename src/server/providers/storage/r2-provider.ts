import { UpstreamError } from "~/lib/errors";
import type { StorageProvider, StoredFile } from "./types";

// Cloudflare R2 (S3-compatible) provider stub. To activate, add the
// `@aws-sdk/client-s3` dependency and replace this stub's body with
// PutObjectCommand calls. Kept stubbed to avoid pulling a heavy dep
// into a build that uses local storage by default.
export class R2StorageProvider implements StorageProvider {
  async upload(): Promise<StoredFile> {
    throw new UpstreamError("r2", "R2 provider not configured in this build");
  }

  async delete(): Promise<void> {
    throw new UpstreamError("r2", "R2 provider not configured in this build");
  }

  publicUrl(key: string): string {
    const base = process.env.R2_PUBLIC_URL ?? "";
    return `${base}/${key}`;
  }
}
