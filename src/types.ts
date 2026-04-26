export type Player = 'X' | 'O';
export type Phase = 'placement' | 'movement' | 'gameover';
export type CellValue = Player | null;
export type Difficulty = 'easy' | 'medium' | 'hard';

export interface HouseRules {
  csiki_csuki_allowed: boolean;
  double_mill_double_capture: boolean;
  flying_allowed: boolean;
  draw_after_13_pairs: boolean;
}

export const DEFAULT_HOUSE_RULES: HouseRules = {
  csiki_csuki_allowed: true,
  double_mill_double_capture: false,
  flying_allowed: true,
  draw_after_13_pairs: true,
};

export interface Move {
  type: 'place' | 'move' | 'fly' | 'capture';
  player: Player;
  from?: number;
  to: number;
  notation: string;
}

export interface GameStats {
  wins: number;
  losses: number;
  draws: number;
  total_games: number;
  mills_total: number;
  captures_inflicted: number;
  captures_received: number;
  win_streak: number;
  current_streak: number;
}

export const DEFAULT_STATS: GameStats = {
  wins: 0, losses: 0, draws: 0, total_games: 0,
  mills_total: 0, captures_inflicted: 0, captures_received: 0,
  win_streak: 0, current_streak: 0,
};

export interface GameState {
  phase: Phase;
  turn: Player;
  board: CellValue[];
  pieces_in_hand: { X: number; O: number };
  pieces_on_board: { X: number; O: number };
  pieces_captured: { X: number; O: number };
  flying: { X: boolean; O: boolean };
  awaiting_capture: boolean;
  double_capture_remaining: number;
  selected_piece: number | null;
  mills_active: number[][];
  mills_highlighted: number[][];
  draw_counter: number;
  house_rules: HouseRules;
  move_history: Move[];
  score: { X: number; O: number };
  result: Player | 'draw' | null;
  last_broken_mill_X: number[] | null;
  last_broken_mill_O: number[] | null;
  last_moved_from: number | null;
}

export interface AIMove {
  type: 'place' | 'move' | 'fly';
  from?: number;
  to: number;
  score?: number;
}

export type AIWorkerRequest = {
  state: GameState;
  difficulty: Difficulty;
  timeLimit: number;
};

export type AIWorkerResponse =
  | { type: 'move'; move: AIMove }
  | { type: 'capture'; point: number }
  | { type: 'error'; message: string };
