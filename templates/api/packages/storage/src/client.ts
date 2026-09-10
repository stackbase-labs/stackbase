import { S3Client, S3ClientConfig } from '@aws-sdk/client-s3';
import { keys } from './keys';
import type { StorageConfig } from './types';

export function resolveStorageConfig(custom?: Partial<StorageConfig>): StorageConfig {
  let env: Partial<ReturnType<typeof keys>> = {};
  try {
    env = keys();
  } catch {
    env = {};
  }

  const s3PublicUrl = custom?.publicUrl || env.S3_PUBLIC_URL || process.env.S3_PUBLIC_URL;

  return {
    bucket: custom?.bucket || env.S3_BUCKET || process.env.S3_BUCKET || '',
    region: custom?.region || env.S3_REGION || process.env.S3_REGION || 'us-east-1',
    accessKeyId: custom?.accessKeyId || env.S3_ACCESS_KEY_ID || process.env.S3_ACCESS_KEY_ID || '',
    secretAccessKey:
      custom?.secretAccessKey || env.S3_SECRET_ACCESS_KEY || process.env.S3_SECRET_ACCESS_KEY || '',
    endpoint: custom?.endpoint || env.S3_ENDPOINT || process.env.S3_ENDPOINT,
    publicUrl: s3PublicUrl,
    forcePathStyle:
      custom?.forcePathStyle !== undefined
        ? custom.forcePathStyle
        : env.S3_FORCE_PATH_STYLE !== undefined
          ? env.S3_FORCE_PATH_STYLE
          : process.env.S3_FORCE_PATH_STYLE === 'true' || process.env.S3_FORCE_PATH_STYLE === '1',
  };
}

export function createS3Client(config?: Partial<StorageConfig>): S3Client {
  const resolved = resolveStorageConfig(config);

  const clientConfig: S3ClientConfig = {
    region: resolved.region,
  };

  if (resolved.accessKeyId && resolved.secretAccessKey) {
    clientConfig.credentials = {
      accessKeyId: resolved.accessKeyId,
      secretAccessKey: resolved.secretAccessKey,
    };
  }

  if (resolved.endpoint) {
    clientConfig.endpoint = resolved.endpoint;
  }

  if (resolved.forcePathStyle !== undefined) {
    clientConfig.forcePathStyle = resolved.forcePathStyle;
  }

  return new S3Client(clientConfig);
}
