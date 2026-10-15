import type { Metadata, Viewport } from 'next';
import '../globals.css';
import { GeistMono, GeistSans } from '@/lib/fonts';
import AmbientField from '@/components/ambient/AmbientField';
import AgentDock from '@/components/agent/AgentDock';
import PageContextReporter from '@/components/agent/PageContextReporter';
import { TooltipProvider } from '@/components/ui/tooltip';

export const metadata: Metadata = {
  title: { default: 'Presentation', template: '%s · Matt Pest' },
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
};

export const viewport: Viewport = {
  themeColor: '#0b0b10',
  colorScheme: 'dark',
};

/**
 * Root layout for the private presentation section. Its own <html>: no site
 * nav, no footer, no Strapi. The ambient field and the agent dock come along so
 * the deck can be driven from the chat.
 */
export default function PresentationLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`dark deck-theme ${GeistSans.variable} ${GeistMono.variable}`} suppressHydrationWarning>
      <body className="text-foreground">
        <TooltipProvider delayDuration={200}>
          <AmbientField />
          <PageContextReporter />
          <main id="main" className="relative min-h-dvh">
            {children}
          </main>
          <AgentDock lang="en" />
        </TooltipProvider>
      </body>
    </html>
  );
}
