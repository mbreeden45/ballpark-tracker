'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CalendarRange, ClipboardCheck, Volume2, VolumeX } from 'lucide-react';
import { useBallparkStore } from '@/store/useBallparkStore';
import { BaseballIcon } from '@/components/ui/BaseballIcon';
import { cn } from '@/lib/utils';

const LINKS = [
  { href: '/', label: 'Passport', icon: ClipboardCheck },
  { href: '/planner', label: 'Trip Planner', icon: CalendarRange },
];

export function AppHeader() {
  const pathname = usePathname();
  const soundEnabled = useBallparkStore((s) => s.soundEnabled);
  const setSoundEnabled = useBallparkStore((s) => s.setSoundEnabled);

  return (
    <header className="sticky top-0 z-30 bg-navy text-white shadow-card">
      <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-3 px-4">
        <Link href="/" className="flex shrink-0 items-center gap-2 py-3" aria-label="Ballpark Passport home">
          <BaseballIcon size={28} />
          <span className="h-display hidden text-xl leading-none sm:inline">Ballpark Passport</span>
        </Link>
        <nav className="flex flex-1 justify-center gap-1 sm:justify-start sm:pl-6" aria-label="Main">
          {LINKS.map(({ href, label, icon: Icon }) => {
            const active = href === '/' ? pathname === '/' : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex min-h-[52px] items-center gap-1.5 border-b-4 px-3 text-sm font-semibold transition',
                  active ? 'border-brand text-white' : 'border-transparent text-white/70 hover:text-white',
                )}
              >
                <Icon size={17} />
                {label}
              </Link>
            );
          })}
        </nav>
        <button
          type="button"
          onClick={() => setSoundEnabled(!soundEnabled)}
          aria-pressed={soundEnabled}
          aria-label={soundEnabled ? 'Mute sounds' : 'Enable sounds'}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white/80 hover:bg-white/10"
        >
          {soundEnabled ? <Volume2 size={19} /> : <VolumeX size={19} />}
        </button>
      </div>
    </header>
  );
}
