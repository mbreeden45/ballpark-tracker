interface Props {
  size?: number;
  filled?: boolean;
  className?: string;
}

export function BaseballIcon({ size = 24, filled = true, className }: Props) {
  const seam = filled ? '#C0362C' : '#9a9486';
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" className={className} aria-hidden="true">
      <circle cx="16" cy="16" r="14" fill={filled ? '#FBF8F1' : '#E4DAC3'} stroke={filled ? '#1E2022' : '#9a9486'} strokeWidth="1.5" />
      <path d="M7 5.5c3.5 3 3.5 18 0 21" fill="none" stroke={seam} strokeWidth="1.4" strokeLinecap="round" />
      <path d="M25 5.5c-3.5 3-3.5 18 0 21" fill="none" stroke={seam} strokeWidth="1.4" strokeLinecap="round" />
      {[9, 13, 17, 21].map((y) => (
        <g key={y} stroke={seam} strokeWidth="1" strokeLinecap="round">
          <path d={`M5.4 ${y - 0.4}l2.6 1.4`} />
          <path d={`M26.6 ${y - 0.4}l-2.6 1.4`} />
        </g>
      ))}
    </svg>
  );
}
