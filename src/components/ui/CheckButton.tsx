'use client';

import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  checked: boolean;
  onToggle: () => void;
  label: string;
  size?: 'md' | 'lg';
  className?: string;
}

/** Big, forgiving one-tap visited toggle. */
export function CheckButton({ checked, onToggle, label, size = 'md', className }: Props) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full border-2 transition active:scale-90',
        size === 'lg' ? 'h-11 w-11' : 'h-9 w-9',
        checked ? 'border-ok bg-ok text-white' : 'border-silver bg-white text-transparent hover:border-navy',
        className,
      )}
    >
      <Check size={size === 'lg' ? 24 : 20} strokeWidth={3} className={checked ? 'animate-pop' : ''} />
    </button>
  );
}
