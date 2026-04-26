import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  GameState, HouseRules, Difficulty, AIWorkerResponse, AIMove,
  DEFAULT_HOUSE_RULES,
} from './types';
import {
  createInitialState, applyPlace, applyMove, applyCapture,
  legalDestinations, eligibleCaptures, getSubPhase,
} from './game';
import { computeDiagnostics, computeTopThreat, computeMode } from './intel';
import {
  loadGame, saveGame, loadStats, saveStats, loadRules, saveRules,
  hasSavedGame, resetStats as doResetStats, clearGame,
} from './storage';
import { STRINGS } from './i18n';
import { GlobalDefs } from './components/GlobalDefs';
import { Board } from './components/Board';
import { InventoryColumn } from './components/Inventory';
import { Sidebar } from './components/Sidebar';
import { HouseRulesPopover } from './components/HouseRules';

// ─── Status text ──────────────────────────────────────────────────────────────

function getStatusText(state: GameState): { hu: string; en: string } {
  if (state.phase === 'gameover') {
    if (state.result === 'X') return STRINGS.youWin;
    if (state.result === 'O') return STRINGS.youLose;
    return STRINGS.draw;
  }
  if (state.awaiting_capture) {
    return state.turn === 'X' ? STRINGS.yourCapture : STRINGS.cpuCapturing;
  }
  if (state.turn === 'O') return STRINGS.cpuThinking;
  const sub = getSubPhase(state);
  if (sub === 'place') return STRINGS.yourMovePlace;
  if (sub === 'fly') return STRINGS.yourMoveFly;
  return STRINGS.yourMoveSlide;
}

// ─── Continue dialog ──────────────────────────────────────────────────────────

function ContinueDialog({ onContinue, onNew }: { onContinue: () => void; onNew: () => void }) {
  return (
    <div className="continue-backdrop">
      <div className="continue-note">
        <h2>Folytatod?</h2>
        <div className="smallcaps" style={{ fontSize: 12 }}>Continue previous game?</div>
        <div className="btn-row">
          <button className="primary" onClick={onContinue}>Folytatás · Continue</button>
          <button onClick={onNew}>Új játék · New</button>
        </div>
      </div>
    </div>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  const [rules, setRulesState] = useState<HouseRules>(loadRules);
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [state, setState] = useState<GameState>(() => createInitialState(loadRules()));
  const [history, setHistory] = useState<GameState[]>([]);
  const [diagOpen, setDiagOpen] = useState(true);
  const [heatmap, setHeatmap] = useState(false);
  const [hints, setHints] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [showContinue, setShowContinue] = useState(false);
  const [flashCapture, setFlashCapture] = useState<number | null>(null);
  const stateRef = useRef(state);
  stateRef.current = state;

  const workerRef = useRef<Worker | null>(null);
  const aiPendingRef = useRef(false);

  // Check for saved game on mount
  useEffect(() => {
    if (hasSavedGame()) setShowContinue(true);
  }, []);

  // Persist game state
  useEffect(() => {
    if (state.phase !== 'gameover') saveGame(state);
    else clearGame();
  }, [state]);

  // Lazy-init Web Worker
  const getWorker = useCallback((): Worker => {
    if (!workerRef.current) {
      workerRef.current = new Worker(
        new URL('./ai.worker.ts', import.meta.url),
        { type: 'module' }
      );
    }
    return workerRef.current;
  }, []);

  // ── Player input handlers ──────────────────────────────────────────────────

  const pushUndo = useCallback((s: GameState) => {
    setHistory(h => [...h.slice(-30), s]);
  }, []);

  const setRules = useCallback((r: HouseRules) => {
    setRulesState(r);
    saveRules(r);
  }, []);

  const onPointClick = useCallback((i: number) => {
    const s = stateRef.current;
    if (s.phase === 'gameover') return;
    const isPlayerTurn = (s.turn as string) === 'X';
    const isPlayerCapture = s.awaiting_capture && (s.turn as string) === 'X';
    if (!isPlayerTurn && !isPlayerCapture) return;

    if (isPlayerCapture) {
      if (!eligibleCaptures(s.board, 'O').includes(i)) return;
      pushUndo(s);
      setFlashCapture(i);
      setTimeout(() => {
        setFlashCapture(null);
        setState(applyCapture(stateRef.current, i));
      }, 600);
      return;
    }

    if (s.turn !== 'X') return;

    if (s.phase === 'placement') {
      if (s.board[i] != null) return;
      pushUndo(s);
      setState(applyPlace(s, i));
      return;
    }

    if (s.phase === 'movement') {
      if (s.selected_piece != null) {
        if (i === s.selected_piece) {
          setState({ ...s, selected_piece: null });
          return;
        }
        const dests = legalDestinations(s, s.selected_piece);
        if (dests.includes(i)) {
          pushUndo(s);
          setState(applyMove(s, s.selected_piece, i));
          return;
        }
        if (s.board[i] === 'X') {
          setState({ ...s, selected_piece: i });
          return;
        }
        return;
      }
      if (s.board[i] === 'X') {
        setState({ ...s, selected_piece: i });
      }
    }
  }, [pushUndo]);

  // ── AI turn ───────────────────────────────────────────────────────────────

  useEffect(() => {
    const s = state;
    if (s.phase === 'gameover') return;
    const isAITurn = (s.turn as string) === 'O' || (s.awaiting_capture && (s.turn as string) === 'O');
    if (!isAITurn) return;
    if (aiPendingRef.current) return;

    aiPendingRef.current = true;
    const minDelay = 800;
    const start = Date.now();

    const worker = getWorker();
    worker.onmessage = (e: MessageEvent<AIWorkerResponse>) => {
      const elapsed = Date.now() - start;
      const wait = Math.max(0, minDelay - elapsed);
      setTimeout(() => {
        aiPendingRef.current = false;
        const cur = stateRef.current;
        if (cur.phase === 'gameover') return;

        const resp = e.data;
        if (resp.type === 'capture') {
          setFlashCapture(resp.point);
          setTimeout(() => {
            setFlashCapture(null);
            setState(applyCapture(stateRef.current, resp.point));
          }, 600);
        } else if (resp.type === 'move') {
          const mv = resp.move as AIMove;
          if (mv.type === 'place') setState(applyPlace(cur, mv.to));
          else setState(applyMove(cur, mv.from!, mv.to));
        }
      }, wait);
    };
    worker.onerror = () => { aiPendingRef.current = false; };
    worker.postMessage({ state: s, difficulty, timeLimit: 1500 });
  }, [state.turn, state.phase, state.awaiting_capture, difficulty, getWorker]);

  // Update stats on game over
  useEffect(() => {
    if (state.phase !== 'gameover' || !state.result) return;
    const stats = loadStats();
    stats.total_games++;
    if (state.result === 'X') {
      stats.wins++;
      stats.current_streak++;
      stats.win_streak = Math.max(stats.win_streak, stats.current_streak);
    } else if (state.result === 'O') {
      stats.losses++;
      stats.current_streak = 0;
    } else {
      stats.draws++;
      stats.current_streak = 0;
    }
    stats.captures_inflicted += state.pieces_captured.O;
    stats.captures_received += state.pieces_captured.X;
    saveStats(stats);
  }, [state.phase, state.result]);

  // ── Game controls ─────────────────────────────────────────────────────────

  const newGame = useCallback(() => {
    aiPendingRef.current = false;
    const fresh = createInitialState(rules);
    fresh.score = stateRef.current.score;
    setState(fresh);
    setHistory([]);
    setFlashCapture(null);
  }, [rules]);

  const undo = useCallback(() => {
    if (history.length === 0) return;
    if (stateRef.current.awaiting_capture) return;
    const prev = history[history.length - 1];
    setHistory(h => h.slice(0, -1));
    setState(prev);
  }, [history]);

  const handleResetStats = useCallback(() => {
    doResetStats();
  }, []);

  // ── Computed values ───────────────────────────────────────────────────────

  const statusText = useMemo(() => getStatusText(state), [state]);

  const legalDests = useMemo(() => {
    if (state.phase !== 'movement' || state.selected_piece == null) return [];
    return legalDestinations(state, state.selected_piece);
  }, [state]);

  const diag = useMemo(() => computeDiagnostics(state), [state]);
  const topThreat = useMemo(() => computeTopThreat(state), [state]);
  const mode = useMemo(() => computeMode(state), [state]);

  const hintMove = useMemo(() => {
    if (!hints || state.phase === 'gameover' || state.turn !== 'X' || state.awaiting_capture) return null;
    // Use the last known AI best move as hint (for now show top threat point)
    if (topThreat) return { to: topThreat.pt };
    return null;
  }, [hints, state, topThreat]);

  const canUndo = history.length > 0 && !state.awaiting_capture && state.turn === 'X' && state.phase !== 'gameover';

  return (
    <>
      <GlobalDefs />
      <div className="stage">
        {/* Header */}
        <header className="header">
          <div className="title">
            <h1>{STRINGS.appTitle.hu}</h1>
            <span className="sub">{STRINGS.appSubtitle.hu}</span>
          </div>
          <div className="pill" role="tablist" aria-label="Játékvariáns">
            <button className="active" aria-current="true">{STRINGS.classic.hu}</button>
            <button disabled title="V2-ben">Tizenkettes</button>
          </div>
        </header>

        {/* Yellow taped status note */}
        <div className="note-wrap status-wrap" role="status" aria-live="polite" aria-atomic="true">
          <div className="taped-note" key={statusText.hu}>
            <span className="tape l" aria-hidden="true"></span>
            <span className="tape r" aria-hidden="true"></span>
            <div className="hu">{statusText.hu}</div>
            <div className="en">{statusText.en}</div>
          </div>
        </div>

        {/* 3-column layout */}
        <div className="layout">
          <InventoryColumn state={state} />

          <div className="col-center">
            <Board
              state={state}
              onPointClick={onPointClick}
              legalDests={legalDests}
              flashCapture={flashCapture}
              heatmap={heatmap}
              hintMove={hintMove}
            />
          </div>

          <Sidebar
            state={state}
            diag={diag}
            statusText={statusText}
            diagOpen={diagOpen}
            setDiagOpen={setDiagOpen}
            heatmap={heatmap}
            setHeatmap={setHeatmap}
            hints={hints}
            setHints={setHints}
            topThreat={topThreat}
            mode={mode}
          />
        </div>

        {/* Footer */}
        <footer className="footer">
          <div className="group">
            <span className="smallcaps">{STRINGS.difficulty.en}:</span>
            {(['easy', 'medium', 'hard'] as Difficulty[]).map(d => (
              <span
                key={d}
                className={`opt ${difficulty === d ? 'active' : ''}`}
                onClick={() => setDifficulty(d)}
                role="button"
                tabIndex={0}
                onKeyDown={e => { if (e.key === 'Enter') setDifficulty(d); }}
                aria-pressed={difficulty === d}
              >
                {STRINGS[d === 'easy' ? 'easy' : d === 'medium' ? 'medium' : 'hard'].hu}
              </span>
            ))}
            <span className="dot-sep">·</span>
            <button className="linklike" onClick={newGame}>
              {STRINGS.newGame.hu} · {STRINGS.newGame.en}
            </button>
            <span className="dot-sep">·</span>
            <button className="linklike" onClick={undo} disabled={!canUndo}>
              {STRINGS.undo.hu} · {STRINGS.undo.en}
            </button>
            <span className="dot-sep">·</span>
            <button className="linklike" onClick={() => setShowRules(true)}>
              {STRINGS.houseRules.hu} · {STRINGS.houseRules.en}
            </button>
          </div>
          <div className="group">
            <span>Ballpoint</span>
            <span className="dot-sep">·</span>
            <span>24 {STRINGS.points.hu}</span>
            <span className="dot-sep">·</span>
            <span>{STRINGS.version.hu}</span>
            <span className="dot-sep">·</span>
            <button className="linklike" onClick={handleResetStats}>
              {STRINGS.resetStats.hu}
            </button>
          </div>
        </footer>
      </div>

      {/* House rules popover */}
      {showRules && (
        <HouseRulesPopover
          rules={rules}
          setRules={setRules}
          onClose={() => setShowRules(false)}
        />
      )}

      {/* Continue saved game dialog */}
      {showContinue && (
        <ContinueDialog
          onContinue={() => {
            const saved = loadGame();
            if (saved) setState(saved);
            setShowContinue(false);
          }}
          onNew={() => {
            clearGame();
            setShowContinue(false);
          }}
        />
      )}
    </>
  );
}
