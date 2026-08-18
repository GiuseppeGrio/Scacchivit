import { DEFS, HAND_LIMIT, LOOT_GOAL } from './types';
import type { GameEvent, GameState, MoveOption, Piece, PieceType, Side } from './types';

export interface Result {
  state: GameState;
  events: GameEvent[];
}

export const FILES = 'abcdefgh';
export const coord = (r: number, c: number) => `${FILES[c]}${8 - r}`;
export const zoneRows = (side: Side): number[] => (side === 'white' ? [6, 7] : [0, 1]);
export const sideName = (side: Side) => (side === 'white' ? 'Bianco' : 'Nero');
export const otherSide = (side: Side): Side => (side === 'white' ? 'black' : 'white');

const inB = (r: number, c: number) => r >= 0 && r < 8 && c >= 0 && c < 8;

const ORTH = [[-1, 0], [1, 0], [0, -1], [0, 1]] as const;
const DIAG = [[-1, -1], [-1, 1], [1, -1], [1, 1]] as const;
const ALL_DIRS = [...ORTH, ...DIAG];
const KNIGHT_JUMPS = [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]] as const;

const BAG_TEMPLATE: PieceType[] = [
  'pawn', 'pawn', 'pawn', 'pawn', 'pawn', 'pawn', 'pawn', 'pawn',
  'knight', 'knight', 'bishop', 'bishop', 'rook', 'rook', 'queen', 'king',
];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export const pieceAt = (s: GameState, r: number, c: number): Piece | undefined =>
  s.pieces.find((p) => p.r === r && p.c === c);

export const hasKing = (s: GameState, side: Side): boolean =>
  s.pieces.some((p) => p.side === side && p.type === 'king');

/** Danno del pezzo: ATT base + aura del Re alleato (+1, il Re stesso escluso). */
export const attackPower = (s: GameState, p: Piece): number =>
  DEFS[p.type].atk + (p.type !== 'king' && hasKing(s, p.side) ? 1 : 0);

export const canAct = (s: GameState, p: Piece): boolean =>
  p.side === s.side && p.bornPly < s.ply && !s.winner;

function trimLog(s: GameState) {
  if (s.log.length > 9) s.log = s.log.slice(-9);
}

function draw(s: GameState, events: GameEvent[]) {
  s.turnDrawn = null;
  const bag = s.bags[s.side];
  const hand = s.hands[s.side];
  if (bag.length === 0) {
    if (hand.length === 0) s.log.push(`${sideName(s.side)}: riserve esaurite.`);
    return;
  }
  if (hand.length >= HAND_LIMIT) {
    s.log.push(`${sideName(s.side)} ha la mano piena: niente pesca.`);
    return;
  }
  const t = bag.pop() as PieceType;
  hand.push(t);
  s.turnDrawn = t;
  events.push({ kind: 'draw', side: s.side, type: t });
  s.log.push(`${sideName(s.side)} pesca ${DEFS[t].label} dal sacco.`);
}

export function newGame(mode: 'cpu' | '2p'): Result {
  const s: GameState = {
    mode,
    ply: 1,
    side: 'white',
    pieces: [],
    hands: { white: [], black: [] },
    bags: { white: shuffle(BAG_TEMPLATE), black: shuffle(BAG_TEMPLATE) },
    loot: { white: 0, black: 0 },
    deployUsed: false,
    moveUsed: false,
    winner: null,
    selectedPieceId: null,
    selectedHandIndex: null,
    lastMove: null,
    turnDrawn: null,
    log: ['La battaglia ha inizio: pesca, schiera, comanda.'],
    nextId: 1,
  };
  const events: GameEvent[] = [];
  draw(s, events);
  return { state: s, events };
}

export function genMoves(s: GameState, p: Piece): MoveOption[] {
  if (s.winner) return [];
  const opts: MoveOption[] = [];

  if (p.type === 'pawn') {
    const dir = p.side === 'white' ? -1 : 1;
    const home = p.side === 'white' ? 6 : 1;
    const one = p.r + dir;
    if (inB(one, p.c) && !pieceAt(s, one, p.c)) {
      opts.push({ r: one, c: p.c, kind: 'move' });
      const two = p.r + dir * 2;
      if (p.r === home && !pieceAt(s, two, p.c)) opts.push({ r: two, c: p.c, kind: 'move' });
    }
    for (const dc of [-1, 1]) {
      const r = p.r + dir;
      const c = p.c + dc;
      if (!inB(r, c)) continue;
      const e = pieceAt(s, r, c);
      if (e && e.side !== p.side) opts.push({ r, c, kind: 'attack', targetId: e.id });
    }
    return opts;
  }

  if (p.type === 'knight') {
    for (const [dr, dc] of KNIGHT_JUMPS) {
      const r = p.r + dr;
      const c = p.c + dc;
      if (!inB(r, c)) continue;
      const occ = pieceAt(s, r, c);
      if (!occ) opts.push({ r, c, kind: 'move' });
      else if (occ.side !== p.side) opts.push({ r, c, kind: 'attack', targetId: occ.id });
    }
    return opts;
  }

  if (p.type === 'king') {
    for (const [dr, dc] of ALL_DIRS) {
      const r = p.r + dr;
      const c = p.c + dc;
      if (!inB(r, c)) continue;
      const occ = pieceAt(s, r, c);
      if (!occ) opts.push({ r, c, kind: 'move' });
      else if (occ.side !== p.side) opts.push({ r, c, kind: 'attack', targetId: occ.id });
    }
    return opts;
  }

  const dirs = p.type === 'bishop' ? DIAG : p.type === 'rook' ? ORTH : ALL_DIRS;
  for (const [dr, dc] of dirs) {
    let r = p.r + dr;
    let c = p.c + dc;
    while (inB(r, c)) {
      const occ = pieceAt(s, r, c);
      if (occ) {
        if (occ.side !== p.side) opts.push({ r, c, kind: 'attack', targetId: occ.id });
        break;
      }
      opts.push({ r, c, kind: 'move' });
      r += dr;
      c += dc;
    }
  }
  return opts;
}

export function legalDeploy(s: GameState, side: Side): Array<[number, number]> {
  const res: Array<[number, number]> = [];
  for (const r of zoneRows(side)) {
    for (let c = 0; c < 8; c++) {
      if (!pieceAt(s, r, c)) res.push([r, c]);
    }
  }
  return res;
}

const reject = (s: GameState): Result => ({ state: s, events: [{ kind: 'invalid' }] });

export function deployPiece(s0: GameState, handIndex: number, r: number, c: number): Result {
  if (s0.winner || s0.deployUsed) return reject(s0);
  const type = s0.hands[s0.side][handIndex];
  if (!type) return reject(s0);
  if (!zoneRows(s0.side).includes(r) || pieceAt(s0, r, c)) return reject(s0);

  const s = structuredClone(s0);
  const events: GameEvent[] = [];
  const def = DEFS[type];
  const piece: Piece = {
    id: s.nextId++,
    type,
    side: s.side,
    r,
    c,
    hp: def.hp,
    maxHp: def.hp,
    bornPly: s.ply,
  };
  s.pieces.push(piece);
  s.hands[s.side].splice(handIndex, 1);
  s.deployUsed = true;
  s.selectedHandIndex = null;
  s.selectedPieceId = null;
  s.log.push(`${sideName(s.side)} schiera ${def.label} in ${coord(r, c)}.`);
  trimLog(s);
  events.push({ kind: 'deploy', id: piece.id, side: s.side, type, r, c });
  return { state: s, events };
}

function promote(s: GameState, p: Piece, events: GameEvent[]) {
  if (p.type === 'pawn' && (p.r === 0 || p.r === 7)) {
    p.type = 'queen';
    p.hp = DEFS.queen.hp;
    p.maxHp = DEFS.queen.hp;
    events.push({ kind: 'promote', id: p.id, r: p.r, c: p.c, side: p.side });
    s.log.push(`${sideName(p.side)}: il Pedone è diventato Regina!`);
  }
}

function kill(s: GameState, victim: Piece, events: GameEvent[]) {
  s.pieces = s.pieces.filter((q) => q.id !== victim.id);
  const killer = otherSide(victim.side);
  const val = DEFS[victim.type].value;
  s.loot[killer] += val;
  events.push({ kind: 'death', id: victim.id, r: victim.r, c: victim.c, side: victim.side, type: victim.type });
  events.push({ kind: 'loot', side: killer, total: s.loot[killer] });
  s.log.push(`${sideName(killer)} distrugge ${DEFS[victim.type].label} in ${coord(victim.r, victim.c)} (+${val} bottino).`);
  if (!s.winner) {
    if (victim.type === 'king') s.winner = { side: killer, reason: 'regicidio' };
    else if (s.loot[killer] >= LOOT_GOAL) s.winner = { side: killer, reason: 'bottino' };
    if (s.winner) events.push({ kind: 'win', side: s.winner.side, reason: s.winner.reason });
  }
}

export function commandMove(s0: GameState, pieceId: number, r: number, c: number): Result {
  const probe = s0.pieces.find((q) => q.id === pieceId);
  if (!probe || s0.winner || s0.moveUsed || !canAct(s0, probe)) return reject(s0);
  const opt = genMoves(s0, probe).find((m) => m.r === r && m.c === c);
  if (!opt) return reject(s0);

  const s = structuredClone(s0);
  const events: GameEvent[] = [];
  const p = s.pieces.find((q) => q.id === pieceId) as Piece;
  const fromR = p.r;
  const fromC = p.c;

  if (opt.kind === 'move') {
    p.r = r;
    p.c = c;
    events.push({ kind: 'move', id: p.id, fromR, fromC, toR: r, toC: c });
    promote(s, p, events);
  } else {
    const t = s.pieces.find((q) => q.id === opt.targetId) as Piece;
    const dmg = attackPower(s, p);
    t.hp -= dmg;
    events.push({ kind: 'damage', id: t.id, r: t.r, c: t.c, amount: dmg, side: t.side });
    s.log.push(`${DEFS[p.type].label} colpisce ${DEFS[t.type].label} in ${coord(t.r, t.c)} (-${dmg} HP).`);
    if (t.hp <= 0) {
      kill(s, t, events);
      p.r = r;
      p.c = c;
      events.push({ kind: 'move', id: p.id, fromR, fromC, toR: r, toC: c });
      promote(s, p, events);
    } else {
      // Rappresaglia: il difensore sopravvissuto colpisce a sua volta.
      const cdmg = attackPower(s, t);
      p.hp -= cdmg;
      events.push({ kind: 'damage', id: p.id, r: p.r, c: p.c, amount: cdmg, side: p.side });
      s.log.push(`${DEFS[t.type].label} risponde e infligge ${cdmg} danni.`);
      if (p.hp <= 0) kill(s, p, events);
    }
  }

  s.moveUsed = true;
  s.selectedPieceId = null;
  s.lastMove = { fromR, fromC, toR: r, toC: c };
  trimLog(s);
  return { state: s, events };
}

export function endTurn(s0: GameState): Result {
  if (s0.winner) return { state: s0, events: [] };
  const s = structuredClone(s0);
  const events: GameEvent[] = [];

  // Annientamento: niente in campo, niente in mano, niente nel sacco.
  for (const side of ['white', 'black'] as Side[]) {
    const alive =
      s.pieces.some((p) => p.side === side) ||
      s.hands[side].length > 0 ||
      s.bags[side].length > 0;
    if (!alive) {
      s.winner = { side: otherSide(side), reason: 'annientamento' };
      s.log.push(`${sideName(side)} non ha più un solo pezzo: annientato.`);
      events.push({ kind: 'win', side: s.winner.side, reason: s.winner.reason });
      return { state: s, events };
    }
  }

  s.side = otherSide(s.side);
  s.ply += 1;
  s.deployUsed = false;
  s.moveUsed = false;
  s.selectedPieceId = null;
  s.selectedHandIndex = null;
  draw(s, events);
  trimLog(s);
  return { state: s, events };
}
