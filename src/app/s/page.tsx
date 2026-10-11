import type { Metadata } from 'next';
import Link from 'next/link';
import { parseVisitedMask } from '@/lib/shareMask';

type Props = { searchParams: Promise<{ v?: string }> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { v } = await searchParams;
  const count = parseVisitedMask(v).size;
  const title = `I've been to ${count} of 30 MLB ballparks`;
  const description = 'Check off every MLB ballpark, plan a road trip around the schedule, and share your passport.';
  const image = `/s/og?v=${encodeURIComponent(v ?? '0')}`;
  return {
    title,
    description,
    openGraph: { title, description, type: 'website', images: [{ url: image, width: 1200, height: 630, alt: title }] },
    twitter: { card: 'summary_large_image', title, description, images: [image] },
  };
}

export default async function SharePage({ searchParams }: Props) {
  const { v } = await searchParams;
  const count = parseVisitedMask(v).size;
  return (
    <main className="mx-auto flex min-h-[70dvh] w-full max-w-md flex-col items-center justify-center px-6 text-center">
      <p className="text-xs font-semibold uppercase tracking-widest text-muted">MLB Ballpark Passport</p>
      <p className="mt-2 font-display text-8xl font-bold leading-none">
        {count}
        <span className="text-4xl text-muted"> / 30</span>
      </p>
      <p className="mt-2 text-lg font-semibold">MLB ballparks visited</p>
      <p className="mt-4 text-sm text-muted">A friend invited you to track your own ballparks and plan a trip together.</p>
      <Link href="/" className="btn-primary mt-6 w-full">Make your own passport</Link>
    </main>
  );
}
