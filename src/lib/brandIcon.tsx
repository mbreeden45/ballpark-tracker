/** The app mark: a home plate with a red check, on MLB navy. Shared by the favicon and the home-screen icon. */
export function BrandIcon({ size, rounded }: { size: number; rounded: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
      <rect width="64" height="64" rx={rounded ? 14 : 0} fill="#041E42" />
      <path d="M14 18h36v18L32 54 14 36z" fill="#FFFFFF" />
      <path d="M22.5 33l7 7 12.5-14.5" fill="none" stroke="#BF0D3E" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
