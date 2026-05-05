export type StoredFile = {
  key: string;
  url: string;
  size: number;
  contentType: string;
};

export interface StorageProvider {
  upload(args: {
    key: string;
    body: Buffer | Uint8Array;
    contentType: string;
  }): Promise<StoredFile>;

  delete(key: string): Promise<void>;

  publicUrl(key: string): string;
}
