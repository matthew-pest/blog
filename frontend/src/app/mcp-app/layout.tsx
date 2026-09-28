import type { Metadata } from 'next';
import { GeistMono, GeistSans } from '@/lib/fonts';
import '../globals.css';

export const metadata: Metadata = {
  title: 'mattpest.com widget',
  robots: { index: false },
};

/**
 * Root layout for the MCP App widget. Lives outside [lang] on purpose: no
 * Strapi, no nav, no ambient field — hosts render this inside a sandboxed
 * iframe and size it to content.
 */
export default function McpAppLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`dark ${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="bg-transparent">{children}</body>
    </html>
  );
}
