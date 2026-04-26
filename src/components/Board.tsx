import { useEffect, useRef } from 'react';
import { GameState, CellValue } from '../types';
import { ADJ, RING, GRID_POS } from '../board';
import { eligibleCaptures, isFlying } from '../game';
import { GlyphX, GlyphO } from './Glyphs';

const BOARD_SIZE = 560;
const INSETS = [40, 130, 220] as const; // outer, middle, inner

interface PointCoord { cx: number; cy: number; ring: number; }

function pointCoords(): PointCoord[] {
  return Array.from({ length: 24 }, (_, i) => {
    const inset = INSETS[RING[i]];
    const span = BOARD_SIZE - inset * 2;
    const step = span / 2;
    const [gx, gy] = GRID_POS[i];
    return { cx: inset + step * gx, cy: inset + step * gy, ring: RING[i] };
  });
}

const POINTS = pointCoords();

function wobbleRect(inset: number, seed: number): string {
  const o = inset, s = BOARD_SIZE - inset * 2;
  const r = (n: number) => (Math.sin((seed + 1) * n * 1.7) * 1.6).toFixed(2);
  const x1 = o + +r(1),     y1 = o + +r(2);
  const x2 = o + s + +r(3), y2 = o + +r(4);
  const x3 = o + s + +r(5), y3 = o + s + +r(6);
  const x4 = o + +r(7),     y4 = o + s + +r(8);
  return `M ${x1 - 1.2} ${y1 + 0.4}
    Q ${(x1 + x2) / 2} ${y1 - 0.6}, ${x2} ${y2}
    Q ${x2 + 0.7} ${(y2 + y3) / 2}, ${x3} ${y3}
    Q ${(x3 + x4) / 2} ${y3 + 0.7}, ${x4} ${y4}
    Q ${x4 - 0.7} ${(y4 + y1) / 2}, ${x1 + 0.2} ${y1 + 0.6}`;
}

function buildEdges() {
  const seen = new Set<string>();
  const edges: { a: PointCoord; b: PointCoord }[] = [];
  for (let i = 0; i < 24; i++) {
    for (const j of ADJ[i]) {
      const k = i < j ? `${i}-${j}` : `${j}-${i}`;
      if (seen.has(k)) continue;
      seen.add(k);
      if (POINTS[i].ring === POINTS[j].ring) continue; // part of square perimeter
      edges.push({ a: POINTS[i], b: POINTS[j] });
    }
  }
  return edges;
}

const EDGES = buildEdges();

interface MillEllipseProps { pts: PointCoord[] }
function MillEllipse({ pts }: MillEllipseProps) {
  const a = pts[0], b = pts[2];
  const cx = (a.cx + b.cx) / 2;
  const cy = (a.cy + b.cy) / 2;
  const dx = b.cx - a.cx, dy = b.cy - a.cy;
  const ang = Math.atan2(dy, dx) * 180 / Math.PI;
  const len = Math.hypot(dx, dy);
  const rx = len / 2 + 30;
  const ry = 28;
  return (
    <g transform={`translate(${cx} ${cy}) rotate(${ang})`}>
      <g filter="url(#penWobbleRed)" stroke="var(--red)" strokeWidth="2.6" fill="none" strokeLinecap="round">
        <path d={
          `M ${-rx} 0
           C ${-rx} ${-ry * 1.1}, ${-rx * 0.4} ${-ry * 1.2}, 0 ${-ry}
           C ${rx * 0.5} ${-ry * 1.15}, ${rx} ${-ry * 0.6}, ${rx} 0
           C ${rx} ${ry * 1.1}, ${rx * 0.4} ${ry * 1.2}, 0 ${ry}
           C ${-rx * 0.5} ${ry * 1.15}, ${-rx * 1.02} ${ry * 0.6}, ${-rx - 2} 2`
        } />
      </g>
    </g>
  );
}

interface BoardProps {
  state: GameState;
  onPointClick: (i: number) => void;
  legalDests: number[];
  flashCapture: number | null;
  heatmap: boolean;
  hintMove: { to: number; from?: number } | null;
}

export function Board({ state, onPointClick, legalDests, flashCapture, heatmap, hintMove }: BoardProps) {
  const boardRef = useRef<HTMLDivElement>(null);
  const selected = state.selected_piece;
  const board = state.board;

  // Heatmap scores (CPU threat overlay)
  const heatPoints: Record<number, number> = {};
  if (heatmap) {
    for (let i = 0; i < 24; i++) {
      if (board[i] != null) continue;
      const b2 = board.slice() as CellValue[];
      b2[i] = 'O';
      let tCount = 0;
      let mCount = 0;
      for (const m of ([] as number[][]).concat(...[0, 1, 2].map(() => []))) { void m; }
      // Simple: count mills + threats for O
      from: for (const m of [[0,1,2],[2,3,4],[4,5,6],[6,7,0],[8,9,10],[10,11,12],[12,13,14],[14,15,8],[16,17,18],[18,19,20],[20,21,22],[22,23,16],[1,9,17],[3,11,19],[5,13,21],[7,15,23]]) {
        if (m.every(p => b2[p] === 'O')) mCount++;
        const mine = m.filter(p => b2[p] === 'O').length;
        const emp = m.filter(p => b2[p] == null).length;
        if (mine === 2 && emp === 1) tCount++;
      }
      heatPoints[i] = mCount * 0.7 + tCount * 0.35;
    }
    const max = Math.max(0.0001, ...Object.values(heatPoints));
    for (const k of Object.keys(heatPoints)) heatPoints[+k] /= max;
  }

  // Pieces eligible for capture this turn.
  // When it's the player's capture turn (turn='X') these are the O pieces they can remove.
  // When it's the AI's capture turn (turn='O') these are the X pieces at risk — shown for
  // information only; the cursor must NOT suggest they are clickable.
  const captureElig = state.awaiting_capture
    ? eligibleCaptures(board, state.turn === 'X' ? 'O' : 'X')
    : [];
  const playerCaptureMode = state.awaiting_capture && state.turn === 'X';

  // ARIA live region for screen reader announcements
  const lastNote = state.move_history[state.move_history.length - 1]?.notation ?? '';

  return (
    <div
      ref={boardRef}
      className="board-frame"
      role="region"
      aria-label="Malom játéktábla"
    >
      <div aria-live="polite" aria-atomic="true" className="sr-only">{lastNote}</div>
      <svg
        viewBox={`0 0 ${BOARD_SIZE} ${BOARD_SIZE}`}
        width="100%"
        style={{ display: 'block' }}
        aria-hidden="true"
      >
        {/* board grid texture */}
        <defs>
          <pattern id="boardGrid" width="20" height="20" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="0.9" fill="rgba(31,51,88,0.10)" />
          </pattern>
        </defs>
        <rect x="0" y="0" width={BOARD_SIZE} height={BOARD_SIZE} fill="url(#boardGrid)" />

        {/* heatmap halos */}
        {heatmap && Object.entries(heatPoints).map(([i, v]) => {
          if (v < 0.15) return null;
          const p = POINTS[+i];
          return (
            <circle key={`h-${i}`} cx={p.cx} cy={p.cy} r={20 + v * 10}
              fill={`rgba(184,69,58,${(v * 0.22).toFixed(3)})`} />
          );
        })}

        {/* concentric wobbly squares */}
        <g filter="url(#penWobble)" stroke="var(--navy)" strokeWidth="2.0" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path d={wobbleRect(INSETS[0], 1)} />
          <path d={wobbleRect(INSETS[1], 3)} />
          <path d={wobbleRect(INSETS[2], 5)} />
        </g>

        {/* spoke connector lines */}
        <g filter="url(#penWobble)" stroke="var(--navy)" strokeWidth="2.0" fill="none" strokeLinecap="round">
          {EDGES.map((e, idx) => {
            const mx = (e.a.cx + e.b.cx) / 2, my = (e.a.cy + e.b.cy) / 2;
            const dx = e.b.cx - e.a.cx, dy = e.b.cy - e.a.cy;
            const len = Math.hypot(dx, dy);
            const nx = -dy / len, ny = dx / len;
            const off = 1.2 * Math.sin(idx * 2.1);
            return (
              <path key={idx}
                d={`M ${e.a.cx} ${e.a.cy} Q ${mx + nx * off} ${my + ny * off}, ${e.b.cx} ${e.b.cy}`}
              />
            );
          })}
        </g>

        {/* mill highlight ellipses */}
        {state.mills_highlighted.map((mill, i) => {
          const pts = mill.map(id => POINTS[id]);
          return <MillEllipse key={`m-${i}`} pts={pts} />;
        })}

        {/* empty intersection dots */}
        {POINTS.map((p, i) => {
          if (board[i] != null) return null;
          const isLegal = legalDests.includes(i);
          const isHint = hintMove && hintMove.to === i && board[i] == null;
          return (
            <g key={`d-${i}`}>
              {isLegal && (
                <circle cx={p.cx} cy={p.cy} r="14"
                  fill="none" stroke="var(--red)" strokeOpacity="0.55"
                  strokeWidth="1.4" strokeDasharray="2 4"
                  filter="url(#penWobble)"
                />
              )}
              {isHint && (
                <circle cx={p.cx} cy={p.cy} r="16"
                  fill="none" stroke="var(--navy)" strokeOpacity="0.28"
                  strokeWidth="1.2" strokeDasharray="1 3"
                />
              )}
              <circle cx={p.cx} cy={p.cy} r="3.4"
                fill="none" stroke="var(--navy-faint)" strokeWidth="1.2"
                filter="url(#penWobble)"
              />
            </g>
          );
        })}

        {/* pieces */}
        {POINTS.map((p, i) => {
          const v = board[i];
          if (!v) return null;
          const isCapElig = captureElig.includes(i);
          const isSel = selected === i;
          const isFlash = flashCapture === i;
          const isHintFrom = hintMove && hintMove.from === i;
          return (
            <g key={`p-${i}`} transform={`translate(${p.cx - 22} ${p.cy - 22})`}
              style={{ opacity: isFlash ? 0.3 : 1, transition: 'opacity 0.3s' }}>
              {isCapElig && (
                <circle cx="22" cy="22" r="20"
                  fill="none" stroke="var(--red)" strokeOpacity="0.6"
                  strokeWidth="1.4" strokeDasharray="2 4"
                  filter="url(#penWobble)" />
              )}
              {isSel && (
                <circle cx="22" cy="22" r="20"
                  fill="none" stroke="var(--red)" strokeOpacity="0.7"
                  strokeWidth="1.6" strokeDasharray="2 4"
                  filter="url(#penWobble)" />
              )}
              {isHintFrom && (
                <circle cx="22" cy="22" r="22"
                  fill="none" stroke="var(--navy)" strokeOpacity="0.35"
                  strokeWidth="1.2" strokeDasharray="1 3" />
              )}
              <foreignObject x="0" y="0" width="44" height="44">
                <div style={{ width: 44, height: 44 }}>
                  {v === 'X'
                    ? <GlyphX size={44} strokeWidth={2.4} />
                    : <GlyphO size={44} strokeWidth={2.2} />}
                </div>
              </foreignObject>
              {isFlash && (
                <line x1="4" y1="22" x2="40" y2="22"
                  stroke="var(--red)" strokeWidth="3" strokeLinecap="round"
                  filter="url(#penWobbleRed)"
                />
              )}
            </g>
          );
        })}
      </svg>

      {/* transparent click targets */}
      <div style={{ position: 'absolute', inset: 14, pointerEvents: 'none' }}>
        <svg
          viewBox={`0 0 ${BOARD_SIZE} ${BOARD_SIZE}`}
          width="100%" height="100%"
          style={{ pointerEvents: 'auto' }}
          role="grid"
          aria-label="Tábla mezői"
        >
          {POINTS.map((p, i) => {
            const v = board[i];
            const isCapElig = captureElig.includes(i);
            const isLegal = legalDests.includes(i);
            const isSelectable = state.phase === 'movement' && !state.awaiting_capture && v === state.turn;
            let ariaLabel = `${i < 8 ? ['a7','d7','g7','g4','g1','d1','a1','a4'][i] : i < 16 ? ['b6','d6','f6','f4','f2','d2','b2','b4'][i-8] : ['c5','d5','e5','e4','e3','d3','c3','c4'][i-16]}, `;
            if (!v) ariaLabel += 'üres';
            else if (v === 'X') ariaLabel += 'saját bábu' + (state.mills_highlighted.some(m => m.includes(i)) ? ', malomban' : '');
            else ariaLabel += 'ellenfél bábuja' + (state.mills_highlighted.some(m => m.includes(i)) ? ', malomban' : '');
            return (
              <circle key={`c-${i}`}
                cx={p.cx} cy={p.cy} r="22"
                fill="transparent"
                style={{ cursor: (
                  (playerCaptureMode && isCapElig) ||
                  isLegal ||
                  isSelectable ||
                  (state.phase === 'placement' && !v && !state.awaiting_capture)
                ) ? 'pointer' : 'default' }}
                role="button"
                aria-label={ariaLabel}
                tabIndex={0}
                onClick={() => onPointClick(i)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onPointClick(i); } }}
              />
            );
          })}
        </svg>
      </div>
    </div>
  );
}
