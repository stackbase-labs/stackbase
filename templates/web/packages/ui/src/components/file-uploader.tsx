'use client';

import { Button } from '@workspace/ui/components/button';
import { cn } from '@workspace/ui/lib/utils';
import { AlertCircle, CheckCircle2, Loader2, UploadCloud, X } from 'lucide-react';
import * as React from 'react';

export interface FileUploaderProps extends React.HTMLAttributes<HTMLDivElement> {
  accept?: string;
  maxSize?: number; // bytes
  onFileSelect?: (file: File) => void | Promise<void>;
  uploading?: boolean;
  progress?: number; // 0 to 100
  error?: string | null;
  success?: boolean;
  value?: string | null; // preview URL or public URL
  onClear?: () => void;
  helperText?: string;
  disabled?: boolean;
}

export const FileUploader = React.forwardRef<HTMLDivElement, FileUploaderProps>(
  (
    {
      className,
      accept,
      maxSize = 10 * 1024 * 1024, // 10MB default
      onFileSelect,
      uploading = false,
      progress = 0,
      error = null,
      success = false,
      value,
      onClear,
      helperText,
      disabled = false,
      ...props
    },
    ref,
  ) => {
    const inputRef = React.useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = React.useState(false);
    const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
    const [localError, setLocalError] = React.useState<string | null>(null);
    const [previewUrl, setPreviewUrl] = React.useState<string | null>(value || null);

    React.useEffect(() => {
      if (value !== undefined) {
        setPreviewUrl(value);
      }
    }, [value]);

    const formatBytes = (bytes: number): string => {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
    };

    const handleFileValidation = (file: File): boolean => {
      setLocalError(null);

      if (maxSize && file.size > maxSize) {
        setLocalError(`File exceeds maximum size of ${formatBytes(maxSize)}.`);
        return false;
      }

      if (accept) {
        const acceptedTypes = accept.split(',').map((t) => t.trim().toLowerCase());
        const fileType = file.type.toLowerCase();
        const fileExt = `.${file.name.split('.').pop()?.toLowerCase()}`;

        const isAccepted = acceptedTypes.some((type) => {
          if (type.startsWith('.')) return fileExt === type;
          if (type.endsWith('/*')) {
            const prefix = type.slice(0, -2);
            return fileType.startsWith(prefix);
          }
          return fileType === type;
        });

        if (!isAccepted) {
          setLocalError(`Invalid file type. Accepted: ${accept}`);
          return false;
        }
      }

      return true;
    };

    const processFile = async (file: File) => {
      if (disabled || uploading) return;

      if (!handleFileValidation(file)) {
        return;
      }

      setSelectedFile(file);
      if (file.type.startsWith('image/')) {
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
      } else {
        setPreviewUrl(null);
      }

      if (onFileSelect) {
        await onFileSelect(file);
      }
    };

    const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!disabled && !uploading) {
        setIsDragging(true);
      }
    };

    const handleDragLeave = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      if (disabled || uploading) return;

      const files = e.dataTransfer.files;
      if (files && files.length > 0 && files[0]) {
        processFile(files[0]);
      }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0 && files[0]) {
        processFile(files[0]);
      }
    };

    const handleClear = (e: React.MouseEvent) => {
      e.stopPropagation();
      setSelectedFile(null);
      setPreviewUrl(null);
      setLocalError(null);
      if (inputRef.current) {
        inputRef.current.value = '';
      }
      onClear?.();
    };

    const displayError = error || localError;

    return (
      <div ref={ref} className={cn('w-full space-y-2', className)} {...props}>
        <div
          onClick={() => !disabled && !uploading && inputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            'group relative flex min-h-40 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 text-center transition-all duration-200',
            isDragging
              ? 'border-primary bg-primary/5 scale-[0.99]'
              : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/30',
            disabled &&
              'hover:border-muted-foreground/25 cursor-not-allowed opacity-50 hover:bg-transparent',
            displayError && 'border-destructive/60 bg-destructive/5',
            success && 'border-emerald-500/60 bg-emerald-500/5',
          )}
        >
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            onChange={handleInputChange}
            disabled={disabled || uploading}
            className="hidden"
          />

          {/* Preview or Icon State */}
          {previewUrl && !displayError ? (
            <div className="relative flex flex-col items-center gap-3">
              <div className="relative h-24 w-24 overflow-hidden rounded-md border shadow-sm">
                <img src={previewUrl} alt="Upload preview" className="h-full w-full object-cover" />
              </div>
              <p className="text-muted-foreground text-xs font-medium">
                {selectedFile ? selectedFile.name : 'Uploaded file'}
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div
                className={cn(
                  'rounded-full p-3 transition-colors',
                  displayError
                    ? 'bg-destructive/10 text-destructive'
                    : success
                      ? 'bg-emerald-500/10 text-emerald-600'
                      : 'bg-muted text-muted-foreground group-hover:text-primary',
                )}
              >
                {uploading ? (
                  <Loader2 className="text-primary h-6 w-6 animate-spin" />
                ) : displayError ? (
                  <AlertCircle className="h-6 w-6" />
                ) : success ? (
                  <CheckCircle2 className="h-6 w-6" />
                ) : (
                  <UploadCloud className="h-6 w-6" />
                )}
              </div>

              <div className="space-y-1">
                <p className="text-sm font-medium">
                  {uploading
                    ? 'Uploading file...'
                    : displayError
                      ? 'Upload failed'
                      : success
                        ? 'Upload complete'
                        : 'Click to upload or drag & drop'}
                </p>
                <p className="text-muted-foreground text-xs">
                  {helperText || `Max file size: ${formatBytes(maxSize)}`}
                </p>
              </div>
            </div>
          )}

          {/* Upload Progress Bar */}
          {uploading && (
            <div className="mt-4 w-full max-w-xs space-y-1">
              <div className="bg-muted h-1.5 w-full overflow-hidden rounded-full">
                <div
                  className="bg-primary h-full transition-all duration-300 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-muted-foreground text-right text-[10px]">
                {Math.round(progress)}%
              </p>
            </div>
          )}

          {/* Clear Button */}
          {(previewUrl || selectedFile || displayError) && !uploading && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleClear}
              className="text-muted-foreground hover:text-foreground absolute top-2 right-2 h-7 w-7 rounded-full"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Error Feedback */}
        {displayError && (
          <p className="text-destructive flex items-center gap-1.5 text-xs font-medium">
            <AlertCircle className="h-3.5 w-3.5" />
            {displayError}
          </p>
        )}
      </div>
    );
  },
);

FileUploader.displayName = 'FileUploader';
