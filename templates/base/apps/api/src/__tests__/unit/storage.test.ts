import { Express } from 'express';
import { Server } from 'http';
import supertest from 'supertest';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { createAuthMiddlewareMock } from '../utils/auth-mocks';
import { createRateLimitPackageMock } from '../utils/rate-limit-mocks';

vi.mock('@workspace/auth', () => ({
  authClient: {},
  auth: {},
}));

vi.mock('@workspace/rate-limit', () => createRateLimitPackageMock());
vi.mock('../../middleware/auth', () => createAuthMiddlewareMock());

vi.mock('@workspace/storage', () => ({
  generateStorageKey: (folder: string, filename: string) => `${folder}/mock-uuid-${filename}`,
  storage: {
    getUploadPresignedUrl: vi.fn(async ({ key }) => ({
      uploadUrl: `https://storage.example.com/${key}?signature=mock`,
      publicUrl: `https://storage.example.com/${key}`,
      key,
      expiresIn: 300,
    })),
    deleteFile: vi.fn(async () => {}),
  },
}));

describe('Storage Routes', () => {
  let app: Express;
  let server: Server;

  beforeAll(async () => {
    const { createServer } = await import('../../server.js');
    app = createServer();
    server = app.listen(0);
  }, 30_000);

  afterAll(() => {
    server.close();
  });

  describe('POST /api/storage/presigned-upload', () => {
    it('returns presigned upload URL for valid avatar upload request', async () => {
      const response = await supertest(app)
        .post('/api/storage/presigned-upload')
        .send({
          filename: 'avatar.png',
          contentType: 'image/png',
          size: 1024 * 1024,
          folder: 'avatars',
        })
        .expect(200);

      expect(response.body).toHaveProperty('uploadUrl');
      expect(response.body).toHaveProperty('publicUrl');
      expect(response.body.key).toBe('avatars/test-user-123/mock-uuid-avatar.png');
      expect(response.body.expiresIn).toBe(300);
    });

    it('rejects invalid file type for avatar folder', async () => {
      const response = await supertest(app)
        .post('/api/storage/presigned-upload')
        .send({
          filename: 'document.pdf',
          contentType: 'application/pdf',
          size: 1024,
          folder: 'avatars',
        })
        .expect(400);

      expect(response.body.error).toBe('Invalid file type');
    });

    it('rejects oversized file for avatar folder', async () => {
      const response = await supertest(app)
        .post('/api/storage/presigned-upload')
        .send({
          filename: 'huge.png',
          contentType: 'image/png',
          size: 10 * 1024 * 1024, // 10MB > 5MB limit
          folder: 'avatars',
        })
        .expect(400);

      expect(response.body.error).toBe('File too large');
    });

    it('validates missing fields', async () => {
      const response = await supertest(app)
        .post('/api/storage/presigned-upload')
        .send({})
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
    });
  });

  describe('DELETE /api/storage/file', () => {
    it('allows user to delete their own file', async () => {
      const response = await supertest(app)
        .delete('/api/storage/file')
        .send({
          key: 'avatars/test-user-123/mock-uuid-avatar.png',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('forbids deleting files belonging to another user', async () => {
      const response = await supertest(app)
        .delete('/api/storage/file')
        .send({
          key: 'avatars/other-user-456/mock-uuid-avatar.png',
        })
        .expect(403);

      expect(response.body.error).toBe('Forbidden');
    });
  });
});
