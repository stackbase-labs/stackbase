import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FileUploader } from '@workspace/ui/components/file-uploader';
import { describe, expect, it, vi } from 'vitest';

describe('FileUploader Component', () => {
  it('renders default dropzone with text and helper info', () => {
    render(<FileUploader helperText="Max size: 5MB" maxSize={5 * 1024 * 1024} />);

    expect(screen.getByText(/click to upload or drag & drop/i)).toBeInTheDocument();
    expect(screen.getByText(/max size: 5mb/i)).toBeInTheDocument();
  });

  it('handles valid file selection and triggers onFileSelect', async () => {
    const handleFileSelect = vi.fn();
    render(
      <FileUploader
        accept="image/png,image/jpeg"
        maxSize={5 * 1024 * 1024}
        onFileSelect={handleFileSelect}
      />,
    );

    const file = new File(['dummy content'], 'avatar.png', { type: 'image/png' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;

    await userEvent.upload(input, file);

    expect(handleFileSelect).toHaveBeenCalledTimes(1);
    expect(handleFileSelect).toHaveBeenCalledWith(file);
  });

  it('rejects files exceeding maxSize and displays error', async () => {
    const handleFileSelect = vi.fn();
    render(
      <FileUploader
        maxSize={1024} // 1 KB
        onFileSelect={handleFileSelect}
      />,
    );

    const largeFile = new File(['a'.repeat(2048)], 'large.png', { type: 'image/png' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;

    await userEvent.upload(input, largeFile);

    expect(handleFileSelect).not.toHaveBeenCalled();
    expect(screen.getByText(/file exceeds maximum size/i)).toBeInTheDocument();
  });

  it('rejects files with unaccepted MIME types', async () => {
    const handleFileSelect = vi.fn();
    render(<FileUploader accept="image/png,image/jpeg" onFileSelect={handleFileSelect} />);

    const pdfFile = new File(['dummy pdf'], 'doc.pdf', { type: 'application/pdf' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;

    fireEvent.change(input, { target: { files: [pdfFile] } });

    expect(handleFileSelect).not.toHaveBeenCalled();
    expect(screen.getByText(/invalid file type/i)).toBeInTheDocument();
  });

  it('renders uploading progress bar and text when uploading is true', () => {
    render(<FileUploader uploading={true} progress={65} />);

    expect(screen.getByText(/uploading file.../i)).toBeInTheDocument();
    expect(screen.getByText('65%')).toBeInTheDocument();
  });

  it('renders custom preview value and allows clearing', () => {
    const handleClear = vi.fn();
    render(<FileUploader value="https://cdn.example.com/photo.jpg" onClear={handleClear} />);

    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('src', 'https://cdn.example.com/photo.jpg');

    const clearBtn = screen.getByRole('button');
    fireEvent.click(clearBtn);

    expect(handleClear).toHaveBeenCalledTimes(1);
  });
});
