/** The app mark: a baseball diamond with a red check, on MLB navy. Shared by the favicon and the home-screen icon. */
export function BrandIcon({ size, rounded }: { size: number; rounded: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
      <rect width="64" height="64" rx={rounded ? 14 : 0} fill="#041E42" />
      <polygon points="32,6 58,32 32,58 6,32" fill="#FFFFFF" />
      <polygon points="32,12.5 51.5,32 32,51.5 12.5,32" fill="none" stroke="#041E42" strokeWidth="1.6" />
      <path d="M21.5 32.5 L29 40 L43.5 24" fill="none" stroke="#BF0D3E" strokeWidth="6.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
