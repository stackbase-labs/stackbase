'use client';

import { api } from '@/lib/api-client';
import { useMutation } from '@tanstack/react-query';
import type { Session } from '@workspace/auth/client';
import { updateUser } from '@workspace/auth/client';
import type { PresignedUploadResponse } from '@workspace/contracts';
import { ALLOWED_IMAGE_TYPES, MAX_AVATAR_FILE_SIZE } from '@workspace/contracts';
import { Avatar, AvatarFallback, AvatarImage } from '@workspace/ui/components/avatar';
import { Button } from '@workspace/ui/components/button';
import { Spinner } from '@workspace/ui/components/spinner';
import { Camera, Trash2, Upload } from 'lucide-react';
import { useRouter } from 'next/navigation';
import * as React from 'react';
import { toast } from 'sonner';

interface AvatarUploaderProps {
  user: Session['user'];
}

export function AvatarUploader({ user }: AvatarUploaderProps) {
  const router = useRouter();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [uploadProgress, setUploadProgress] = React.useState<number>(0);
  const [imageSrc, setImageSrc] = React.useState<string | null>(user.image || null);

  React.useEffect(() => {
    setImageSrc(user.image || null);
  }, [user.image]);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      // 1. Validate file client-side
      if (!ALLOWED_IMAGE_TYPES.includes(file.type as (typeof ALLOWED_IMAGE_TYPES)[number])) {
        throw new Error('Please select a valid image file (JPEG, PNG, WebP, GIF, SVG).');
      }

      if (file.size > MAX_AVATAR_FILE_SIZE) {
        throw new Error(`Avatar image cannot exceed ${MAX_AVATAR_FILE_SIZE / (1024 * 1024)}MB.`);
      }

      setUploadProgress(15);

      // 2. Request presigned PUT URL from Express API
      const presigned = await api.post<PresignedUploadResponse>('/storage/presigned-upload', {
        filename: file.name,
        contentType: file.type,
        size: file.size,
        folder: 'avatars',
      });

      setUploadProgress(40);

      // 3. Upload file directly to S3 / Cloudflare R2 via presigned URL
      let uploadRes: Response;
      try {
        uploadRes = await fetch(presigned.uploadUrl, {
          method: 'PUT',
          body: file,
          headers: {
            'Content-Type': file.type,
          },
        });
      } catch {
        throw new Error(
          'Failed to upload to storage provider. Please ensure CORS is enabled on your S3 bucket.',
        );
      }

      if (!uploadRes.ok) {
        const errorText = await uploadRes.text().catch(() => '');
        throw new Error(
          `Failed to upload image (${uploadRes.status}): ${errorText || uploadRes.statusText}`,
        );
      }

      setUploadProgress(80);

      // 4. Update user's avatar image URL in Better Auth / database
      await updateUser({
        image: presigned.publicUrl,
      });

      setImageSrc(presigned.publicUrl);
      setUploadProgress(100);
      return presigned.publicUrl;
    },
    onSuccess: () => {
      toast.success('Avatar updated successfully!');
      router.refresh();
    },
    onError: (err: Error) => {
      console.error('Avatar upload failed:', err);
      toast.error(err.message || 'Failed to upload avatar');
    },
    onSettled: () => {
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
  });

  const removeMutation = useMutation({
    mutationFn: async () => {
      await updateUser({
        image: '',
      });
      setImageSrc(null);
    },
    onSuccess: () => {
      toast.success('Avatar removed');
      router.refresh();
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to remove avatar');
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      uploadMutation.mutate(files[0]);
    }
  };

  const isPending = uploadMutation.isPending || removeMutation.isPending;

  return (
    <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
      <input
        ref={fileInputRef}
        type="file"
        accept={ALLOWED_IMAGE_TYPES.join(',')}
        onChange={handleFileChange}
        disabled={isPending}
        className="hidden"
      />

      {/* Avatar with hover trigger */}
      <div
        onClick={() => !isPending && fileInputRef.current?.click()}
        className="group border-border relative h-20 w-20 cursor-pointer overflow-hidden rounded-full border-2 shadow-sm transition-opacity hover:opacity-90"
      >
        <Avatar className="h-full w-full">
          {imageSrc && (
            <AvatarImage src={imageSrc} alt={user.name || 'User'} className="object-cover" />
          )}
          <AvatarFallback className="bg-muted text-base font-semibold">
            {getInitials(user.name || 'User')}
          </AvatarFallback>
        </Avatar>

        {/* Hover / Loading Overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 text-white opacity-0 transition-opacity group-hover:opacity-100">
          {uploadMutation.isPending ? (
            <Spinner className="h-5 w-5 text-white" />
          ) : (
            <>
              <Camera className="h-5 w-5" />
              <span className="mt-0.5 text-[10px] font-medium">Change</span>
            </>
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isPending}
            className="text-xs"
          >
            {uploadMutation.isPending ? (
              <>
                <Spinner className="mr-1.5 h-3.5 w-3.5" />
                Uploading ({uploadProgress}%)
              </>
            ) : (
              <>
                <Upload className="mr-1.5 h-3.5 w-3.5" />
                Upload Image
              </>
            )}
          </Button>

          {user.image && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => removeMutation.mutate()}
              disabled={isPending}
              className="text-destructive hover:bg-destructive/10 hover:text-destructive text-xs"
            >
              <Trash2 className="mr-1.5 h-3.5 w-3.5" />
              Remove
            </Button>
          )}
        </div>
        <p className="text-muted-foreground text-xs">
          Recommended size: 400x400px. JPG, PNG, WebP or SVG up to{' '}
          {MAX_AVATAR_FILE_SIZE / (1024 * 1024)}MB.
        </p>
      </div>
    </div>
  );
}
