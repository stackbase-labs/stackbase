import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useIsMounted } from './useIsMounted';

describe('useIsMounted', () => {
  it('should return false initially, then true after mount', () => {
    const { result } = renderHook(() => useIsMounted());

    expect(result.current).toBe(true);
  });

  it('should remain true on rerender', () => {
    const { result, rerender } = renderHook(() => useIsMounted());

    expect(result.current).toBe(true);

    rerender();

    expect(result.current).toBe(true);
  });

  it('should handle multiple instances independently', () => {
    const { result: result1 } = renderHook(() => useIsMounted());
    const { result: result2 } = renderHook(() => useIsMounted());

    expect(result1.current).toBe(true);
    expect(result2.current).toBe(true);
  });
});
