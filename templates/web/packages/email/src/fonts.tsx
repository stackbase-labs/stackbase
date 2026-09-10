import React from 'react';

export const FONT_FAMILY = '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

export const FontHead: React.FC = () => (
  <>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
    <link
      href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
      rel="stylesheet"
    />
  </>
);
