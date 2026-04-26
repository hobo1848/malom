import { GameState, GameStats, HouseRules, DEFAULT_HOUSE_RULES, DEFAULT_STATS } from './types';
import { createInitialState } from './game';

const KEYS = {
  game:  'malom_game_v1',
  stats: 'malom_stats_v1',
  rules: 'malom_house_rules_v1',
} as const;

function tryParse<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function loadGame(): GameState | null {
  const saved = tryParse<GameState | null>(KEYS.game, null);
  return saved;
}

export function saveGame(state: GameState): void {
  localStorage.setItem(KEYS.game, JSON.stringify(state));
}

export function clearGame(): void {
  localStorage.removeItem(KEYS.game);
}

export function loadStats(): GameStats {
  return tryParse<GameStats>(KEYS.stats, { ...DEFAULT_STATS });
}

export function saveStats(stats: GameStats): void {
  localStorage.setItem(KEYS.stats, JSON.stringify(stats));
}

export function resetStats(): GameStats {
  const fresh = { ...DEFAULT_STATS };
  localStorage.setItem(KEYS.stats, JSON.stringify(fresh));
  return fresh;
}

export function loadRules(): HouseRules {
  return tryParse<HouseRules>(KEYS.rules, { ...DEFAULT_HOUSE_RULES });
}

export function saveRules(rules: HouseRules): void {
  localStorage.setItem(KEYS.rules, JSON.stringify(rules));
}

export function hasSavedGame(): boolean {
  return localStorage.getItem(KEYS.game) != null;
}
