import type { GameState, PieceType, Side } from '../game/types';
import { DEFS, HAND_LIMIT, LOOT_GOAL } from '../game/types';
import { sideName } from '../game/engine';
import { PieceIcon } from './PieceIcon';
import { HpPips, IconBag, IconHeart, IconHourglass, IconSword } from './icons';

const sideAccent = (side: Side) => (side === 'white' ? '#e9b44c' : '#e0525f');

/* ---------------- barra giocatore ---------------- */

export function PlayerStrip({ state, side }: { state: GameState; side: Side }) {
  const loot = state.loot[side];
  const pct = Math.min(100, (loot / LOOT_GOAL) * 100);
  const inField = state.pieces.filter((p) => p.side === side).length;
  const active = state.side === side && !state.winner;
  const accent = sideAccent(side);

  return (
    <div
      className="flex w-full items-center gap-3 rounded-md border px-3 py-2 transition-all duration-300"
      style={{
        borderColor: active ? `${accent}66` : 'rgba(233,180,76,0.12)',
        background: active ? 'rgba(22,40,31,0.9)' : 'rgba(14,26,21,0.75)',
        boxShadow: active ? `0 0 18px ${accent}22` : 'none',
      }}
    >
      <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: side === 'white' ? '#efe6cf' : '#241a17', border: `2px solid ${accent}` }} />
      <span className="font-display text-sm font-bold tracking-wider" style={{ color: active ? accent : '#efe6cf' }}>
        {sideName(side).toUpperCase()}
        {state.mode === 'cpu' && side === 'black' ? ' · CPU' : ''}
      </span>
      {active && <span className="anim-pulse-soft text-[10px] font-bold uppercase tracking-widest" style={{ color: accent }}>gioca</span>}

      {/* bottino */}
      <div className="ml-1 min-w-0 flex-1">
        <div className="flex items-baseline justify-between">
          <span className="text-[9px] font-bold uppercase tracking-widest text-sage">Bottino</span>
          <span className="font-display text-xs font-bold" style={{ color: accent }}>
            {loot}<span className="text-sage">/{LOOT_GOAL}</span>
          </span>
        </div>
        <div className="mt-0.5 h-1.5 overflow-hidden rounded-full bg-black/50">
          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${accent}88, ${accent})`, boxShadow: `0 0 8px ${accent}88` }} />
        </div>
      </div>

      {/* sacco e campo */}
      <span className="flex items-center gap-1 text-xs text-sage" title="Pezzi nel sacco">
        <IconBag className="h-4 w-4" />
        <b className="font-display text-parchment">{state.bags[side].length}</b>
      </span>
      <span className="hidden items-center gap-1 text-xs text-sage sm:flex" title="Pezzi in campo">
        <IconSword className="h-4 w-4" />
        <b className="font-display text-parchment">{inField}</b>
      </span>

      {/* mano avversaria coperta */}
      <span className="flex items-center gap-[3px]" title="Carte in mano">
        {Array.from({ length: state.hands[side].length }).map((_, i) => (
          <span key={i} className="h-4 w-3 rounded-[2px]" style={{ background: side === 'white' ? 'rgba(233,180,76,0.35)' : 'rgba(224,82,95,0.3)', border: `1px solid ${accent}66` }} />
        ))}
      </span>
    </div>
  );
}

/* ---------------- carta in mano ---------------- */

function HandCard({ type, side, selected, disabled, onClick, delay }: {
  type: PieceType;
  side: Side;
  selected: boolean;
  disabled: boolean;
  onClick: () => void;
  delay: number;
}) {
  const def = DEFS[type];
  const accent = sideAccent(side);
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`anim-card-in group relative w-[72px] shrink-0 rounded-md border px-1 pb-1.5 pt-1 text-center transition-all duration-200 sm:w-[78px] ${
        disabled ? 'cursor-not-allowed opacity-40' : 'cursor-pointer hover:-translate-y-1.5'
      }`}
      style={{
        animationDelay: `${delay}ms`,
        borderColor: selected ? '#f7d98b' : 'rgba(233,180,76,0.2)',
        background: selected ? 'rgba(44,82,64,0.9)' : 'rgba(22,40,31,0.85)',
        boxShadow: selected ? '0 0 16px rgba(247,217,139,0.35), 0 6px 14px rgba(0,0,0,0.4)' : '0 3px 8px rgba(0,0,0,0.35)',
      }}
      title={`${def.label} — ${def.desc}`}
    >
      <PieceIcon type={type} side={side} className="mx-auto h-10 w-10 drop-shadow-[0_3px_3px_rgba(0,0,0,0.5)] transition-transform duration-200 group-hover:scale-110" />
      <span className="mt-0.5 block font-display text-[10px] font-bold leading-tight tracking-wide text-parchment">{def.label}</span>
      <HpPips hp={def.hp} maxHp={def.hp} side={side} className="mt-1 justify-center" />
      <span className="mt-1 flex items-center justify-center gap-1.5 text-[9px] font-bold">
        <span className="rounded-sm px-1 py-px" style={{ background: `${accent}22`, color: accent }}>VAL {def.value}</span>
        <span className="flex items-center gap-0.5 text-sage">
          <IconSword className="h-2.5 w-2.5" />
          {def.atk}
        </span>
      </span>
      {selected && (
        <span className="absolute -top-2 left-1/2 -translate-x-1/2 rounded-sm bg-gold px-1.5 py-px font-display text-[8px] font-black tracking-widest text-abyss">
          SCHIERA
        </span>
      )}
    </button>
  );
}

/* ---------------- pannello di turno ---------------- */

interface PanelProps {
  state: GameState;
  interactive: boolean;
  onHandClick: (i: number) => void;
  onEndTurn: () => void;
}

export function Panel({ state, interactive, onHandClick, onEndTurn }: PanelProps) {
  const side = state.side;
  const hand = state.hands[side];
  const isCpuTurn = state.mode === 'cpu' && side === 'black';
  const bothUsed = state.deployUsed && state.moveUsed;
  const accent = sideAccent(side);

  return (
    <div className="flex w-full flex-col gap-3">
      {/* mano */}
      <div className="rounded-md border border-gold/15 bg-pit/85 p-3">
        <div className="mb-2 flex items-center justify-between">
          <span className="font-display text-[11px] font-bold tracking-[0.2em]" style={{ color: accent }}>
            MANO · {sideName(side).toUpperCase()}
          </span>
          <span className="text-[10px] font-bold text-sage">{hand.length}/{HAND_LIMIT}</span>
        </div>

        {isCpuTurn ? (
          <div className="flex min-h-[108px] items-center justify-center gap-2">
            {Array.from({ length: Math.max(hand.length, 1) }).map((_, i) => (
              <span key={i} className="h-14 w-10 rounded-md border border-ember/40 bg-blood/25" style={{ backgroundImage: 'repeating-linear-gradient(45deg, rgba(224,82,95,0.12) 0 4px, transparent 4px 8px)' }} />
            ))}
            <span className="thought-dots ml-2 flex gap-1 text-ember">
              <span className="thinking-dot inline-block h-1.5 w-1.5 rounded-full bg-ember" />
              <span className="thinking-dot inline-block h-1.5 w-1.5 rounded-full bg-ember" />
              <span className="thinking-dot inline-block h-1.5 w-1.5 rounded-full bg-ember" />
            </span>
          </div>
        ) : hand.length === 0 ? (
          <div className="flex min-h-[108px] flex-col items-center justify-center gap-1 text-sage">
            <IconHourglass className="h-6 w-6 opacity-60" />
            <span className="text-xs font-semibold">Riserva vuota: comanda i pezzi in campo.</span>
          </div>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {hand.map((t, i) => (
              <HandCard
                key={`${i}-${t}`}
                type={t}
                side={side}
                selected={state.selectedHandIndex === i}
                disabled={!interactive || state.deployUsed || !!state.winner}
                onClick={() => onHandClick(state.selectedHandIndex === i ? -1 : i)}
                delay={i * 45}
              />
            ))}
          </div>
        )}
      </div>

      {/* azioni del turno */}
      <div className="rounded-md border border-gold/15 bg-pit/85 p-3">
        <div className="mb-2 font-display text-[11px] font-bold tracking-[0.2em] text-sage">AZIONI DEL TURNO</div>
        <div className="grid grid-cols-3 gap-1.5 text-center">
          <ActionChip label="Pesca" done={!!state.turnDrawn || state.bags[side].length === 0} detail={state.turnDrawn ? DEFS[state.turnDrawn].label : state.bags[side].length === 0 ? 'sacco vuoto' : '—'} />
          <ActionChip label="Schiera" done={state.deployUsed} detail={state.deployUsed ? 'fatto' : 'libera'} />
          <ActionChip label="Mossa" done={state.moveUsed} detail={state.moveUsed ? 'fatto' : 'libera'} />
        </div>

        <button
          type="button"
          onClick={onEndTurn}
          disabled={!interactive}
          className={`mt-3 w-full rounded-md py-3 font-display text-base font-black tracking-[0.18em] transition-all duration-200 ${
            interactive
              ? bothUsed
                ? 'anim-pulse-soft cursor-pointer bg-gold text-abyss hover:bg-goldhi active:scale-[0.98]'
                : 'cursor-pointer border border-gold/60 bg-gold/15 text-gold hover:bg-gold/25 active:scale-[0.98]'
              : 'cursor-not-allowed border border-gold/10 bg-black/30 text-sage/60'
          }`}
        >
          {isCpuTurn ? 'LA CPU STA PENSANDO' : 'FINE TURNO'}
        </button>
        <p className="mt-1.5 text-center text-[10px] leading-snug text-sage/80">
          {interactive
            ? bothUsed
              ? 'Tutto fatto: passa la mano.'
              : 'Scegli una carta e clicca nella tua zona, oppure muovi un pezzo.'
            : state.winner
              ? 'La partita è conclusa.'
              : 'Attendi il turno avversario.'}
        </p>
      </div>

      {/* cronaca */}
      <div className="rounded-md border border-gold/15 bg-pit/85 p-3">
        <div className="mb-1.5 font-display text-[11px] font-bold tracking-[0.2em] text-sage">CRONACA</div>
        <ul className="flex flex-col gap-1">
          {[...state.log].reverse().slice(0, 5).map((line, i) => (
            <li key={`${state.log.length}-${i}`} className={`text-[11px] leading-snug ${i === 0 ? 'font-semibold text-parchment' : 'text-sage/75'}`}>
              <span className="mr-1 text-gold/70">◆</span>
              {line}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function ActionChip({ label, done, detail }: { label: string; done: boolean; detail: string }) {
  return (
    <div
      className="rounded-sm border px-1 py-1.5 transition-colors duration-300"
      style={{
        borderColor: done ? 'rgba(126,168,143,0.35)' : 'rgba(233,180,76,0.35)',
        background: done ? 'rgba(126,168,143,0.08)' : 'rgba(233,180,76,0.07)',
      }}
    >
      <div className={`text-[9px] font-bold uppercase tracking-widest ${done ? 'text-sage' : 'text-gold'}`}>{label}</div>
      <div className="mt-0.5 flex items-center justify-center gap-1 text-[10px] font-bold text-parchment/90">
        {done && (
          <svg viewBox="0 0 24 24" className="h-3 w-3 text-sage" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="m4 12 5 5L20 7" />
          </svg>
        )}
        {detail}
      </div>
    </div>
  );
}

/* ---------------- legenda pezzi (menu iniziale) ---------------- */

export function PieceLegend() {
  const order: PieceType[] = ['pawn', 'knight', 'bishop', 'rook', 'queen', 'king'];
  return (
    <div className="flex flex-wrap items-stretch justify-center gap-2">
      {order.map((t, i) => {
        const d = DEFS[t];
        return (
          <div
            key={t}
            className="anim-card-in group w-[92px] rounded-md border border-gold/20 bg-pine/80 px-2 pb-2 pt-1.5 text-center transition-all duration-200 hover:-translate-y-1 hover:border-gold/60"
            style={{ animationDelay: `${i * 80}ms` }}
            title={d.desc}
          >
            <PieceIcon type={t} side="white" className="mx-auto h-11 w-11 drop-shadow-[0_3px_4px_rgba(0,0,0,0.6)] transition-transform duration-200 group-hover:scale-110" />
            <div className="font-display text-[11px] font-bold tracking-wide text-parchment">{d.label}</div>
            <div className="mt-1 flex items-center justify-center gap-1.5 text-[9px] font-bold">
              <span className="text-gold">VAL {d.value}</span>
              <span className="flex items-center gap-0.5 text-ember">
                <IconHeart className="h-2.5 w-2.5" />
                {d.hp}
              </span>
              <span className="flex items-center gap-0.5 text-sage">
                <IconSword className="h-2.5 w-2.5" />
                {d.atk}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
