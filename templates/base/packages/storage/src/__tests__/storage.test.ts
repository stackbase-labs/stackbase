import { describe, expect, it } from 'vitest';
import { generateStorageKey, sanitizeFilename, StorageService } from '../index';

describe('Storage Package', () => {
  describe('sanitizeFilename', () => {
    it('lowercases and replaces special characters with hyphens', () => {
      expect(sanitizeFilename('My Photo (1).PNG')).toBe('my-photo-1-.png');
      expect(sanitizeFilename('test__image---file.jpg')).toBe('test-image-file.jpg');
    });
  });

  describe('generateStorageKey', () => {
    it('generates unique scoped keys without leading slashes', () => {
      const key = generateStorageKey('avatars/user-123', 'avatar.png');
      expect(key.startsWith('avatars/user-123/')).toBe(true);
      expect(key.endsWith('-avatar.png')).toBe(true);
    });

    it('handles root folder correctly', () => {
      const key = generateStorageKey('', 'file.pdf');
      expect(key).toMatch(/^[a-f0-9]{12}-file\.pdf$/);
    });
  });

  describe('StorageService', () => {
    it('constructs public URLs using default S3 format', () => {
      const service = new StorageService({
        bucket: 'test-bucket',
        region: 'us-west-2',
      });
      const url = service.getPublicUrl('avatars/123/pic.jpg');
      expect(url).toBe('https://test-bucket.s3.us-west-2.amazonaws.com/avatars/123/pic.jpg');
    });

    it('constructs public URLs using custom publicUrl/CDN', () => {
      const service = new StorageService({
        bucket: 'test-bucket',
        region: 'us-east-1',
        publicUrl: 'https://cdn.example.com',
      });
      const url = service.getPublicUrl('uploads/doc.pdf');
      expect(url).toBe('https://cdn.example.com/uploads/doc.pdf');
    });

    it('constructs public URLs with custom endpoint for MinIO/R2', () => {
      const service = new StorageService({
        bucket: 'my-bucket',
        region: 'auto',
        endpoint: 'http://localhost:9000',
      });
      const url = service.getPublicUrl('test.png');
      expect(url).toBe('http://localhost:9000/my-bucket/test.png');
    });
  });
});
