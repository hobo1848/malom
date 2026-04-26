import { CellValue, GameState, Player } from './types';
import { ADJ, MILLS, MILLS_BY_POINT, LABELS } from './board';
import {
  currentMills, inAnyMill, eligibleCaptures, formsMillIfPlaced,
  piecesOnBoard, isFlying,
} from './game';

export interface DiagData {
  mills: { X: number; O: number };
  threats: { X: number; O: number };
  swing: { X: number; O: number };
  forks: { X: number; O: number };
  mobility: { X: number; O: number };
  blocked: { X: number; O: number };
  inHand: { X: number; O: number };
  onBoard: { X: number; O: number };
}

export interface ThreatInfo {
  label: string;
  pt: number;
  score: number;
}

export interface ModeInfo {
  hu: string;
  en: string;
}

function findThreats(board: CellValue[], side: Player): number[] {
  const out: number[] = [];
  for (const m of MILLS) {
    const mine = m.filter(i => board[i] === side).length;
    const empty = m.filter(i => board[i] == null);
    if (mine === 2 && empty.length === 1) out.push(empty[0]);
  }
  return out;
}

function countForks(board: CellValue[], side: Player): number {
  let count = 0;
  for (let i = 0; i < 24; i++) {
    if (board[i] != null) continue;
    const b2 = board.slice() as CellValue[];
    b2[i] = side;
    const newThreats = findThreats(b2, side).length - findThreats(board, side).length;
    if (newThreats >= 2) count++;
  }
  return count;
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

function countMobility(board: CellValue[], side: Player, state: GameState): number {
  if (isFlying(state, side)) {
    const emp = board.filter(v => v == null).length;
    return emp * piecesOnBoard(board, side);
  }
  let m = 0;
  for (let i = 0; i < 24; i++) if (board[i] === side) {
    for (const j of ADJ[i]) if (board[j] == null) m++;
  }
  return m;
}

function countBlocked(board: CellValue[], side: Player): number {
  let b = 0;
  for (let i = 0; i < 24; i++) if (board[i] === side) {
    if (ADJ[i].every(j => board[j] != null)) b++;
  }
  return b;
}

export function computeDiagnostics(state: GameState): DiagData {
  const b = state.board;
  return {
    mills:    { X: currentMills(b, 'X').length, O: currentMills(b, 'O').length },
    threats:  { X: findThreats(b, 'X').length,  O: findThreats(b, 'O').length },
    swing:    { X: countSwingMills(b, 'X'),      O: countSwingMills(b, 'O') },
    forks:    { X: countForks(b, 'X'),           O: countForks(b, 'O') },
    mobility: { X: countMobility(b, 'X', state), O: countMobility(b, 'O', state) },
    blocked:  { X: countBlocked(b, 'X'),         O: countBlocked(b, 'O') },
    inHand:   { X: state.pieces_in_hand.X,       O: state.pieces_in_hand.O },
    onBoard:  { X: state.pieces_on_board.X,      O: state.pieces_on_board.O },
  };
}

export function computeTopThreat(state: GameState): ThreatInfo | null {
  const opp: Player = 'O';
  let bestPt = -1, bestS = -Infinity;
  for (let i = 0; i < 24; i++) {
    if (state.board[i] != null) continue;
    const b2 = state.board.slice() as CellValue[];
    b2[i] = opp;
    const t = findThreats(b2, opp).length;
    const m = currentMills(b2, opp).length;
    const s = m * 4 + t * 2 + Math.random() * 0.05;
    if (s > bestS) { bestS = s; bestPt = i; }
  }
  if (bestPt < 0) return null;
  const norm = Math.min(0.99, 0.4 + bestS * 0.18);
  return { pt: bestPt, label: LABELS[bestPt], score: norm };
}

export function computeMode(state: GameState): ModeInfo {
  const onBoard = state.pieces_on_board;
  const inHand = state.pieces_in_hand;
  if (inHand.X > 0 || inHand.O > 0) return { hu: 'Felépítés', en: 'Build' };
  if (onBoard.X <= 3 || onBoard.O <= 3) return { hu: 'Végjáték', en: 'Endgame' };
  const myMills = currentMills(state.board, 'O').length;
  const oppMills = currentMills(state.board, 'X').length;
  if (myMills > oppMills) return { hu: 'Vadászat', en: 'Hunt' };
  if (findThreats(state.board, 'X').length > 0) return { hu: 'Védekezés', en: 'Defend' };
  return { hu: 'Felépítés', en: 'Build' };
}
