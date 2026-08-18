interface IconProps {
  className?: string;
}

export function IconSword({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M14.5 17.5 3 6V3h3l11.5 11.5" />
      <path d="M13 19l6-6" />
      <path d="M16 16l4 4" />
      <path d="M19 21l2-2" />
    </svg>
  );
}

export function IconHeart({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M12 21s-7.5-4.6-10-9.2C.4 8.6 2.2 4.9 5.7 4.3c2-.3 4 .5 5.2 2h2.2c1.2-1.5 3.2-2.3 5.2-2 3.5.6 5.3 4.3 3.7 7.5C19.5 16.4 12 21 12 21z" transform="scale(0.92) translate(1 0.5)" />
    </svg>
  );
}

export function IconBag({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M8 8V7a4 4 0 0 1 8 0v1" />
      <path d="M5 8h14l-1.2 11.2a2 2 0 0 1-2 1.8H8.2a2 2 0 0 1-2-1.8L5 8z" />
      <circle cx="12" cy="14" r="2" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function IconSound({ className, muted }: IconProps & { muted?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M11 5 6 9H3v6h3l5 4V5z" fill="currentColor" />
      {muted ? (
        <path d="m16 9 5 6M21 9l-5 6" />
      ) : (
        <>
          <path d="M15.5 9.5a4 4 0 0 1 0 5" />
          <path d="M18 7a8 8 0 0 1 0 10" />
        </>
      )}
    </svg>
  );
}

export function IconHelp({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.2 9.2a2.8 2.8 0 0 1 5.4.9c0 1.8-2.6 2.3-2.6 3.9" />
      <circle cx="12" cy="17.2" r="0.6" fill="currentColor" />
    </svg>
  );
}

export function IconFlag({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M5 21V4" />
      <path d="M5 4h13l-2.5 4L18 12H5" fill="currentColor" fillOpacity="0.25" />
    </svg>
  );
}

export function IconHourglass({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M6 3h12M6 21h12" />
      <path d="M7 3c0 7 5 7 5 9s-5 2-5 9M17 3c0 7-5 7-5 9s5 2 5 9" />
    </svg>
  );
}

export function HpPips({ hp, maxHp, side, className }: { hp: number; maxHp: number; side: 'white' | 'black'; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-[3px] ${className ?? ''}`}>
      {Array.from({ length: maxHp }).map((_, i) => (
        <span
          key={i}
          className="inline-block h-[7px] w-[7px] rotate-45 rounded-[1px] transition-all duration-300"
          style={
            i < hp
              ? { background: side === 'white' ? '#e9b44c' : '#e0525f', boxShadow: `0 0 5px ${side === 'white' ? 'rgba(233,180,76,0.7)' : 'rgba(224,82,95,0.7)'}` }
              : { background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(239,230,207,0.25)' }
          }
        />
      ))}
    </span>
  );
}
