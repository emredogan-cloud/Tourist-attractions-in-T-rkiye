import { getConfig } from "~/lib/config";
import { LocalStorageProvider } from "./local-provider";
import { R2StorageProvider } from "./r2-provider";
import type { StorageProvider } from "./types";

export type { StorageProvider, StoredFile } from "./types";

let cached: StorageProvider | undefined;

export function getStorageProvider(): StorageProvider {
  if (cached) return cached;
  const config = getConfig();
  cached = config.STORAGE_PROVIDER === "r2" ? new R2StorageProvider() : new LocalStorageProvider();
  return cached;
}
