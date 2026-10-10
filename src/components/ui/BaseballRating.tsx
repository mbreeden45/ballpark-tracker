'use client';

import { BaseballIcon } from './BaseballIcon';
import { cn } from '@/lib/utils';

interface Props {
  label: string;
  hint?: string;
  value: number;
  onChange?: (value: number) => void;
  size?: number;
}

export function BaseballRating({ label, hint, value, onChange, size = 34 }: Props) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5">
      <div className="min-w-0">
        <div className="font-bold leading-tight text-ballpark">{label}</div>
        {hint && <div className="text-xs leading-tight text-ballpark/55">{hint}</div>}
      </div>
      <div className="flex shrink-0 items-center" role="radiogroup" aria-label={`${label} rating`}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={value === n}
            aria-label={`${n} of 5`}
            disabled={!onChange}
            onClick={() => onChange?.(value === n ? 0 : n)}
            className={cn(
              'flex h-10 w-[34px] items-center justify-center rounded-full transition active:scale-90',
              n <= value ? 'drop-shadow-[0_2px_2px_rgba(192,54,44,.35)]' : 'opacity-80',
            )}
          >
            <BaseballIcon size={size - 8} filled={n <= value} />
          </button>
        ))}
      </div>
    </div>
  );
}

export function StaticBalls({ value, size = 14 }: { value: number; size?: number }) {
  const rounded = Math.round(value);
  return (
    <span className="inline-flex" aria-label={`${value} of 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <BaseballIcon key={n} size={size} filled={n <= rounded} />
      ))}
    </span>
  );
}
