# @workspace/storage

Production-ready, vendor-agnostic file storage for **build-elevate**. Built with the modular AWS SDK v3 to support **AWS S3, Cloudflare R2, MinIO, Supabase Storage, and Wasabi** out of the box.

## Features

- **Direct Presigned Uploads**: Browser uploads directly to cloud storage without consuming backend bandwidth or compute.
- **Vendor-Agnostic**: Compatible with any S3-compliant object store via environment variables.
- **Secure File Key Generation**: Prevents filename collisions and organizes uploads by folder and user.
- **Metadata & Deletion**: Helpers for head-object metadata queries and deleting files.
- **Type-Safe**: Full TypeScript types and Zod contract validation.

## Quick Start

```typescript
import { storage, generateStorageKey } from '@workspace/storage';

// Generate presigned PUT URL for client upload
const key = generateStorageKey('avatars/user-123', 'avatar.png');
const { uploadUrl, publicUrl } = await storage.getUploadPresignedUrl({
  key,
  contentType: 'image/png',
  expiresIn: 300, // 5 minutes
});
```
