import React from 'react';
import type { EmailPropsMap, EmailType } from './types';

/**
 * Type-safe template factory that prevents type mismatches without casting.
 * Ensures the render function accepts the correct props type for the email type.
 */
export function createTemplate<T extends EmailType>(
  _emailType: T,
  config: {
    subject: string;
    render: (props: EmailPropsMap[T]) => React.ReactNode;
  },
) {
  return config;
}
