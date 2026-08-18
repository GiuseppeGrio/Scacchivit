export type Side = 'white' | 'black';
export type PieceType = 'pawn' | 'knight' | 'bishop' | 'rook' | 'queen' | 'king';

export interface PieceDef {
  type: PieceType;
  label: string;
  plural: string;
  value: number;
  hp: number;
  atk: number;
  desc: string;
}

/** Più il pezzo vale, meno HP ha in corpo. */
export const DEFS: Record<PieceType, PieceDef> = {
  pawn:   { type: 'pawn',   label: 'Pedone',  plural: 'Pedoni',  value: 1, hp: 6, atk: 2, desc: 'Umile e coriaceo: avanza dritto, ferisce in diagonale.' },
  knight: { type: 'knight', label: 'Cavallo', plural: 'Cavalli', value: 3, hp: 5, atk: 3, desc: 'Salta oltre le linee e colpisce dove meno te lo aspetti.' },
  bishop: { type: 'bishop', label: 'Alfiere', plural: 'Alfieri', value: 3, hp: 5, atk: 3, desc: 'Fendente diagonale a distanza: ferisce senza avvicinarsi.' },
  rook:   { type: 'rook',   label: 'Torre',   plural: 'Torri',   value: 5, hp: 4, atk: 4, desc: 'Macina colonne e traverse con colpi pesanti.' },
  queen:  { type: 'queen',  label: 'Regina',  plural: 'Regine',  value: 9, hp: 3, atk: 6, desc: 'Devastante su ogni linea. Ma il suo sangue è poco.' },
  king:   { type: 'king',   label: 'Re',      plural: 'Re',      value: 8, hp: 2, atk: 5, desc: 'Se cade, è finita. Finché è in campo: +1 ATT agli alleati.' },
};

export const HAND_LIMIT = 5;
export const LOOT_GOAL = 15;
export const BOARD_SIZE = 8;

export interface Piece {
  id: number;
  type: PieceType;
  side: Side;
  r: number;
  c: number;
  hp: number;
  maxHp: number;
  bornPly: number;
}

export interface MoveOption {
  r: number;
  c: number;
  kind: 'move' | 'attack';
  targetId?: number;
}

export interface GameState {
  mode: 'cpu' | '2p';
  ply: number;
  side: Side;
  pieces: Piece[];
  hands: Record<Side, PieceType[]>;
  bags: Record<Side, PieceType[]>;
  loot: Record<Side, number>;
  deployUsed: boolean;
  moveUsed: boolean;
  winner: { side: Side; reason: string } | null;
  selectedPieceId: number | null;
  selectedHandIndex: number | null;
  lastMove: { fromR: number; fromC: number; toR: number; toC: number } | null;
  turnDrawn: PieceType | null;
  log: string[];
  nextId: number;
}

export type GameEvent =
  | { kind: 'draw'; side: Side; type: PieceType }
  | { kind: 'deploy'; id: number; side: Side; type: PieceType; r: number; c: number }
  | { kind: 'move'; id: number; fromR: number; fromC: number; toR: number; toC: number }
  | { kind: 'damage'; id: number; r: number; c: number; amount: number; side: Side }
  | { kind: 'death'; id: number; r: number; c: number; side: Side; type: PieceType }
  | { kind: 'promote'; id: number; r: number; c: number; side: Side }
  | { kind: 'loot'; side: Side; total: number }
  | { kind: 'win'; side: Side; reason: string }
  | { kind: 'invalid' };
