export interface StorageConfig {
  bucket: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  endpoint?: string;
  publicUrl?: string;
  forcePathStyle?: boolean;
}

export interface PresignedUploadOptions {
  key: string;
  contentType: string;
  expiresIn?: number; // seconds, default: 300 (5 minutes)
  metadata?: Record<string, string>;
}

export interface PresignedUploadResult {
  uploadUrl: string;
  publicUrl: string;
  key: string;
  expiresIn: number;
}

export interface PresignedDownloadOptions {
  key: string;
  expiresIn?: number; // seconds, default: 900 (15 minutes)
}

export interface FileMetadata {
  key: string;
  size?: number;
  contentType?: string;
  lastModified?: Date;
  etag?: string;
}

export interface DirectUploadOptions {
  key: string;
  body: Buffer | Uint8Array | Blob | string | ReadableStream;
  contentType: string;
  metadata?: Record<string, string>;
}
