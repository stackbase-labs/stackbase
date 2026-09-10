import { z } from 'zod';

export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
] as const;

export const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
  'text/plain',
  'text/csv',
  'application/json',
] as const;

export const MAX_AVATAR_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
export const MAX_UPLOAD_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

export const storageFolderSchema = z.enum(['avatars', 'uploads', 'documents']);
export type StorageFolder = z.infer<typeof storageFolderSchema>;

export const getPresignedUploadUrlSchema = z.object({
  filename: z
    .string()
    .min(1, { message: 'Filename is required.' })
    .max(255, { message: 'Filename is too long.' }),
  contentType: z.string().min(1, { message: 'Content-Type is required.' }),
  size: z
    .number()
    .int()
    .positive({ message: 'File size must be greater than 0.' })
    .max(MAX_UPLOAD_FILE_SIZE, {
      message: `File size cannot exceed ${MAX_UPLOAD_FILE_SIZE / (1024 * 1024)}MB.`,
    }),
  folder: storageFolderSchema.default('uploads'),
});

export type GetPresignedUploadUrlInput = z.infer<typeof getPresignedUploadUrlSchema>;

export const presignedUploadResponseSchema = z.object({
  uploadUrl: z.string().url(),
  publicUrl: z.string().url(),
  key: z.string(),
  expiresIn: z.number(),
});

export type PresignedUploadResponse = z.infer<typeof presignedUploadResponseSchema>;

export const deleteStorageFileSchema = z.object({
  key: z.string().min(1, { message: 'File key is required.' }),
});

export type DeleteStorageFileInput = z.infer<typeof deleteStorageFileSchema>;
