import { DEFS, HAND_LIMIT } from './types';
import type { GameState, Piece } from './types';
import { attackPower, genMoves, legalDeploy } from './engine';

export interface AiDeploy {
  handIndex: number;
  r: number;
  c: number;
}

export interface AiMove {
  pieceId: number;
  r: number;
  c: number;
}

/** Il Nero (CPU) sceglie cosa schierare dalla mano. */
export function aiChooseDeploy(s: GameState): AiDeploy | null {
  if (s.winner || s.deployUsed || s.hands.black.length === 0) return null;
  const squares = legalDeploy(s, 'black');
  if (squares.length === 0) return null;

  const enemyBoard = s.pieces.filter((p) => p.side === 'white').length;
  const handFull = s.hands.black.length >= HAND_LIMIT;

  let best: AiDeploy | null = null;
  let bestScore = -Infinity;

  s.hands.black.forEach((t, handIndex) => {
    const def = DEFS[t];
    for (const [r, c] of squares) {
      let score = def.value * 2 + (3.5 - Math.abs(c - 3.5)) * 0.8 + r * 1.3 + Math.random() * 2;
      if (t === 'pawn') score += 2.5;
      if (t === 'rook' || t === 'queen') score += 2;
      // Il Re si espone solo quando il campo è quasi sgombro... o se la mano scoppia.
      if (t === 'king') score += enemyBoard <= 2 ? 12 : -55;
      if (handFull) score += 7;
      if (score > bestScore) {
        bestScore = score;
        best = { handIndex, r, c };
      }
    }
  });

  if (bestScore > -28 || handFull) return best;
  return null;
}

/** Il Nero sceglie la mossa o l'attacco migliore. */
export function aiChooseMove(s: GameState): AiMove | null {
  if (s.winner || s.moveUsed) return null;
  const mine = s.pieces.filter((p) => p.side === 'black' && p.bornPly < s.ply);
  if (mine.length === 0) return null;

  // Quadri minacciati dal Bianco (approssimazione: tutte le case che raggiunge).
  const threat = new Set<string>();
  for (const e of s.pieces.filter((p) => p.side === 'white')) {
    for (const m of genMoves(s, e)) threat.add(`${m.r},${m.c}`);
  }

  let best: AiMove | null = null;
  let bestScore = -Infinity;

  for (const p of mine) {
    const pDef = DEFS[p.type];
    for (const m of genMoves(s, p)) {
      let score = Math.random() * 1.6;
      const threatened = threat.has(`${m.r},${m.c}`);

      if (m.kind === 'attack' && m.targetId != null) {
        const t = s.pieces.find((q) => q.id === m.targetId) as Piece;
        const tDef = DEFS[t.type];
        const dmg = attackPower(s, p);
        if (dmg >= t.hp) {
          // Uccisione certa: niente rappresaglia.
          score += 45 + tDef.value * 11 + (t.type === 'king' ? 500 : 0);
          if (p.type === 'pawn' && m.r === 7) score += 26;
          if (threatened) score -= pDef.value * 2.4 + (p.type === 'king' ? 45 : 0);
        } else {
          score += dmg * 3.2 + (t.hp - dmg <= pDef.atk ? 7 : 0);
          if (t.type === 'king') score += 24;
          const counter = attackPower(s, t);
          if (counter >= p.hp) score -= pDef.value * 10 + (p.type === 'king' ? 600 : 0);
          else score -= counter * 2.2;
        }
      } else {
        score += (m.r - p.r) * 2.2; // il Nero avanza verso il basso
        score += (3.5 - Math.abs(m.c - 3.5)) * 0.5;
        if (p.type === 'pawn') score += 1.6;
        if (p.type === 'king') score -= 11;
        if (m.r >= 4) score += 0.9;
        if (threatened) score -= pDef.value * 1.7 + (p.type === 'king' ? 50 : 0);
      }

      if (score > bestScore) {
        bestScore = score;
        best = { pieceId: p.id, r: m.r, c: m.c };
      }
    }
  }

  return bestScore > -18 ? best : null;
}
