import { useCallback, useRef, useState } from 'react';
import type { GameEvent, GameState } from './types';
import { DEFS } from './types';
import { commandMove, deployPiece, endTurn, newGame } from './engine';
import { fxBus } from '../fx';
import { initAudio, sfx } from '../audio';

const center = (r: number, c: number) => ({ x: c * 12.5 + 6.25, y: r * 12.5 + 6.25 });

function playEvents(events: GameEvent[]) {
  for (const e of events) {
    switch (e.kind) {
      case 'draw':
        sfx.draw();
        break;
      case 'deploy': {
        sfx.deploy();
        const { x, y } = center(e.r, e.c);
        fxBus.emit({ kind: 'burst', x, y, color: e.side === 'white' ? '#f7d98b' : '#e0525f', count: 18, power: 1 });
        fxBus.emit({ kind: 'float', x, y: y - 3, text: DEFS[e.type].label, color: '#f7d98b', size: 0.85 });
        break;
      }
      case 'move':
        sfx.move();
        break;
      case 'damage': {
        sfx.hit();
        const { x, y } = center(e.r, e.c);
        fxBus.emit({ kind: 'burst', x, y, color: '#ff6b5e', count: 13, power: 1.15 });
        fxBus.emit({ kind: 'float', x, y: y - 1, text: `-${e.amount}`, color: '#ff6b5e', size: 1.1 });
        if (e.amount >= 5) fxBus.emit({ kind: 'shake', power: 1 });
        break;
      }
      case 'death': {
        sfx.kill();
        const { x, y } = center(e.r, e.c);
        fxBus.emit({ kind: 'burst', x, y, color: e.side === 'white' ? '#f2e5c8' : '#e0525f', count: 32, power: 2 });
        fxBus.emit({ kind: 'burst', x, y, color: '#f7d98b', count: 12, power: 1.4 });
        fxBus.emit({ kind: 'float', x, y: y + 2, text: `+${DEFS[e.type].value}`, color: '#f7d98b', size: 1 });
        fxBus.emit({ kind: 'shake', power: e.type === 'king' ? 2.2 : 1.4 });
        break;
      }
      case 'promote': {
        sfx.promote();
        const { x, y } = center(e.r, e.c);
        fxBus.emit({ kind: 'burst', x, y, color: '#f7d98b', count: 26, power: 1.6 });
        fxBus.emit({ kind: 'float', x, y: y - 4, text: 'REGINA!', color: '#f7d98b', size: 1.25 });
        break;
      }
      case 'win':
        sfx.win();
        fxBus.emit({ kind: 'confetti' });
        break;
      case 'invalid':
        sfx.error();
        break;
      default:
        break;
    }
  }
}

export function useGame() {
  const [state, setState] = useState<GameState | null>(null);
  const ref = useRef<GameState | null>(null);

  const commit = useCallback((next: GameState, events: GameEvent[]) => {
    ref.current = next;
    setState(next);
    playEvents(events);
  }, []);

  const run = useCallback(
    (fn: (s: GameState) => { state: GameState; events: GameEvent[] }) => {
      const cur = ref.current;
      if (!cur) return;
      const res = fn(cur);
      commit(res.state, res.events);
    },
    [commit],
  );

  const start = useCallback(
    (mode: 'cpu' | '2p') => {
      initAudio();
      sfx.click();
      const res = newGame(mode);
      commit(res.state, res.events);
    },
    [commit],
  );

  const deploy = useCallback((handIndex: number, r: number, c: number) => run((s) => deployPiece(s, handIndex, r, c)), [run]);
  const move = useCallback((pieceId: number, r: number, c: number) => run((s) => commandMove(s, pieceId, r, c)), [run]);
  const end = useCallback(() => run((s) => endTurn(s)), [run]);

  const selectPiece = useCallback((id: number | null) => {
    const cur = ref.current;
    if (!cur) return;
    if (id != null) initAudio();
    sfx.click();
    const next: GameState = { ...cur, selectedPieceId: id, selectedHandIndex: null };
    ref.current = next;
    setState(next);
  }, []);

  const selectHand = useCallback((index: number | null) => {
    const cur = ref.current;
    if (!cur) return;
    if (index != null) initAudio();
    sfx.click();
    const next: GameState = { ...cur, selectedHandIndex: index, selectedPieceId: null };
    ref.current = next;
    setState(next);
  }, []);

  const toMenu = useCallback(() => {
    sfx.click();
    ref.current = null;
    setState(null);
  }, []);

  return { state, stateRef: ref, start, deploy, move, end, selectPiece, selectHand, toMenu };
}
