import { CellValue, GameState, AIMove, Player, Difficulty } from './types';
import {
  ADJ, MILLS, MILLS_BY_POINT,
} from './board';
import {
  piecesOnBoard, currentMills, inAnyMill, eligibleCaptures,
  formsMillIfPlaced, legalDestinations, isFlying, hasAnyMove,
  applyPlace, applyMove, applyCapture,
} from './game';

// ─── Evaluation ───────────────────────────────────────────────────────────────

function findThreats(board: CellValue[], side: Player): number[] {
  const empties: number[] = [];
  for (const m of MILLS) {
    const mine = m.filter(i => board[i] === side).length;
    const empty = m.filter(i => board[i] == null);
    if (mine === 2 && empty.length === 1) empties.push(empty[0]);
  }
  return empties;
}

function countSwingMills(board: CellValue[], side: Player): number {
  let count = 0;
  for (let i = 0; i < 24; i++) {
    if (board[i] !== side) continue;
    if (!inAnyMill(board, i, side)) continue;
    for (const j of ADJ[i]) {
      if (board[j] != null) continue;
      const b2 = board.slice() as CellValue[];
      b2[i] = null; b2[j] = side;
      if (ADJ[j].includes(i) && formsMillIfPlaced(b2, i, side).length > 0) {
        count++; break;
      }
    }
  }
  return count;
}

function mobility(board: CellValue[], side: Player, flying: boolean): number {
  if (flying) {
    const emp = board.filter(v => v == null).length;
    return emp * piecesOnBoard(board, side);
  }
  let m = 0;
  for (let i = 0; i < 24; i++) if (board[i] === side) {
    for (const j of ADJ[i]) if (board[j] == null) m++;
  }
  return m;
}

function evaluate(state: GameState, me: Player): number {
  const opp: Player = me === 'X' ? 'O' : 'X';
  const board = state.board;

  if (state.phase === 'gameover') {
    if (state.result === me) return 100000;
    if (state.result === opp) return -100000;
    return 0;
  }

  const myPcs = state.pieces_on_board[me];
  const oppPcs = state.pieces_on_board[opp];
  const myMills = currentMills(board, me).length;
  const oppMills = currentMills(board, opp).length;
  const myThreats = findThreats(board, me).length;
  const oppThreats = findThreats(board, opp).length;
  const mySwing = countSwingMills(board, me);
  const oppSwing = countSwingMills(board, opp);
  const myFlying = state.flying[me];
  const oppFlying = state.flying[opp];
  const myMob = mobility(board, me, myFlying);
  const oppMob = mobility(board, opp, oppFlying);

  return (myPcs - oppPcs) * 100
    + (myMills - oppMills) * 30
    + (myThreats - oppThreats) * 10
    + (mySwing - oppSwing) * 20
    + (myMob - oppMob) * 5
    + (oppFlying && !myFlying ? 50 : 0);
}

// ─── Opening book (placement phase, first few moves) ─────────────────────────
// Strong corners and midpoints for Nine Men's Morris
const OPENING_BOOK_X: number[][] = [
  [0, 3, 6, 7],    // corners outer
  [1, 5, 9, 13],   // cross points
  [0, 4, 7, 15],
  [2, 6, 11, 23],
  [1, 3, 9, 11],
];
const OPENING_BOOK_O: number[][] = [
  [1, 5, 9, 13],
  [0, 2, 4, 6],
  [3, 7, 11, 15],
  [9, 11, 17, 19],
  [7, 15, 23, 16],
];

function openingBookMove(state: GameState, me: Player): number | null {
  const placed = 9 - state.pieces_in_hand[me];
  if (placed >= 4) return null;
  const book = me === 'X' ? OPENING_BOOK_X : OPENING_BOOK_O;
  const seq = book[Math.floor(Math.random() * book.length)];
  for (const pt of seq) {
    if (state.board[pt] == null) return pt;
  }
  return null;
}

// ─── Move generation ──────────────────────────────────────────────────────────

interface SearchMove {
  type: 'place' | 'move' | 'fly';
  from?: number;
  to: number;
  priority: number;
}

function generateMoves(state: GameState, me: Player): SearchMove[] {
  const moves: SearchMove[] = [];
  const board = state.board;

  if (state.phase === 'placement') {
    for (let i = 0; i < 24; i++) {
      if (board[i] != null) continue;
      const b2 = board.slice() as CellValue[];
      b2[i] = me;
      const mf = formsMillIfPlaced(b2, i, me).length > 0;
      moves.push({ type: 'place', to: i, priority: mf ? 100 : 0 });
    }
  } else if (state.phase === 'movement') {
    const flying = isFlying(state, me);
    for (let i = 0; i < 24; i++) {
      if (board[i] !== me) continue;
      const dests = legalDestinations(state, i);
      for (const j of dests) {
        const b2 = board.slice() as CellValue[];
        b2[i] = null; b2[j] = me;
        const mf = formsMillIfPlaced(b2, j, me).length > 0;
        moves.push({ type: flying ? 'fly' : 'move', from: i, to: j, priority: mf ? 100 : 0 });
      }
    }
  }

  // Sort mill-forming moves first
  moves.sort((a, b) => b.priority - a.priority);
  return moves;
}

// ─── Minimax with alpha-beta ──────────────────────────────────────────────────

let searchStart = 0;
let searchTimeLimit = 1500;
let searchAborted = false;

function applySearchMove(state: GameState, mv: SearchMove): GameState {
  if (mv.type === 'place') return applyPlace(state, mv.to);
  return applyMove(state, mv.from!, mv.to);
}

function minimax(
  state: GameState,
  depth: number,
  alpha: number,
  beta: number,
  maximizing: boolean,
  root: Player,
): number {
  if (searchAborted || Date.now() - searchStart > searchTimeLimit) {
    searchAborted = true;
    return evaluate(state, root);
  }

  if (depth === 0 || state.phase === 'gameover') {
    return evaluate(state, root);
  }

  // Handle awaiting_capture separately
  if (state.awaiting_capture) {
    const capturer = state.turn;
    const opp: Player = capturer === 'X' ? 'O' : 'X';
    const elig = eligibleCaptures(state.board, opp);
    if (elig.length === 0) return evaluate(state, root);

    let best = maximizing ? -Infinity : Infinity;
    for (const pt of elig) {
      const next = applyCapture(state, pt);
      const val = minimax(next, depth - 1, alpha, beta, !maximizing, root);
      if (maximizing) {
        best = Math.max(best, val);
        alpha = Math.max(alpha, best);
      } else {
        best = Math.min(best, val);
        beta = Math.min(beta, best);
      }
      if (beta <= alpha) break;
    }
    return best;
  }

  const me = state.turn;
  const moves = generateMoves(state, me);
  if (moves.length === 0) return evaluate(state, root);

  let best = maximizing ? -Infinity : Infinity;
  for (const mv of moves) {
    const next = applySearchMove(state, mv);
    const val = minimax(next, depth - 1, alpha, beta, !maximizing, root);
    if (maximizing) {
      best = Math.max(best, val);
      alpha = Math.max(alpha, best);
    } else {
      best = Math.min(best, val);
      beta = Math.min(beta, best);
    }
    if (beta <= alpha) break;
  }
  return best;
}

// ─── Iterative deepening ──────────────────────────────────────────────────────

function iterativeDeepening(state: GameState, maxDepth: number, timeLimit: number): AIMove | null {
  const me = state.turn;
  searchStart = Date.now();
  searchTimeLimit = timeLimit;
  searchAborted = false;

  const moves = generateMoves(state, me);
  if (moves.length === 0) return null;
  if (moves.length === 1) {
    const mv = moves[0];
    return { type: mv.type, from: mv.from, to: mv.to };
  }

  let bestMove: AIMove | null = null;
  let bestScore = -Infinity;

  for (let depth = 1; depth <= maxDepth; depth++) {
    if (Date.now() - searchStart > timeLimit * 0.85) break;
    searchAborted = false;

    let depthBest: AIMove | null = null;
    let depthBestScore = -Infinity;

    for (const mv of moves) {
      if (Date.now() - searchStart > timeLimit) { searchAborted = true; break; }
      const next = applySearchMove(state, mv);
      const val = minimax(next, depth - 1, -Infinity, Infinity, false, me);
      if (val > depthBestScore) {
        depthBestScore = val;
        depthBest = { type: mv.type, from: mv.from, to: mv.to, score: val };
      }
    }

    if (!searchAborted && depthBest != null) {
      bestMove = depthBest;
      bestScore = depthBestScore;
    }

    if (bestScore >= 100000) break; // found a win
  }

  return bestMove ?? { type: moves[0].type, from: moves[0].from, to: moves[0].to };
}

// ─── Best capture selection ───────────────────────────────────────────────────

export function chooseBestCapture(state: GameState): number {
  const capturer = state.turn;
  const opp: Player = capturer === 'X' ? 'O' : 'X';
  const elig = eligibleCaptures(state.board, opp);
  if (elig.length === 0) return -1;

  let best = elig[0];
  let bestScore = -Infinity;
  for (const pt of elig) {
    const b2 = state.board.slice() as CellValue[];
    b2[pt] = null;
    // Prefer capturing threatening pieces and pieces in mills
    const threatScore = findThreats(b2, opp).length;
    // Lower their mobility
    const mobScore = -mobility(b2, opp, state.flying[opp]);
    const s = threatScore * 5 + mobScore * 0.5 + Math.random() * 0.2;
    if (s > bestScore) { bestScore = s; best = pt; }
  }
  return best;
}

// ─── Main AI entry point ──────────────────────────────────────────────────────

export function aiChoose(state: GameState, difficulty: Difficulty): AIMove | null {
  const me = state.turn;

  if (state.phase === 'placement') {
    // Opening book for first few moves
    if (difficulty !== 'easy') {
      const bookMove = openingBookMove(state, me);
      if (bookMove != null && Math.random() < 0.7) {
        return { type: 'place', to: bookMove };
      }
    }
  }

  if (difficulty === 'easy') {
    const moves = generateMoves(state, me);
    if (moves.length === 0) return null;
    // 30%: pick mill-forming if available
    if (Math.random() < 0.3) {
      const millMove = moves.find(m => m.priority > 0);
      if (millMove) return { type: millMove.type, from: millMove.from, to: millMove.to };
    }
    const mv = moves[Math.floor(Math.random() * moves.length)];
    return { type: mv.type, from: mv.from, to: mv.to };
  }

  if (difficulty === 'medium') {
    return iterativeDeepening(state, 3, 1500);
  }

  // Hard: depth 5-7, adaptive
  const totalPieces = state.pieces_on_board.X + state.pieces_on_board.O;
  const endgame = totalPieces <= 6;
  const maxDepth = endgame ? 7 : 5;
  return iterativeDeepening(state, maxDepth, 1500);
}
