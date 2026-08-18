import { useId } from 'react';
import type { PieceType, Side } from '../game/types';

interface Props {
  type: PieceType;
  side: Side;
  className?: string;
}

const BASE = 'M33 89 L67 89 L62 80 L38 80 Z';
const STEP = 'M38 80 L62 80 L58 73 L42 73 Z';

export function PieceIcon({ type, side, className }: Props) {
  const uid = useId();
  const white = side === 'white';
  const gid = `${uid}-g`;
  const stroke = white ? '#77591f' : '#d84b5f';
  const strokeW = 3;

  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      fill={`url(#${gid})`}
      stroke={stroke}
      strokeWidth={strokeW}
      strokeLinejoin="round"
      strokeLinecap="round"
      aria-hidden
    >
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          {white ? (
            <>
              <stop offset="0" stopColor="#faf0da" />
              <stop offset="0.55" stopColor="#ecd9ae" />
              <stop offset="1" stopColor="#d3b87f" />
            </>
          ) : (
            <>
              <stop offset="0" stopColor="#5a453c" />
              <stop offset="0.55" stopColor="#382a24" />
              <stop offset="1" stopColor="#201613" />
            </>
          )}
        </linearGradient>
      </defs>

      {type === 'pawn' && (
        <g>
          <circle cx="50" cy="29" r="13" />
          <path d="M50 42c-8 8-12 17-12 31h24c0-14-4-23-12-31z" />
          <path d={STEP} />
          <path d={BASE} />
        </g>
      )}

      {type === 'rook' && (
        <g>
          <path d="M32 18h9v8h7v-8h4v8h7v-8h9v15l-6 7v22l6 8v11H32V70l6-8V40l-6-7V18z" />
          <path d="M43 62h14v9H43z" fill="rgba(0,0,0,0.35)" />
          <path d={BASE} />
        </g>
      )}

      {type === 'knight' && (
        <g>
          <path d="M37 81c-1-17 1-29 8-38 -3-5-3-12 1-17l-2-10 10 7c9 3 15 12 14 22-1 7-4 12-4 20l1 16z" />
          <circle cx="52" cy="33" r="2.6" fill={white ? '#5a431b' : '#e58896'} stroke="none" />
          <path d={STEP} />
          <path d={BASE} />
        </g>
      )}

      {type === 'bishop' && (
        <g>
          <circle cx="50" cy="14" r="5" />
          <path d="M50 22c-10 11-14 20-14 28 0 9 6 15 14 15s14-6 14-15c0-8-4-17-14-28z" />
          <path d="M50 34v18" fill="none" strokeWidth={3.4} />
          <path d="M40 65h20l3 8H37l3-8z" />
          <path d={BASE} />
        </g>
      )}

      {type === 'queen' && (
        <g>
          <circle cx="50" cy="11" r="3.6" />
          <path d="M29 44l7-25 9 15 5-18 5 18 9-15 7 25-5 10H34l-5-10z" />
          <path d="M37 54h26l3 19H34l3-19z" />
          <path d={BASE} />
        </g>
      )}

      {type === 'king' && (
        <g>
          <path d="M45 6h10v8h8v10h-8v8H45v-8h-8V14h8V6z" />
          <path d="M50 32c-12 0-19 9-19 19 0 8 5 14 11 17l-2 13h20l-2-13c6-3 11-9 11-17 0-10-7-19-19-19z" />
          <path d={BASE} />
        </g>
      )}
    </svg>
  );
}
