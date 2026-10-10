import type { Metadata, Viewport } from 'next';
import { Alfa_Slab_One, Libre_Franklin, Special_Elite, Share_Tech_Mono } from 'next/font/google';
import './globals.css';

const display = Alfa_Slab_One({ weight: '400', subsets: ['latin'], variable: '--font-display', display: 'swap' });
const body = Libre_Franklin({ subsets: ['latin'], variable: '--font-body', display: 'swap' });
const typewriter = Special_Elite({ weight: '400', subsets: ['latin'], variable: '--font-typewriter', display: 'swap' });
const scoreboard = Share_Tech_Mono({ weight: '400', subsets: ['latin'], variable: '--font-scoreboard', display: 'swap' });

export const metadata: Metadata = {
  title: 'Ballpark Passport — MLB Field Log',
  description: 'Track every MLB ballpark you have visited: stamp your passport, rate the five tools, and share your tier list.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#1E4D2B',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${typewriter.variable} ${scoreboard.variable}`}>
      <body className="font-body antialiased">{children}</body>
    </html>
  );
}
