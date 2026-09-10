import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useCopyToClipboard } from './useCopyToClipboard';

describe('useCopyToClipboard', () => {
  beforeEach(() => {
    // Mock clipboard API
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  it('should return copy function and isCopied state', () => {
    const { result } = renderHook(() => useCopyToClipboard());
    const [copy, isCopied] = result.current;

    expect(typeof copy).toBe('function');
    expect(isCopied).toBe(false);
  });

  it('should copy text to clipboard', async () => {
    const { result } = renderHook(() => useCopyToClipboard());
    const [copy] = result.current;

    await act(async () => {
      await copy('test text');
    });

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('test text');
  });

  it('should set isCopied to true after copying', async () => {
    const { result } = renderHook(() => useCopyToClipboard());
    const [copy] = result.current;

    expect(result.current[1]).toBe(false);

    await act(async () => {
      await copy('test');
    });

    await waitFor(() => {
      expect(result.current[1]).toBe(true);
    });
  });

  it('should reset isCopied to false after 2 seconds', async () => {
    vi.useFakeTimers();

    const { result } = renderHook(() => useCopyToClipboard());
    const [copy] = result.current;

    await act(async () => {
      await copy('test');
    });

    expect(result.current[1]).toBe(true);

    await act(async () => {
      vi.advanceTimersByTime(2000);
    });

    expect(result.current[1]).toBe(false);

    vi.useRealTimers();
  });

  it('should handle clipboard not supported', async () => {
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    Object.assign(navigator, {
      clipboard: undefined,
    });

    const { result } = renderHook(() => useCopyToClipboard());
    const [copy] = result.current;

    await copy('test');

    expect(consoleWarnSpy).toHaveBeenCalledWith('Clipboard not supported');
    expect(result.current[1]).toBe(false);

    consoleWarnSpy.mockRestore();
  });

  it('should handle copy failure', async () => {
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const error = new Error('Copy failed');

    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockRejectedValue(error),
      },
    });

    const { result } = renderHook(() => useCopyToClipboard());
    const [copy] = result.current;

    await copy('test');

    expect(consoleWarnSpy).toHaveBeenCalledWith('Copy failed', error);
    expect(result.current[1]).toBe(false);

    consoleWarnSpy.mockRestore();
  });
});
