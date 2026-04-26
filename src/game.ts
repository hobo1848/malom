import {
  CellValue, GameState, HouseRules, Move, Player, Phase,
  DEFAULT_HOUSE_RULES,
} from './types';
import { ADJ, MILLS, MILLS_BY_POINT, LABELS } from './board';

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function piecesOnBoard(board: CellValue[], side: Player): number {
  let c = 0;
  for (let i = 0; i < 24; i++) if (board[i] === side) c++;
  return c;
}

export function isFlying(state: GameState, side: Player): boolean {
  if (!state.house_rules.flying_allowed) return false;
  if (state.pieces_in_hand[side] > 0) return false;
  return state.pieces_on_board[side] === 3;
}

export function legalDestinations(state: GameState, from: number): number[] {
  const side = state.board[from];
  if (!side) return [];
  if (isFlying(state, side)) {
    const res: number[] = [];
    for (let i = 0; i < 24; i++) if (state.board[i] == null) res.push(i);
    return res;
  }
  // Csiki-csuki ban: if rule is OFF, disallow re-forming the same mill
  // broken by this piece on the previous move
  const banned = new Set<number>();
  if (!state.house_rules.csiki_csuki_allowed) {
    const brokenMill = side === 'X' ? state.last_broken_mill_X : state.last_broken_mill_O;
    if (brokenMill && state.last_moved_from === from) {
      // The piece that was moved last turn — check if moving back would re-form the same mill
      for (const j of ADJ[from]) {
        if (state.board[j] == null) {
          const b2 = state.board.slice() as CellValue[];
          b2[from] = null;
          b2[j] = side;
          const formed = formsMillIfPlaced(b2, j, side);
          const reformalOfBroken = formed.some(m =>
            brokenMill.length === m.length && brokenMill.every(p => m.includes(p))
          );
          if (reformalOfBroken) banned.add(j);
        }
      }
    }
  }
  return ADJ[from].filter(j => state.board[j] == null && !banned.has(j));
}

export function hasAnyMove(state: GameState, side: Player): boolean {
  if (isFlying(state, side)) {
    for (let i = 0; i < 24; i++) if (state.board[i] == null) return true;
    return false;
  }
  for (let i = 0; i < 24; i++) if (state.board[i] === side) {
    for (const j of ADJ[i]) if (state.board[j] == null) return true;
  }
  return false;
}

export function formsMillIfPlaced(board: CellValue[], pt: number, side: Player): number[][] {
  const found: number[][] = [];
  for (const m of MILLS_BY_POINT[pt]) {
    if (m.every(i => i === pt ? true : board[i] === side)) found.push(m);
  }
  return found;
}

export function currentMills(board: CellValue[], side: Player): number[][] {
  return MILLS.filter(m => m.every(i => board[i] === side));
}

export function inAnyMill(board: CellValue[], pt: number, side: Player): boolean {
  for (const m of MILLS_BY_POINT[pt]) {
    if (m.every(i => board[i] === side)) return true;
  }
  return false;
}

export function eligibleCaptures(board: CellValue[], side: Player): number[] {
  const all: number[] = [];
  const free: number[] = [];
  for (let i = 0; i < 24; i++) if (board[i] === side) {
    all.push(i);
    if (!inAnyMill(board, i, side)) free.push(i);
  }
  return free.length > 0 ? free : all;
}

// ─── State factory ────────────────────────────────────────────────────────────

export function createInitialState(rules: HouseRules = DEFAULT_HOUSE_RULES): GameState {
  return {
    phase: 'placement',
    turn: 'X',
    board: Array(24).fill(null) as CellValue[],
    pieces_in_hand: { X: 9, O: 9 },
    pieces_on_board: { X: 0, O: 0 },
    pieces_captured: { X: 0, O: 0 },
    flying: { X: false, O: false },
    awaiting_capture: false,
    double_capture_remaining: 0,
    selected_piece: null,
    mills_active: [],
    mills_highlighted: [],
    draw_counter: 0,
    house_rules: rules,
    move_history: [],
    score: { X: 0, O: 0 },
    result: null,
    last_broken_mill_X: null,
    last_broken_mill_O: null,
    last_moved_from: null,
  };
}

function clone(s: GameState): GameState {
  return JSON.parse(JSON.stringify(s)) as GameState;
}

function opponent(p: Player): Player {
  return p === 'X' ? 'O' : 'X';
}

function buildNotation(
  type: Move['type'], player: Player, to: number,
  from?: number, formedMill?: boolean, capture?: number
): string {
  const toLabel = LABELS[to];
  let note = '';
  if (type === 'place') note = `${player}${toLabel}`;
  else if (type === 'fly') note = `${player}${LABELS[from!]}->${toLabel}`;
  else note = `${player}${LABELS[from!]}-${toLabel}`;
  if (formedMill) note += '!';
  if (capture != null) note += ` x${LABELS[capture]}`;
  return note;
}

function updateDerivedState(s: GameState): GameState {
  s.pieces_on_board.X = piecesOnBoard(s.board, 'X');
  s.pieces_on_board.O = piecesOnBoard(s.board, 'O');
  s.mills_active = currentMills(s.board, 'X').concat(currentMills(s.board, 'O'));
  const flyingAllowed = s.house_rules.flying_allowed;
  s.flying.X = flyingAllowed && s.pieces_in_hand.X === 0 && s.pieces_on_board.X === 3;
  s.flying.O = flyingAllowed && s.pieces_in_hand.O === 0 && s.pieces_on_board.O === 3;
  return s;
}

// ─── Transitions ─────────────────────────────────────────────────────────────

export function applyPlace(state: GameState, pt: number): GameState {
  if (state.phase !== 'placement') return state;
  if (state.board[pt] != null) return state;
  if (state.awaiting_capture) return state;
  const side = state.turn;
  if (state.pieces_in_hand[side] <= 0) return state;

  const s = clone(state);
  s.board[pt] = side;
  s.pieces_in_hand[side]--;
  s.pieces_on_board[side] = piecesOnBoard(s.board, side);

  const formedMills = formsMillIfPlaced(s.board, pt, side);
  const notation = buildNotation('place', side, pt, undefined, formedMills.length > 0);
  s.move_history.push({ type: 'place', player: side, to: pt, notation });

  if (formedMills.length > 0) {
    s.awaiting_capture = true;
    s.mills_highlighted = formedMills;
    const captureCount = (s.house_rules.double_mill_double_capture && formedMills.length >= 2) ? 2 : 1;
    s.double_capture_remaining = captureCount;
  } else {
    s.draw_counter++;
    return finalizeTurn(s);
  }
  return updateDerivedState(s);
}

export function applyMove(state: GameState, from: number, to: number): GameState {
  if (state.phase !== 'movement') return state;
  if (state.awaiting_capture) return state;
  const side = state.turn;
  if (state.board[from] !== side) return state;
  const dests = legalDestinations(state, from);
  if (!dests.includes(to)) return state;

  const s = clone(state);
  // Track broken mills (for csiki-csuki ban)
  const millsBefore = currentMills(s.board, side);
  s.board[from] = null;
  s.board[to] = side;
  s.selected_piece = null;
  s.last_moved_from = from;

  const millsAfter = currentMills(s.board, side);
  // Broken mills: in before but not after
  const broken = millsBefore.filter(m =>
    !millsAfter.some(m2 => m.every(p => m2.includes(p)))
  );
  if (side === 'X') s.last_broken_mill_X = broken.length > 0 ? broken[0] : null;
  else s.last_broken_mill_O = broken.length > 0 ? broken[0] : null;

  const moveType: Move['type'] = isFlying(state, side) ? 'fly' : 'move';
  const formedMills = formsMillIfPlaced(s.board, to, side);
  const notation = buildNotation(moveType, side, to, from, formedMills.length > 0);
  s.move_history.push({ type: moveType, player: side, to, from, notation });

  if (formedMills.length > 0) {
    s.awaiting_capture = true;
    s.mills_highlighted = formedMills;
    const captureCount = (s.house_rules.double_mill_double_capture && formedMills.length >= 2) ? 2 : 1;
    s.double_capture_remaining = captureCount;
  } else {
    s.draw_counter++;
    return finalizeTurn(s);
  }
  return updateDerivedState(s);
}

export function applyCapture(state: GameState, pt: number): GameState {
  if (!state.awaiting_capture) return state;
  const capturer = state.turn;
  const opp = opponent(capturer);
  if (state.board[pt] !== opp) return state;
  const elig = eligibleCaptures(state.board, opp);
  if (!elig.includes(pt)) return state;

  const s = clone(state);
  s.board[pt] = null;
  s.pieces_on_board[opp] = piecesOnBoard(s.board, opp);
  s.pieces_captured[opp]++;
  s.draw_counter = 0;

  const lastMove = s.move_history[s.move_history.length - 1];
  if (lastMove) {
    lastMove.notation += ` x${LABELS[pt]}`;
  }
  s.move_history.push({ type: 'capture', player: capturer, to: pt, notation: `x${LABELS[pt]}` });

  s.double_capture_remaining--;
  if (s.double_capture_remaining > 0) {
    // More captures needed — check if there are eligible pieces left
    const remaining = eligibleCaptures(s.board, opp);
    if (remaining.length > 0) {
      return updateDerivedState(s);
    }
  }

  s.awaiting_capture = false;
  s.mills_highlighted = [];
  s.double_capture_remaining = 0;
  return finalizeTurn(s);
}

function finalizeTurn(s: GameState): GameState {
  const side = s.turn;
  const opp = opponent(side);

  updateDerivedState(s);

  // Win check: after placement complete, if opponent has < 3 pieces
  if (s.pieces_in_hand.X === 0 && s.pieces_in_hand.O === 0) {
    if (s.pieces_on_board[opp] < 3) {
      s.phase = 'gameover';
      s.result = side;
      s.score[side]++;
      return s;
    }
  }

  // Switch turn
  s.turn = opp;

  // Phase transition
  if (s.pieces_in_hand.X === 0 && s.pieces_in_hand.O === 0) {
    s.phase = 'movement';
  } else {
    s.phase = 'placement';
  }

  updateDerivedState(s);

  // Movement phase: immobilized?
  if (s.phase === 'movement' && !isFlying(s, opp)) {
    if (!hasAnyMove(s, opp)) {
      s.phase = 'gameover';
      s.result = side;
      s.score[side]++;
      return s;
    }
  }

  // Flying win check: opponent now has < 3 after capture
  if (s.phase === 'movement' && s.pieces_on_board[opp] < 3) {
    s.phase = 'gameover';
    s.result = side;
    s.score[side]++;
    return s;
  }

  // Draw rule: 26 plies (13 pairs) without capture/placement
  if (s.house_rules.draw_after_13_pairs && s.draw_counter >= 26) {
    s.phase = 'gameover';
    s.result = 'draw';
    return s;
  }

  return s;
}

// ─── Phase detection helpers ──────────────────────────────────────────────────

export function getSubPhase(state: GameState): 'place' | 'slide' | 'fly' | 'capture' | null {
  if (state.phase === 'gameover') return null;
  if (state.awaiting_capture) return 'capture';
  if (state.phase === 'placement') return 'place';
  if (isFlying(state, state.turn)) return 'fly';
  return 'slide';
}

export function canSelectPiece(state: GameState, pt: number): boolean {
  if (state.phase !== 'movement') return false;
  if (state.awaiting_capture) return false;
  return state.board[pt] === state.turn;
}

export function canCapturePiece(state: GameState, pt: number): boolean {
  if (!state.awaiting_capture) return false;
  const opp = opponent(state.turn);
  if (state.board[pt] !== opp) return false;
  return eligibleCaptures(state.board, opp).includes(pt);
}
