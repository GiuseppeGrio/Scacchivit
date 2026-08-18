import type { GameState, PieceType, Side } from '../game/types';
import { DEFS, LOOT_GOAL } from '../game/types';
import { sideName } from '../game/engine';
import { PieceIcon } from './PieceIcon';
import { PieceLegend } from './Panel';
import { IconFlag, IconHeart, IconSword } from './icons';

/* ---------------- banner di turno ---------------- */

export function TurnBanner({ state }: { state: GameState }) {
  const accent = state.side === 'white' ? '#f7d98b' : '#e0525f';
  return (
    <div key={state.ply} className="pointer-events-none absolute inset-0 z-[60] flex items-center justify-center">
      <div className="anim-banner text-center">
        <div className="font-display text-[11px] font-bold tracking-[0.5em] text-sage">TURNO {Math.ceil(state.ply / 2)}</div>
        <div className="font-display text-4xl font-black tracking-[0.18em] sm:text-5xl" style={{ color: accent, textShadow: '0 4px 24px rgba(0,0,0,0.85)' }}>
          {sideName(state.side).toUpperCase()}
        </div>
      </div>
    </div>
  );
}

/* ---------------- menu iniziale ---------------- */

interface StartProps {
  onStart: (mode: 'cpu' | '2p') => void;
  onRules: () => void;
}

const FLOATERS: Array<{ type: PieceType; side: Side; cls: string; delay: string }> = [
  { type: 'queen', side: 'black', cls: 'left-[6%] top-[12%] h-24 w-24 opacity-[0.13]', delay: '0s' },
  { type: 'knight', side: 'white', cls: 'right-[8%] top-[18%] h-20 w-20 opacity-[0.12]', delay: '-2.4s' },
  { type: 'rook', side: 'black', cls: 'left-[12%] bottom-[14%] h-20 w-20 opacity-[0.12]', delay: '-4.1s' },
  { type: 'king', side: 'white', cls: 'right-[10%] bottom-[10%] h-28 w-28 opacity-[0.14]', delay: '-1.2s' },
  { type: 'bishop', side: 'white', cls: 'left-[45%] top-[6%] h-14 w-14 opacity-[0.09]', delay: '-5.5s' },
];

export function StartScreen({ onStart, onRules }: StartProps) {
  return (
    <div className="board-checker relative flex min-h-full flex-col items-center justify-center overflow-hidden px-4 py-8">
      <div className="pointer-events-none absolute inset-0" style={{ background: 'radial-gradient(90% 70% at 50% 30%, transparent 0%, rgba(7,13,11,0.9) 100%)' }} />
      {FLOATERS.map((f, i) => (
        <div key={i} className={`anim-bob pointer-events-none absolute ${f.cls}`} style={{ animationDelay: f.delay }}>
          <PieceIcon type={f.type} side={f.side} className="h-full w-full" />
        </div>
      ))}

      <div className="relative z-10 flex w-full max-w-3xl flex-col items-center text-center">
        <div className="mb-3 flex items-center gap-3 text-gold/70">
          <span className="h-px w-14 bg-gold/40" />
          <IconFlag className="h-4 w-4" />
          <span className="h-px w-14 bg-gold/40" />
        </div>
        <p className="font-body text-[11px] font-bold uppercase tracking-[0.45em] text-sage">Il gioco dove ogni pezzo ha un prezzo</p>

        <h1 className="mt-3 font-display leading-[0.95]">
          <span className="block text-5xl font-black tracking-[0.08em] text-parchment sm:text-7xl" style={{ textShadow: '0 6px 30px rgba(0,0,0,0.8)' }}>
            SCACCHI
          </span>
          <span className="block text-5xl font-black tracking-[0.22em] text-gold sm:text-7xl" style={{ textShadow: '0 0 34px rgba(233,180,76,0.45), 0 6px 30px rgba(0,0,0,0.8)' }}>
            VITALI
          </span>
        </h1>

        <p className="mt-4 max-w-xl text-sm leading-relaxed text-parchment/80 sm:text-[15px]">
          Ogni turno <b className="text-goldhi">peschi un pezzo dal sacco</b> e lo schieri in campo. Nessuna cattura istantanea:
          ogni colpo toglie HP, e chi sopravvive <b className="text-ember">risponde con la rappresaglia</b>.
          Più il pezzo è prezioso, <i>meno sangue ha in corpo</i>.
        </p>

        <div className="mt-6 w-full">
          <PieceLegend />
        </div>

        <div className="mt-7 flex flex-col items-center gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => onStart('cpu')}
            className="group relative w-64 cursor-pointer overflow-hidden rounded-md bg-gold px-6 py-3.5 font-display text-base font-black tracking-[0.14em] text-abyss transition-all duration-200 hover:bg-goldhi hover:shadow-[0_0_30px_rgba(233,180,76,0.4)] active:scale-[0.97]"
          >
            SFIDA IL COMPUTER
            <span className="absolute inset-x-0 bottom-0 h-0.5 bg-abyss/30" />
          </button>
          <button
            type="button"
            onClick={() => onStart('2p')}
            className="w-64 cursor-pointer rounded-md border border-gold/50 bg-gold/5 px-6 py-3.5 font-display text-base font-black tracking-[0.14em] text-gold transition-all duration-200 hover:border-gold hover:bg-gold/15 active:scale-[0.97]"
          >
            DUE GIOCATORI
          </button>
        </div>

        <button type="button" onClick={onRules} className="mt-4 cursor-pointer text-xs font-bold uppercase tracking-[0.25em] text-sage underline decoration-sage/40 underline-offset-4 transition-colors hover:text-goldhi">
          Come si gioca
        </button>

        <p className="mt-6 text-[11px] text-sage/70">
          Vinci con <b className="text-ember">il regicidio</b> oppure accumulando <b className="text-gold">{LOOT_GOAL} punti di bottino</b>.
        </p>
      </div>
    </div>
  );
}

/* ---------------- regole ---------------- */

const RULE_ORDER: PieceType[] = ['pawn', 'knight', 'bishop', 'rook', 'queen', 'king'];

export function RulesModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="absolute inset-0 z-[80] flex items-center justify-center bg-black/75 p-4 backdrop-blur-[3px]" onClick={onClose}>
      <div
        className="anim-card-in max-h-full w-full max-w-2xl overflow-y-auto rounded-md border border-gold/30 bg-pit p-5 shadow-[0_20px_70px_rgba(0,0,0,0.7)] sm:p-7"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <h2 className="font-display text-2xl font-black tracking-[0.12em] text-gold">LE REGOLE</h2>
          <button type="button" onClick={onClose} className="cursor-pointer rounded-sm border border-gold/30 px-2 py-1 text-xs font-bold text-sage transition-colors hover:border-gold hover:text-goldhi">
            CHIUDI ✕
          </button>
        </div>

        <div className="mt-4 grid gap-4 text-sm leading-relaxed text-parchment/85 sm:grid-cols-2">
          <section>
            <h3 className="font-display text-xs font-bold tracking-[0.2em] text-goldhi">LO SCOPO</h3>
            <p className="mt-1">
              Distruggi i pezzi nemici per fare bottino: ogni pezzo vale punti pari al suo VAL. Chi arriva prima a{' '}
              <b className="text-gold">{LOOT_GOAL} punti</b> vince. In alternativa, <b className="text-ember">abbatti il Re avversario</b>: regicidio, vittoria immediata.
            </p>
          </section>
          <section>
            <h3 className="font-display text-xs font-bold tracking-[0.2em] text-goldhi">IL TURNO</h3>
            <p className="mt-1">
              A ogni turno <b>peschi automaticamente</b> un pezzo dal sacco (mano max 5). Poi hai due azioni, una volta ciascuna:
              <b className="text-goldhi"> schierare</b> un pezzo dalla mano nella tua zona (le due traverse in fondo) e{' '}
              <b className="text-goldhi">muovere o attaccare</b> con un pezzo già in campo. Un pezzo appena schierato agisce dal turno dopo.
            </p>
          </section>
          <section>
            <h3 className="font-display text-xs font-bold tracking-[0.2em] text-goldhi">IL COMBATTIMENTO</h3>
            <p className="mt-1">
              Gli attacchi seguono le mosse degli scacchi: Alfieri, Torri e Regine <b>feriscono anche a distanza</b>. Il difensore perde HP pari all'ATT
              dell'assalitore; <b className="text-ember">se sopravvive, risponde</b> con la rappresaglia. Se crolla, l'assalitore occupa la casa.
            </p>
          </section>
          <section>
            <h3 className="font-display text-xs font-bold tracking-[0.2em] text-goldhi">SANGUE E VALORE</h3>
            <p className="mt-1">
              La regola d'oro: <b>più un pezzo vale, meno HP ha</b>. Il Pedone incassa 6 colpi, la Regina 3, il Re appena 2. Finché il tuo Re è in campo,
              tutti i tuoi alleati guadagnano <b className="text-goldhi">+1 ATT</b>… ma esporlo è rischioso. I Pedoni che raggiungono l'ultima traversa diventano Regine.
            </p>
          </section>
        </div>

        <div className="mt-5 overflow-x-auto rounded-md border border-gold/15">
          <table className="w-full min-w-[430px] text-left text-xs">
            <thead>
              <tr className="bg-pine/80 font-display text-[10px] tracking-[0.18em] text-sage">
                <th className="px-3 py-2 font-bold">PEZZO</th>
                <th className="px-2 py-2 font-bold">VAL</th>
                <th className="px-2 py-2 font-bold">HP</th>
                <th className="px-2 py-2 font-bold">ATT</th>
                <th className="px-3 py-2 font-bold">MOVIMENTO</th>
              </tr>
            </thead>
            <tbody>
              {RULE_ORDER.map((t) => {
                const d = DEFS[t];
                return (
                  <tr key={t} className="border-t border-gold/10 text-parchment/85">
                    <td className="flex items-center gap-2 px-3 py-1.5 font-bold text-parchment">
                      <PieceIcon type={t} side="white" className="h-7 w-7 shrink-0" />
                      {d.label}
                    </td>
                    <td className="px-2 py-1.5 font-bold text-gold">{t === 'king' ? '—' : d.value}</td>
                    <td className="px-2 py-1.5">
                      <span className="flex items-center gap-1 font-bold text-ember">
                        <IconHeart className="h-3 w-3" />
                        {d.hp}
                      </span>
                    </td>
                    <td className="px-2 py-1.5">
                      <span className="flex items-center gap-1 font-bold text-sage">
                        <IconSword className="h-3 w-3" />
                        {d.atk}
                      </span>
                    </td>
                    <td className="px-3 py-1.5 text-parchment/75">{d.desc}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <p className="mt-4 text-center text-[11px] text-sage/70">
          Se un giocatore resta senza pezzi in campo, in mano e nel sacco, è annientato: vince l'avversario.
        </p>
      </div>
    </div>
  );
}

/* ---------------- fine partita ---------------- */

const REASONS: Record<string, string> = {
  regicidio: 'Il Re è caduto: regicidio.',
  bottino: `Bottino di guerra completo: ${LOOT_GOAL} punti.`,
  annientamento: "L'esercito avversario è stato annientato.",
};

interface OverProps {
  state: GameState;
  onRematch: () => void;
  onMenu: () => void;
}

export function GameOverOverlay({ state, onRematch, onMenu }: OverProps) {
  if (!state.winner) return null;
  const w = state.winner;
  const humanLost = state.mode === 'cpu' && w.side === 'black';
  const title = state.mode === 'cpu' ? (humanLost ? 'SCONFITTA' : 'VITTORIA') : `VINCE IL ${sideName(w.side).toUpperCase()}`;
  const color = humanLost ? '#e0525f' : '#f7d98b';

  return (
    <div className="absolute inset-0 z-[70] flex items-center justify-center bg-black/70 p-4 backdrop-blur-[3px]">
      <div className="anim-card-in w-full max-w-md rounded-md border p-7 text-center shadow-[0_20px_80px_rgba(0,0,0,0.8)]" style={{ borderColor: `${color}55`, background: 'linear-gradient(180deg, rgba(22,40,31,0.97), rgba(14,26,21,0.97))' }}>
        <div className="mx-auto h-20 w-20 anim-pop">
          <PieceIcon type="king" side={w.side} className="h-full w-full drop-shadow-[0_6px_16px_rgba(0,0,0,0.7)]" />
        </div>
        <h2 className="mt-3 font-display text-4xl font-black tracking-[0.14em]" style={{ color, textShadow: `0 0 30px ${color}66` }}>
          {title}
        </h2>
        <p className="mt-1 text-sm text-parchment/80">{REASONS[w.reason] ?? w.reason}</p>

        <div className="mx-auto mt-5 grid max-w-xs grid-cols-3 gap-2 text-center">
          <StatBox label="Turni" value={String(Math.ceil(state.ply / 2))} />
          <StatBox label="Bianco" value={`${state.loot.white} pt`} accent="#e9b44c" />
          <StatBox label="Nero" value={`${state.loot.black} pt`} accent="#e0525f" />
        </div>

        <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
          <button type="button" onClick={onRematch} className="cursor-pointer rounded-md bg-gold px-6 py-3 font-display text-sm font-black tracking-[0.14em] text-abyss transition-all duration-200 hover:bg-goldhi hover:shadow-[0_0_24px_rgba(233,180,76,0.4)] active:scale-[0.97]">
            RIVINCITA
          </button>
          <button type="button" onClick={onMenu} className="cursor-pointer rounded-md border border-gold/50 px-6 py-3 font-display text-sm font-black tracking-[0.14em] text-gold transition-all duration-200 hover:bg-gold/10 active:scale-[0.97]">
            MENU
          </button>
        </div>
      </div>
    </div>
  );
}

function StatBox({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="rounded-sm border border-gold/15 bg-black/30 px-2 py-2">
      <div className="text-[9px] font-bold uppercase tracking-widest text-sage">{label}</div>
      <div className="mt-0.5 font-display text-base font-bold" style={{ color: accent ?? '#efe6cf' }}>
        {value}
      </div>
    </div>
  );
}
