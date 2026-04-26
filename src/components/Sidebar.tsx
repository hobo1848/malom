import { GameState } from '../types';
import { DiagData, ThreatInfo, ModeInfo } from '../intel';
import { GlyphX, GlyphO } from './Glyphs';
import { STRINGS } from '../i18n';
import { getSubPhase } from '../game';

interface TurnBlockProps {
  state: GameState;
  statusText: { hu: string; en: string };
}

function TurnBlock({ state, statusText }: TurnBlockProps) {
  const isX = state.turn === 'X';
  return (
    <div className="turn-block">
      <div className="smallcaps" style={{ fontSize: 11 }}>{STRINGS.turn.hu} · {STRINGS.turn.en}</div>
      <div className="turn-row">
        <div className="glyph">
          {state.phase === 'gameover'
            ? <span style={{ fontFamily: 'Caveat, cursive', fontSize: 32, color: 'var(--navy)' }}>!</span>
            : (isX ? <GlyphX size={46} /> : <GlyphO size={46} />)}
        </div>
        <div>
          <div className="status-hu">{statusText.hu}</div>
          <div className="status-en">{statusText.en}</div>
        </div>
      </div>
    </div>
  );
}

function ScoreBlock({ state }: { state: GameState }) {
  return (
    <div>
      <div className="smallcaps" style={{ fontSize: 11 }}>{STRINGS.score.hu} · {STRINGS.score.en}</div>
      <div className="score-row">
        <div>
          <div className="score-num">{state.score.X}</div>
          <div className="score-label">× · {STRINGS.you.en}</div>
        </div>
        <div>
          <div className="score-num">{state.score.O}</div>
          <div className="score-label">○ · {STRINGS.cpu.en}</div>
        </div>
      </div>
    </div>
  );
}

interface DiagBlockProps {
  state: GameState;
  diag: DiagData;
  open: boolean;
  setOpen: (v: boolean) => void;
  heatmap: boolean;
  setHeatmap: (v: boolean) => void;
  hints: boolean;
  setHints: (v: boolean) => void;
  topThreat: ThreatInfo | null;
  mode: ModeInfo;
}

function DiagBlock({ state, diag, open, setOpen, heatmap, setHeatmap, hints, setHints, topThreat, mode }: DiagBlockProps) {
  const sub = getSubPhase(state);
  const phaseKey = sub === 'capture' ? null : sub;

  return (
    <div>
      <button
        className={`diag-toggle ${open ? '' : 'collapsed'}`}
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <span className="car">▼</span> {STRINGS.diagnostics.hu} · {STRINGS.diagnostics.en}
      </button>
      {open && (
        <div>
          {/* Phase tracker */}
          <div className="diag-section">
            <h4>{STRINGS.phaseTracker.en}</h4>
            <div className="phase-row">
              <span className={`phase ${phaseKey === 'place' ? 'active' : ''}`}>{STRINGS.placement.hu}</span>
              <span className={`phase ${phaseKey === 'slide' ? 'active' : ''}`}>{STRINGS.movement.hu}</span>
              <span className={`phase ${phaseKey === 'fly' ? 'active' : ''}`}>{STRINGS.flying.hu}</span>
            </div>
            <div className="phase-meta">
              <span></span><span className="lab">×</span><span className="lab">○</span>
              <span className="lab">{STRINGS.inHand.hu}</span>
              <span className="num x">{diag.inHand.X}</span>
              <span className="num o">{diag.inHand.O}</span>
              <span className="lab">{STRINGS.onBoard.hu}</span>
              <span className="num x">{diag.onBoard.X}</span>
              <span className="num o">{diag.onBoard.O}</span>
            </div>
          </div>

          {/* Patterns */}
          <div className="diag-section">
            <h4>{STRINGS.patterns.hu} · {STRINGS.patterns.en}</h4>
            <table className="pat-table">
              <thead>
                <tr><th></th><th>×</th><th>○</th></tr>
              </thead>
              <tbody>
                <tr><td>{STRINGS.mills.hu}</td><td>{diag.mills.X}</td><td>{diag.mills.O}</td></tr>
                <tr><td>{STRINGS.millThreats.hu}</td><td>{diag.threats.X}</td><td>{diag.threats.O}</td></tr>
                <tr><td>{STRINGS.swingMills.hu}</td><td>{diag.swing.X}</td><td>{diag.swing.O}</td></tr>
                <tr><td>{STRINGS.doubleThreat.hu}</td><td>{diag.forks.X}</td><td>{diag.forks.O}</td></tr>
                <tr><td>{STRINGS.mobility.hu}</td><td>{diag.mobility.X}</td><td>{diag.mobility.O}</td></tr>
                <tr><td>{STRINGS.blocked.hu}</td><td>{diag.blocked.X}</td><td>{diag.blocked.O}</td></tr>
              </tbody>
            </table>
          </div>

          {/* Intel */}
          <div className="diag-section">
            <h4>{STRINGS.intel.hu} · {STRINGS.intel.en}</h4>
            <div className="intel-row">
              <span className="lab">{STRINGS.topThreat.hu}</span>
              <span className="val mono">
                {topThreat ? `${topThreat.label} · ${topThreat.score.toFixed(2)}` : '—'}
              </span>
              <span className="lab">{STRINGS.mode.hu}</span>
              <span className="val">{mode.hu} <span style={{ color: 'var(--muted)' }}>· {mode.en}</span></span>
              {hints && (
                <>
                  <span className="lab">{STRINGS.suggestion.hu}</span>
                  <span className="val mono">{topThreat ? topThreat.label : '—'}</span>
                </>
              )}
            </div>
          </div>

          <div className="diag-foot">
            {state.score.X + state.score.O} games played
          </div>
          <button className="heatmap-toggle" onClick={() => setHeatmap(!heatmap)}>
            {STRINGS.heatmap.hu}: {heatmap ? STRINGS.on.hu : STRINGS.off.hu}
          </button>
          <div style={{ marginTop: 4 }}>
            <button className="heatmap-toggle"
              onClick={() => setHints(!hints)}
              style={{ fontSize: 16, color: 'var(--muted)' }}>
              {STRINGS.hints.hu}: {hints ? STRINGS.on.hu : STRINGS.off.hu}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

interface SidebarProps {
  state: GameState;
  diag: DiagData;
  statusText: { hu: string; en: string };
  diagOpen: boolean;
  setDiagOpen: (v: boolean) => void;
  heatmap: boolean;
  setHeatmap: (v: boolean) => void;
  hints: boolean;
  setHints: (v: boolean) => void;
  topThreat: ThreatInfo | null;
  mode: ModeInfo;
}

export function Sidebar(props: SidebarProps) {
  return (
    <div className="col-right sidebar">
      <TurnBlock state={props.state} statusText={props.statusText} />
      <ScoreBlock state={props.state} />
      <DiagBlock
        state={props.state}
        diag={props.diag}
        open={props.diagOpen}
        setOpen={props.setDiagOpen}
        heatmap={props.heatmap}
        setHeatmap={props.setHeatmap}
        hints={props.hints}
        setHints={props.setHints}
        topThreat={props.topThreat}
        mode={props.mode}
      />
    </div>
  );
}
