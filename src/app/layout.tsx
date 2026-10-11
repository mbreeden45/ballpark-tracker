import type { Metadata, Viewport } from 'next';
import { Barlow_Condensed, Inter } from 'next/font/google';
import './globals.css';
import { AppHeader } from '@/components/AppHeader';
import { StoreHydrator } from '@/components/StoreHydrator';

const display = Barlow_Condensed({ weight: ['500', '600', '700'], subsets: ['latin'], variable: '--font-display', display: 'swap' });
const body = Inter({ subsets: ['latin'], variable: '--font-body', display: 'swap' });

const siteUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: 'Ballpark Passport — Track and plan your MLB ballpark trips',
  description: 'Check off every MLB ballpark you have visited, rank them, and plan a realistic road trip around the schedule.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#041E42',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body className="font-body antialiased">
        <StoreHydrator />
        <AppHeader />
        {children}
        <footer className="mx-auto max-w-[1400px] px-4 pb-8 pt-2 text-center text-xs text-muted">
          Fan-made project. Not affiliated with or endorsed by Major League Baseball or any club. Schedule and box score data from the public MLB Stats API.
        </footer>
      </body>
    </html>
  );
}
