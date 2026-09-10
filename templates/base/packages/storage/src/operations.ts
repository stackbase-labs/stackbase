import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  type PutObjectCommandInput,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'node:crypto';
import { createS3Client, resolveStorageConfig } from './client';
import type {
  DirectUploadOptions,
  FileMetadata,
  PresignedDownloadOptions,
  PresignedUploadOptions,
  PresignedUploadResult,
  StorageConfig,
} from './types';

export function sanitizeFilename(filename: string): string {
  return filename
    .toLowerCase()
    .replace(/[^a-z0-9.-]/g, '-')
    .replace(/-+/g, '-');
}

export function generateStorageKey(folder: string, filename: string): string {
  const cleanFolder = folder.replace(/^\/+|\/+$/g, '');
  const cleanName = sanitizeFilename(filename);
  const uniqueId = randomUUID().replace(/-/g, '').slice(0, 12);
  return cleanFolder ? `${cleanFolder}/${uniqueId}-${cleanName}` : `${uniqueId}-${cleanName}`;
}

export class StorageService {
  private customConfig?: Partial<StorageConfig>;
  private clientInstance?: S3Client;

  constructor(customConfig?: Partial<StorageConfig>, client?: S3Client) {
    this.customConfig = customConfig;
    if (client) {
      this.clientInstance = client;
    }
  }

  private getConfig(): StorageConfig {
    return resolveStorageConfig(this.customConfig);
  }

  private getClient(): S3Client {
    if (!this.clientInstance) {
      this.clientInstance = createS3Client(this.customConfig);
    }
    return this.clientInstance;
  }

  getPublicUrl(key: string): string {
    const config = this.getConfig();
    const cleanKey = key.replace(/^\/+/, '');

    if (config.publicUrl) {
      const base = config.publicUrl.replace(/\/+$/, '');
      return `${base}/${cleanKey}`;
    }

    if (config.endpoint) {
      const endpoint = config.endpoint.replace(/\/+$/, '');
      return `${endpoint}/${config.bucket}/${cleanKey}`;
    }

    return `https://${config.bucket}.s3.${config.region}.amazonaws.com/${cleanKey}`;
  }

  async getUploadPresignedUrl(options: PresignedUploadOptions): Promise<PresignedUploadResult> {
    const config = this.getConfig();

    if (!config.bucket) {
      throw new Error(
        'S3_BUCKET is not configured. Please set S3_BUCKET in your environment variables.',
      );
    }

    const expiresIn = options.expiresIn ?? 300; // 5 minutes default
    const cleanKey = options.key.replace(/^\/+/, '');

    const command = new PutObjectCommand({
      Bucket: config.bucket,
      Key: cleanKey,
      ContentType: options.contentType,
      Metadata: options.metadata,
    });

    const client = this.getClient();
    const uploadUrl = await getSignedUrl(client, command, { expiresIn });
    const publicUrl = this.getPublicUrl(cleanKey);

    return {
      uploadUrl,
      publicUrl,
      key: cleanKey,
      expiresIn,
    };
  }

  async getDownloadPresignedUrl(
    options: PresignedDownloadOptions,
  ): Promise<{ downloadUrl: string; key: string }> {
    const config = this.getConfig();

    if (!config.bucket) {
      throw new Error(
        'S3_BUCKET is not configured. Please set S3_BUCKET in your environment variables.',
      );
    }

    const expiresIn = options.expiresIn ?? 900; // 15 minutes default
    const cleanKey = options.key.replace(/^\/+/, '');

    const command = new GetObjectCommand({
      Bucket: config.bucket,
      Key: cleanKey,
    });

    const client = this.getClient();
    const downloadUrl = await getSignedUrl(client, command, { expiresIn });

    return {
      downloadUrl,
      key: cleanKey,
    };
  }

  async deleteFile(options: { key: string }): Promise<void> {
    const config = this.getConfig();
    const cleanKey = options.key.replace(/^\/+/, '');

    const command = new DeleteObjectCommand({
      Bucket: config.bucket,
      Key: cleanKey,
    });

    const client = this.getClient();
    await client.send(command);
  }

  async getFileMetadata(options: { key: string }): Promise<FileMetadata> {
    const config = this.getConfig();
    const cleanKey = options.key.replace(/^\/+/, '');

    const command = new HeadObjectCommand({
      Bucket: config.bucket,
      Key: cleanKey,
    });

    const client = this.getClient();
    const res = await client.send(command);

    return {
      key: cleanKey,
      size: res.ContentLength,
      contentType: res.ContentType,
      lastModified: res.LastModified,
      etag: res.ETag,
    };
  }

  async uploadFile(options: DirectUploadOptions): Promise<{ key: string; publicUrl: string }> {
    const config = this.getConfig();
    const cleanKey = options.key.replace(/^\/+/, '');

    const command = new PutObjectCommand({
      Bucket: config.bucket,
      Key: cleanKey,
      Body: options.body as PutObjectCommandInput['Body'],
      ContentType: options.contentType,
      Metadata: options.metadata,
    });

    const client = this.getClient();
    await client.send(command);

    return {
      key: cleanKey,
      publicUrl: this.getPublicUrl(cleanKey),
    };
  }
}

// Default singleton instance using environment variables
export const storage = new StorageService();
