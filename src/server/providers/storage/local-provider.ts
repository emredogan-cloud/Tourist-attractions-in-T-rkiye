import { mkdir, unlink, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import type { StorageProvider, StoredFile } from "./types";

const ROOT = join(process.cwd(), "storage", "local");
const PUBLIC_PREFIX = "/storage";

export class LocalStorageProvider implements StorageProvider {
  async upload({
    key,
    body,
    contentType,
  }: { key: string; body: Buffer | Uint8Array; contentType: string }): Promise<StoredFile> {
    const filepath = join(ROOT, key);
    await mkdir(dirname(filepath), { recursive: true });
    await writeFile(filepath, body);
    return {
      key,
      url: `${PUBLIC_PREFIX}/${key}`,
      size: body.byteLength,
      contentType,
    };
  }

  async delete(key: string): Promise<void> {
    try {
      await unlink(join(ROOT, key));
    } catch {
      /* ignore — best-effort */
    }
  }

  publicUrl(key: string): string {
    return `${PUBLIC_PREFIX}/${key}`;
  }
}
