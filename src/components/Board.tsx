import { useEffect, useMemo, useRef, useState } from 'react';
import type { GameState } from '../game/types';
import { DEFS } from '../game/types';
import { canAct, FILES, genMoves, legalDeploy } from '../game/engine';
import { fxBus } from '../fx';
import type { FxMessage } from '../fx';
import { PieceIcon } from './PieceIcon';
import { HpPips } from './icons';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  ttl: number;
  size: number;
  color: string;
  grav: number;
}

interface FloatText {
  id: number;
  x: number;
  y: number;
  text: string;
  color: string;
  size: number;
}

interface Props {
  state: GameState;
  interactive: boolean;
  onSquareClick: (r: number, c: number) => void;
}

export function Board({ state, interactive, onSquareClick }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const particles = useRef<Particle[]>([]);
  const [floats, setFloats] = useState<FloatText[]>([]);
  const floatId = useRef(0);

  /* ---------- particelle ---------- */
  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    let ambient = 0;

    const spawnBurst = (xPct: number, yPct: number, color: string, count: number, power: number) => {
      const cv = canvasRef.current;
      if (!cv) return;
      const x = (xPct / 100) * cv.clientWidth;
      const y = (yPct / 100) * cv.clientHeight;
      for (let i = 0; i < count; i++) {
        const a = Math.random() * Math.PI * 2;
        const sp = (1.2 + Math.random() * 3.4) * power;
        particles.current.push({
          x,
          y,
          vx: Math.cos(a) * sp,
          vy: Math.sin(a) * sp - 0.8 * power,
          life: 0,
          ttl: 0.5 + Math.random() * 0.55,
          size: 1.5 + Math.random() * 3,
          color,
          grav: 6.5,
        });
      }
      if (particles.current.length > 900) particles.current.splice(0, particles.current.length - 900);
    };

    const onMsg = (m: FxMessage) => {
      if (m.kind === 'burst') spawnBurst(m.x, m.y, m.color, m.count, m.power);
      else if (m.kind === 'confetti') {
        const cv = canvasRef.current;
        if (!cv) return;
        const colors = ['#f7d98b', '#e9b44c', '#efe6cf', '#e0525f', '#7ea88f'];
        for (let i = 0; i < 7; i++) {
          spawnBurst(8 + Math.random() * 84, 8 + Math.random() * 55, colors[i % colors.length], 22, 1.7);
        }
      } else if (m.kind === 'float') {
        const id = ++floatId.current;
        setFloats((f) => [...f, { id, x: m.x, y: m.y, text: m.text, color: m.color, size: m.size ?? 1 }]);
        window.setTimeout(() => setFloats((f) => f.filter((t) => t.id !== id)), 1000);
      } else if (m.kind === 'shake') {
        const el = wrapRef.current;
        if (el) {
          el.style.animation = 'none';
          void el.offsetWidth;
          el.style.animation = `kf-shake ${0.32 + m.power * 0.12}s ease-in-out`;
        }
      }
    };

    const off = fxBus.on(onMsg);

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const cv = canvasRef.current;
      if (!cv) return;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const w = cv.clientWidth;
      const h = cv.clientHeight;
      if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) {
        cv.width = Math.round(w * dpr);
        cv.height = Math.round(h * dpr);
      }
      const ctx = cv.getContext('2d');
      if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      // pulviscolo ambientale
      ambient += dt;
      if (ambient > 0.55 && particles.current.length < 120) {
        ambient = 0;
        particles.current.push({
          x: Math.random() * w,
          y: h * (0.4 + Math.random() * 0.6),
          vx: (Math.random() - 0.5) * 4,
          vy: -6 - Math.random() * 8,
          life: 0,
          ttl: 2.2 + Math.random() * 1.5,
          size: 0.8 + Math.random() * 1.4,
          color: 'rgba(233,180,76,0.5)',
          grav: -1.5,
        });
      }

      ctx.globalCompositeOperation = 'lighter';
      const alive: Particle[] = [];
      for (const p of particles.current) {
        p.life += dt;
        if (p.life >= p.ttl) continue;
        p.vy += p.grav * dt * 6;
        p.x += p.vx * dt * 30;
        p.y += p.vy * dt * 30;
        const t = 1 - p.life / p.ttl;
        ctx.globalAlpha = t * 0.9;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (0.5 + t * 0.7), 0, Math.PI * 2);
        ctx.fill();
        alive.push(p);
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
      particles.current = alive;
    };
    raf = requestAnimationFrame(tick);
    return () => {
      off();
      cancelAnimationFrame(raf);
    };
  }, []);

  /* ---------- logica evidenziazioni ---------- */
  const selPiece = state.pieces.find((p) => p.id === state.selectedPieceId) ?? null;
  const moves = useMemo(() => {
    if (!selPiece || !interactive || state.moveUsed || !canAct(state, selPiece)) return [];
    return genMoves(state, selPiece);
  }, [state, selPiece, interactive]);

  const moveMap = useMemo(() => {
    const m = new Map<string, { kind: 'move' | 'attack' }>();
    for (const o of moves) m.set(`${o.r},${o.c}`, { kind: o.kind });
    return m;
  }, [moves]);

  const deployMode = interactive && state.selectedHandIndex != null && !state.deployUsed && !state.winner;
  const deploySet = useMemo(() => {
    const s = new Set<string>();
    if (deployMode) for (const [r, c] of legalDeploy(state, state.side)) s.add(`${r},${c}`);
    return s;
  }, [deployMode, state]);

  const last = state.lastMove;

  return (
    <div ref={wrapRef} className="relative w-full rounded-md p-[10px] anim-glow bg-pit" style={{ border: '1px solid rgba(233,180,76,0.3)' }}>
      <div className="relative aspect-square w-full overflow-hidden rounded-sm" style={{ boxShadow: 'inset 0 0 40px rgba(0,0,0,0.55)' }}>
        {/* caselle */}
        <div className="absolute inset-0 grid grid-cols-8 grid-rows-8">
          {Array.from({ length: 64 }).map((_, i) => {
            const r = Math.floor(i / 8);
            const c = i % 8;
            const key = `${r},${c}`;
            const light = (r + c) % 2 === 0;
            const mv = moveMap.get(key);
            const isSel = selPiece?.r === r && selPiece?.c === c;
            const isLast = last && ((last.fromR === r && last.fromC === c) || (last.toR === r && last.toC === c));
            const isDeploy = deploySet.has(key);
            const clickable = interactive && (mv || isDeploy || !!state.pieces.find((p) => p.r === r && p.c === c));
            return (
              <button
                key={i}
                type="button"
                onClick={() => onSquareClick(r, c)}
                className={`relative m-0 border-0 p-0 outline-none transition-colors duration-150 ${clickable ? 'cursor-pointer hover:brightness-125' : 'cursor-default'}`}
                style={{ background: light ? '#3b6151' : '#29463a', gridColumn: c + 1, gridRow: r + 1 }}
              >
                {isLast && <span className="absolute inset-0" style={{ background: 'rgba(233,180,76,0.16)' }} />}
                {isDeploy && (
                  <span className="absolute inset-[6%] rounded-sm anim-pulse-soft" style={{ border: '2px dashed rgba(247,217,139,0.75)', background: 'rgba(233,180,76,0.08)' }} />
                )}
                {isSel && <span className="absolute inset-0" style={{ boxShadow: 'inset 0 0 0 3px #f7d98b, inset 0 0 22px rgba(247,217,139,0.35)' }} />}
                {mv?.kind === 'move' && (
                  <span className="absolute left-1/2 top-1/2 h-[22%] w-[22%] -translate-x-1/2 -translate-y-1/2 rounded-full" style={{ background: 'rgba(247,217,139,0.8)', boxShadow: '0 0 12px rgba(233,180,76,0.8)' }} />
                )}
                {mv?.kind === 'attack' && (
                  <span className="absolute inset-[8%] rounded-sm anim-pulse-soft" style={{ border: '3px solid #e0525f', boxShadow: '0 0 14px rgba(224,82,95,0.7), inset 0 0 14px rgba(224,82,95,0.3)' }} />
                )}
                {/* coordinate */}
                {r === 7 && (
                  <span className="pointer-events-none absolute bottom-[2%] right-[5%] font-body text-[9px] font-bold sm:text-[10px]" style={{ color: light ? 'rgba(20,40,30,0.65)' : 'rgba(239,230,207,0.4)' }}>
                    {FILES[c]}
                  </span>
                )}
                {c === 0 && (
                  <span className="pointer-events-none absolute left-[5%] top-[2%] font-body text-[9px] font-bold sm:text-[10px]" style={{ color: light ? 'rgba(20,40,30,0.65)' : 'rgba(239,230,207,0.4)' }}>
                    {8 - r}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* pezzi */}
        <div className="pointer-events-none absolute inset-0">
          {state.pieces.map((p) => {
            const justSpawned = p.bornPly === state.ply;
            const selected = selPiece?.id === p.id;
            const fresh = justSpawned && p.side === state.side;
            return (
              <div
                key={p.id}
                className="absolute transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
                style={{ width: '12.5%', height: '12.5%', transform: `translate(${p.c * 100}%, ${p.r * 100}%)`, zIndex: selected ? 30 : 10 }}
              >
                <div className="anim-spawn relative h-full w-full">
                  {justSpawned && <span className="anim-ring absolute inset-[8%] rounded-full" style={{ border: `3px solid ${p.side === 'white' ? '#f7d98b' : '#e0525f'}` }} />}
                  {selected && <span className="absolute inset-[4%] rounded-full" style={{ background: 'radial-gradient(circle, rgba(247,217,139,0.28) 0%, transparent 70%)' }} />}
                  <PieceIcon
                    type={p.type}
                    side={p.side}
                    className="h-full w-full"
                  />
                  {fresh && (
                    <span className="anim-pulse-soft absolute right-[16%] top-[14%] h-[9%] w-[9%] rounded-full" style={{ background: '#e9b44c', boxShadow: '0 0 8px rgba(233,180,76,0.9)' }} title="Appena schierato" />
                  )}
                  <span className="absolute bottom-[4%] left-1/2 -translate-x-1/2">
                    <HpPips hp={p.hp} maxHp={p.maxHp} side={p.side} />
                  </span>
                  <span className="sr-only">{`${DEFS[p.type].label} ${p.side === 'white' ? 'bianco' : 'nero'}, ${p.hp} HP`}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* particelle */}
        <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 h-full w-full" style={{ zIndex: 40 }} />

        {/* numeri fluttuanti */}
        <div className="pointer-events-none absolute inset-0" style={{ zIndex: 50 }}>
          {floats.map((f) => (
            <span
              key={f.id}
              className="anim-float-up absolute font-display font-black"
              style={{
                left: `${f.x}%`,
                top: `${f.y}%`,
                color: f.color,
                fontSize: `calc(0.9rem + ${f.size} * 0.55vw)`,
                textShadow: '0 2px 8px rgba(0,0,0,0.9), 0 0 14px rgba(0,0,0,0.6)',
              }}
            >
              {f.text}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
