import { useEffect, useState } from 'react';
import { useGame } from './game/useGame';
import { aiChooseDeploy, aiChooseMove } from './game/ai';
import { pieceAt, sideName, zoneRows } from './game/engine';
import { initAudio, setMuted, sfx } from './audio';
import { Board } from './components/Board';
import { Panel, PlayerStrip } from './components/Panel';
import { GameOverOverlay, RulesModal, StartScreen, TurnBanner } from './components/Screens';
import { PieceIcon } from './components/PieceIcon';
import { IconFlag, IconHelp, IconSound } from './components/icons';

export default function App() {
  const g = useGame();
  const s = g.state;
  const [showRules, setShowRules] = useState(false);
  const [muted, setMutedState] = useState(false);

  /* ---------- turno della CPU ---------- */
  useEffect(() => {
    if (!s || s.mode !== 'cpu' || s.side !== 'black' || s.winner) return;
    const t1 = window.setTimeout(() => {
      const cur = g.stateRef.current;
      if (!cur) return;
      const d = aiChooseDeploy(cur);
      if (d) g.deploy(d.handIndex, d.r, d.c);
    }, 1100);
    const t2 = window.setTimeout(() => {
      const cur = g.stateRef.current;
      if (!cur) return;
      const m = aiChooseMove(cur);
      if (m) g.move(m.pieceId, m.r, m.c);
    }, 2150);
    const t3 = window.setTimeout(() => g.end(), 3100);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s?.ply, s?.mode, s?.side, s?.winner, g.deploy, g.move, g.end]);

  /* ---------- tastiera ---------- */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (e.key === 'Escape') {
        setShowRules((v) => !v);
        return;
      }
      if (e.key === 'Enter' || e.key === ' ') {
        // evita il doppio "fine turno" se un bottone ha il focus
        if (tag === 'BUTTON' || tag === 'INPUT') return;
        const cur = g.stateRef.current;
        if (!cur || cur.winner) return;
        const human = cur.mode === '2p' || cur.side === 'white';
        if (human && !showRules) {
          e.preventDefault();
          g.end();
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [g.stateRef, g.end, showRules]);

  const toggleMute = () => {
    initAudio();
    setMutedState((m) => {
      setMuted(!m);
      return !m;
    });
    sfx.click();
  };

  /* ---------- menu iniziale ---------- */
  if (!s) {
    return (
      <div className="relative h-full overflow-y-auto">
        <StartScreen onStart={g.start} onRules={() => setShowRules(true)} />
        {showRules && <RulesModal onClose={() => setShowRules(false)} />}
      </div>
    );
  }

  const interactive = !s.winner && (s.mode === '2p' || s.side === 'white');

  const handleSquare = (r: number, c: number) => {
    const cur = g.stateRef.current;
    if (!cur || cur.winner) return;
    const human = cur.mode === '2p' || cur.side === 'white';
    if (!human) return;

    const p = pieceAt(cur, r, c);

    // modalità schieramento: zona propria e casa libera
    if (cur.selectedHandIndex != null && !cur.deployUsed && !p && zoneRows(cur.side).includes(r)) {
      g.deploy(cur.selectedHandIndex, r, c);
      return;
    }

    // pezzo proprio: seleziona / deseleziona
    if (p && p.side === cur.side) {
      g.selectPiece(cur.selectedPieceId === p.id ? null : p.id);
      return;
    }

    // casa nemica o vuota con pezzo selezionato: prova mossa/attacco
    if (cur.selectedPieceId != null) {
      g.move(cur.selectedPieceId, r, c);
      return;
    }

    if (p) g.selectPiece(null);
  };

  const handleHand = (i: number) => {
    const cur = g.stateRef.current;
    if (!cur || !interactive || cur.deployUsed) return;
    g.selectHand(i === -1 ? null : i);
  };

  const handleEnd = () => {
    if (interactive) g.end();
  };

  return (
    <div className="board-checker relative flex h-full min-h-0 flex-col overflow-hidden">
      {/* barra superiore */}
      <header className="flex h-12 shrink-0 items-center justify-between gap-2 border-b border-gold/15 bg-pit/85 px-3 sm:px-4">
        <div className="flex items-center gap-2">
          <PieceIcon type="king" side="white" className="h-7 w-7" />
          <span className="hidden font-display text-sm font-black tracking-[0.22em] text-gold sm:block">SCACCHI VITALI</span>
        </div>

        <div className="flex items-center gap-2 rounded-sm border border-gold/20 bg-black/30 px-3 py-1">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.side === 'white' ? '#efe6cf' : '#241a17', border: `2px solid ${s.side === 'white' ? '#e9b44c' : '#e0525f'}` }} />
          <span className="font-display text-xs font-bold tracking-[0.16em] text-parchment">
            TURNO {Math.ceil(s.ply / 2)} · {sideName(s.side).toUpperCase()}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button type="button" onClick={toggleMute} title={muted ? 'Riattiva audio' : 'Silenzia'} className="cursor-pointer rounded-sm border border-gold/25 p-1.5 text-sage transition-colors hover:border-gold hover:text-goldhi">
            <IconSound className="h-4 w-4" muted={muted} />
          </button>
          <button type="button" onClick={() => setShowRules(true)} title="Regole" className="cursor-pointer rounded-sm border border-gold/25 p-1.5 text-sage transition-colors hover:border-gold hover:text-goldhi">
            <IconHelp className="h-4 w-4" />
          </button>
          <button type="button" onClick={g.toMenu} title="Torna al menu" className="cursor-pointer rounded-sm border border-gold/25 p-1.5 text-sage transition-colors hover:border-gold hover:text-goldhi">
            <IconFlag className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* area di gioco */}
      <main className="flex min-h-0 flex-1 flex-col items-center gap-3 overflow-y-auto p-3 lg:flex-row lg:justify-center lg:gap-6 lg:overflow-visible lg:p-5">
        <div className="flex w-[min(94vw,calc(100dvh-205px),600px)] shrink-0 flex-col gap-2">
          <PlayerStrip state={s} side="black" />
          <div className="relative">
            <Board state={s} interactive={interactive} onSquareClick={handleSquare} />
            {!s.winner && <TurnBanner state={s} />}
          </div>
          <PlayerStrip state={s} side="white" />
        </div>

        <div className="w-full max-w-[600px] pb-4 lg:w-[324px] lg:max-w-none lg:pb-0">
          <Panel state={s} interactive={interactive} onHandClick={handleHand} onEndTurn={handleEnd} />
        </div>
      </main>

      {s.winner && <GameOverOverlay state={s} onRematch={() => g.start(s.mode)} onMenu={g.toMenu} />}
      {showRules && <RulesModal onClose={() => setShowRules(false)} />}
    </div>
  );
}
