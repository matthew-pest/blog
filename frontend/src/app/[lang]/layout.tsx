import type { Metadata, Viewport } from 'next';
import '../globals.css';
import { GeistMono, GeistSans } from '@/lib/fonts';
import { i18n } from '../../../i18n-config';
import AmbientField from '@/components/ambient/AmbientField';
import Nav from '@/components/site/Nav';
import Footer from '@/components/site/Footer';
import AgentDock from '@/components/agent/AgentDock';
import PageContextReporter from '@/components/agent/PageContextReporter';
import { TooltipProvider } from '@/components/ui/tooltip';
import { getBrand } from '@/lib/site/content';

const SITE = 'https://www.mattpest.com';

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: { default: 'Matt Pest', template: '%s · Matt Pest' },
  description:
    'Principal AI & data architect in Chicago. Essays on physics, AI and engineering — and a resident agent that reads them, opens the résumé, and searches the web.',
  openGraph: {
    type: 'website',
    siteName: 'Matt Pest',
    title: 'Matt Pest',
    description: 'A personal site with an agent in it.',
  },
};

export const viewport: Viewport = {
  themeColor: '#0b0b10',
  colorScheme: 'dark',
};

type LayoutParams = Promise<{ lang: string }>;

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: LayoutParams;
}) {
  const { lang } = await params;
  const brand = await getBrand();

  return (
    <html lang={lang} className={`dark ${GeistSans.variable} ${GeistMono.variable}`} suppressHydrationWarning>
      <head>
        {/* CSS Custom Highlight API for agent-driven highlights; Lightning CSS can't parse ::highlight(). */}
        <style
          dangerouslySetInnerHTML={{
            __html: '::highlight(agent-highlight){background:oklch(0.72 0.17 300 / 34%);color:inherit;}',
          }}
        />
      </head>
      <body className="text-foreground">
        <TooltipProvider delayDuration={300}>
          <AmbientField />
          <PageContextReporter />
          <Nav lang={lang} logoUrl={brand.navbarLogoUrl} logoText={brand.navbarLogoText} />
          <main id="main" className="relative min-h-dvh pt-20">
            {children}
          </main>
          <Footer lang={lang} logoUrl={brand.footerLogoUrl} logoText={brand.footerLogoText} />
          <AgentDock lang={lang} />
        </TooltipProvider>
      </body>
    </html>
  );
}

export async function generateStaticParams() {
  return i18n.locales.map((locale) => ({ lang: locale }));
}
