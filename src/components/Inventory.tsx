import { GameState } from '../types';
import { GlyphX, GlyphO, RedStrike } from './Glyphs';
import { STRINGS } from '../i18n';

interface InventoryProps {
  state: GameState;
}

function InvGrid({ total, remaining, side }: { total: number; remaining: number; side: 'X' | 'O' }) {
  const cells = [];
  for (let i = 0; i < total; i++) {
    const placed = i >= remaining;
    cells.push(
      <div className="inv-cell" key={i}>
        {side === 'X'
          ? <GlyphX size={26} ghost={placed} strokeWidth={1.9} />
          : <GlyphO size={26} ghost={placed} strokeWidth={1.7} />}
        {placed && (
          <svg width="26" height="26" viewBox="0 0 26 26"
            style={{ position: 'absolute', inset: '4px 0 0 0', margin: 'auto', pointerEvents: 'none' }}>
            <g filter="url(#penWobble)" stroke="var(--navy-faint)" strokeWidth="1.1" fill="none" strokeLinecap="round">
              <path d="M 4 18 Q 13 12, 22 16" />
            </g>
          </svg>
        )}
      </div>
    );
  }
  return <div className="inv-grid">{cells}</div>;
}

function CapTally({ captured, side }: { captured: number; side: 'X' | 'O' }) {
  if (captured === 0) {
    return (
      <div className="cap-zero smallcaps">0 {STRINGS.lostPieces.hu} · {STRINGS.lostPieces.en}</div>
    );
  }
  const cells = [];
  for (let i = 0; i < captured; i++) {
    cells.push(
      <div className="cap-cell" key={i} style={{ position: 'relative' }}>
        {side === 'X' ? <GlyphX size={22} strokeWidth={1.7} /> : <GlyphO size={22} strokeWidth={1.6} />}
        <RedStrike size={22} />
      </div>
    );
  }
  return (
    <div>
      <div className="smallcaps" style={{ fontSize: 11, marginTop: 6, color: 'var(--muted)' }}>
        {captured} {STRINGS.lostPieces.hu} · {STRINGS.lostPieces.en}
      </div>
      <div className="captured">{cells}</div>
    </div>
  );
}

export function InventoryColumn({ state }: InventoryProps) {
  const inHandX = state.pieces_in_hand.X;
  const inHandO = state.pieces_in_hand.O;

  return (
    <div className="col-left">
      <div className="inv-section">
        <div className="smallcaps" style={{ fontSize: 11, marginBottom: 8 }}>
          {STRINGS.stock.hu} · {STRINGS.stock.en}
        </div>

        <div style={{ marginTop: 14 }}>
          <div className="smallcaps" style={{ fontSize: 10.5, marginBottom: 4 }}>× {STRINGS.you.en}</div>
          <InvGrid total={9} remaining={inHandX} side="X" />
          <CapTally captured={state.pieces_captured.X} side="X" />
        </div>

        <div style={{ marginTop: 18 }}>
          <div className="smallcaps" style={{ fontSize: 10.5, marginBottom: 4 }}>○ {STRINGS.cpu.en}</div>
          <InvGrid total={9} remaining={inHandO} side="O" />
          <CapTally captured={state.pieces_captured.O} side="O" />
        </div>
      </div>
    </div>
  );
}
