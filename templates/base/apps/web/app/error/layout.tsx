import { generatePageMetadata, pageMetadata } from '@/config/metadata';

export const metadata = generatePageMetadata(
  pageMetadata.error.title,
  pageMetadata.error.description,
  { noindex: true },
);

export default function ErrorLayout({ children }: { children: React.ReactNode }) {
  return children;
}
