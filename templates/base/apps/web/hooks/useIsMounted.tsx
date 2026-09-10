'use client';

import * as React from 'react';

export function useIsMounted(): boolean {
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  return isMounted;
}

export default useIsMounted;
