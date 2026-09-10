import {
  ALLOWED_IMAGE_TYPES,
  deleteStorageFileSchema,
  getPresignedUploadUrlSchema,
  MAX_AVATAR_FILE_SIZE,
} from '@workspace/contracts';
import { generateStorageKey, storage } from '@workspace/storage';
import { Request, Response, Router } from 'express';
import { requireAuth } from '../middleware/auth';

const router: Router = Router();

/**
 * POST /api/storage/presigned-upload
 * Generates a presigned PUT URL for client-side direct uploads.
 * Requires authentication. Scopes the storage key to the authenticated user.
 */
router.post(
  '/presigned-upload',
  requireAuth,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const parseResult = getPresignedUploadUrlSchema.safeParse(req.body);
      if (!parseResult.success) {
        res.status(400).json({
          error: 'Validation failed',
          details: parseResult.error.flatten(),
        });
        return;
      }

      const { filename, contentType, size, folder } = parseResult.data;
      const userId = req.user!.id;

      // Validate avatar-specific constraints
      if (folder === 'avatars') {
        if (!ALLOWED_IMAGE_TYPES.includes(contentType as (typeof ALLOWED_IMAGE_TYPES)[number])) {
          res.status(400).json({
            error: 'Invalid file type',
            message: 'Avatars must be an image (JPEG, PNG, WebP, GIF, SVG).',
          });
          return;
        }

        if (size > MAX_AVATAR_FILE_SIZE) {
          res.status(400).json({
            error: 'File too large',
            message: `Avatar file size cannot exceed ${MAX_AVATAR_FILE_SIZE / (1024 * 1024)}MB.`,
          });
          return;
        }
      }

      // Scoped key ensures users cannot overwrite other users' files
      const scopedFolder = `${folder}/${userId}`;
      const key = generateStorageKey(scopedFolder, filename);

      const presigned = await storage.getUploadPresignedUrl({
        key,
        contentType,
        expiresIn: 300, // 5 minutes
      });

      res.status(200).json(presigned);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to generate upload URL';
      req.log.error({ err: error }, 'Failed to generate presigned upload URL');
      res.status(500).json({
        error: 'Internal Server Error',
        message,
      });
    }
  },
);

/**
 * DELETE /api/storage/file
 * Deletes an uploaded file from storage.
 * Requires authentication and ensures user ownership of the file key.
 */
router.delete('/file', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const parseResult = deleteStorageFileSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        error: 'Validation failed',
        details: parseResult.error.flatten(),
      });
      return;
    }

    const { key } = parseResult.data;
    const userId = req.user!.id;

    // Security check: ensure user owns the key (key must have folder/userId/... format)
    const keySegments = key.split('/');
    if (keySegments.length < 3 || keySegments[1] !== userId) {
      res.status(403).json({
        error: 'Forbidden',
        message: 'You are not authorized to delete this file.',
      });
      return;
    }

    await storage.deleteFile({ key });
    res.status(200).json({ success: true });
  } catch (error) {
    req.log.error({ err: error }, 'Failed to delete storage file');
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to delete file',
    });
  }
});

export default router;
