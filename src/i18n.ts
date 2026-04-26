export interface BiText { hu: string; en: string; }

export const STRINGS = {
  // Status notes
  yourMove:        { hu: 'A te lépésed',         en: 'Your move' },
  yourMovePlace:   { hu: 'A te lépésed',         en: 'Your move — place' },
  yourMoveSlide:   { hu: 'A te lépésed',         en: 'Your move — slide' },
  yourMoveFly:     { hu: 'Repülhetsz!',           en: 'Your move — fly' },
  yourCapture:     { hu: 'Üss le egy bábut',      en: 'Capture a piece' },
  cpuThinking:     { hu: 'A gép gondolkodik…',    en: 'CPU is thinking' },
  cpuCapturing:    { hu: 'A gép leüt egyet…',     en: 'CPU is taking a piece' },
  youWin:          { hu: 'Nyertél!',              en: 'You win' },
  youLose:         { hu: 'Vesztettél',            en: 'You lose' },
  draw:            { hu: 'Döntetlen',             en: 'Draw' },

  // Phases
  placement:       { hu: 'Lerakás',              en: 'Placement' },
  movement:        { hu: 'Tologatás',             en: 'Movement' },
  flying:          { hu: 'Ugrálás',              en: 'Flying' },

  // UI labels
  stock:           { hu: 'Készlet',              en: 'Stock' },
  you:             { hu: 'Te',                   en: 'You' },
  cpu:             { hu: 'Gép',                  en: 'CPU' },
  turn:            { hu: 'Soros',                en: 'Turn' },
  score:           { hu: 'Eredmény',             en: 'Score' },
  diagnostics:     { hu: 'Diagnosztika',         en: 'Diagnostics' },
  phaseTracker:    { hu: 'Fázis',                en: 'Phase tracker' },
  patterns:        { hu: 'Mintázat',             en: 'Patterns' },
  intel:           { hu: 'Intel',                en: 'Analysis' },

  // Diagnostics rows
  mills:           { hu: 'Malmok',               en: 'Mills' },
  millThreats:     { hu: 'Malomfenyegetés',      en: 'Mill threats' },
  swingMills:      { hu: 'Csiki-csuki',          en: 'Swing mills' },
  doubleThreat:    { hu: 'Kettős fenyegetés',    en: 'Double threat' },
  mobility:        { hu: 'Mozgástér',            en: 'Mobility' },
  blocked:         { hu: 'Blokkolt',             en: 'Blocked' },
  inHand:          { hu: 'bábuk kézben',         en: 'in hand' },
  onBoard:         { hu: 'bábuk a táblán',       en: 'on board' },
  topThreat:       { hu: 'Legnagyobb fenyegetés',en: 'Top threat' },
  mode:            { hu: 'Mód',                  en: 'Mode' },
  suggestion:      { hu: 'Javaslat',             en: 'Suggestion' },

  // House rules
  houseRules:      { hu: 'Házszabály',           en: 'House rules' },
  csikiCsuki:      { hu: 'Csiki-csuki engedélyezve',    en: 'Allow swing-mills' },
  doubleCapture:   { hu: 'Kettős malom = két levétel',  en: 'Double mill = 2 captures' },
  flyingRule:      { hu: 'Repülés engedélyezve',        en: 'Flying when reduced to 3' },
  drawRule:        { hu: 'Döntetlen 13 lépéspár után',  en: 'Draw after 13 move-pairs' },

  // Footer
  difficulty:      { hu: 'Nehézség',             en: 'Difficulty' },
  easy:            { hu: 'Könnyű',               en: 'Easy' },
  medium:          { hu: 'Közepes',              en: 'Medium' },
  hard:            { hu: 'Nehéz',               en: 'Hard' },
  newGame:         { hu: 'Új játék',             en: 'New game' },
  undo:            { hu: 'Vissza',               en: 'Undo' },
  resetStats:      { hu: 'Statisztika törlése',  en: 'Reset stats' },
  continueGame:    { hu: 'Folytatás',            en: 'Continue' },
  lostPieces:      { hu: 'leütve',               en: 'lost' },

  // AI modes
  buildMode:       { hu: 'Felépítés',            en: 'Build' },
  huntMode:        { hu: 'Vadászat',             en: 'Hunt' },
  defendMode:      { hu: 'Védekezés',            en: 'Defend' },
  endgameMode:     { hu: 'Végjáték',             en: 'Endgame' },

  // Misc
  appTitle:        { hu: 'Malom',                en: 'Nine Men\'s Morris' },
  appSubtitle:     { hu: 'Malom · Mühle',        en: 'Nine Men\'s Morris' },
  classic:         { hu: 'Klasszikus',           en: 'Classic' },
  heatmap:         { hu: 'Hőtérkép',             en: 'Heatmap' },
  hints:           { hu: 'Tippek',              en: 'Hints' },
  on:              { hu: 'be',                   en: 'on' },
  off:             { hu: 'ki',                   en: 'off' },
  points:          { hu: 'pont',                 en: 'points' },
  version:         { hu: 'v1.0',                 en: 'v1.0' },
  close:           { hu: 'zár',                  en: 'close' },
} satisfies Record<string, BiText>;
