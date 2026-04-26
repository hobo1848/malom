# Malom — Mühle

**Kilenc bábos malom · Nine Men's Morris**

A fully playable Nine Men's Morris implementation — hand-crafted in the same visual language as its siblings [Amőba](https://github.com/hobo1848/amoeba) and [Csatahajó](https://github.com/hobo1848/csatahajo): ballpoint ink on dotted notebook paper, a Hungarian füzet red margin line, Caveat handwriting, and dusty-red mill ellipses.

---

## Play

**[hobo1848.github.io/malom](https://hobo1848.github.io/malom)**

You are × (dark ink). The machine is ○. Three phases: place all nine pieces, then slide them along the board, then fly freely when reduced to three.

Form a **malom** (mill — three in a row) to capture one of the opponent's pieces. The player who loses three pieces, or gets stuck with no legal move, loses.

---

## Features

### Game rules

| Rule | Default | Toggle |
|---|---|---|
| Flying when reduced to 3 pieces | ✓ on | Házszabály |
| Csiki-csuki (swing-mill) allowed | ✓ on | Házszabály |
| Double mill = 2 captures | off | Házszabály |
| Draw after 13 move-pairs without capture | ✓ on | Házszabály |

All four house-rule toggles are available in the **Házszabály · House rules** popover.

### AI difficulties

| | Strategy |
|---|---|
| **Könnyű · Easy** | 70% random; 30% greedy mill-former |
| **Közepes · Medium** | Minimax depth 3 with alpha-beta pruning |
| **Nehéz · Hard** | Iterative deepening depth 5–7, 1.5 s time budget, opening book |

The AI runs in a **Web Worker** so the board stays responsive while it thinks. The yellow note shows *A gép gondolkodik…* during computation with a minimum 800 ms display delay so the move is always visible.

### Diagnostics panel

The collapsible **Diagnosztika** sidebar shows — live, after every move:

- Phase tracker (Lerakás · Tologatás · Ugrálás) with red hand-drawn underline
- MINTÁZAT table: Malmok / Malomfenyegetés / Csiki-csuki / Kettős fenyegetés / Mozgástér / Blokkolt
- INTEL block: top opponent threat with algebraic label + score, AI mode classification (Felépítés / Vadászat / Védekezés / Végjáték), optional hint suggestion
- Heatmap overlay and hint toggles

### Persistence & stats

Game state survives page reload (`malom_game_v1`). A continue-or-new dialog appears on return. Cumulative score, win streak, and capture tallies are tracked across sessions (`malom_stats_v1`). House rules persist separately (`malom_house_rules_v1`).

### Undo

One-level undo for the most recent player action. Disabled while a capture is pending.

---

## Board

```
a7 ─────── d7 ─────── g7
│           │           │
│  b6 ─── d6 ─── f6   │
│  │        │        │  │
│  │  c5 ─ d5 ─ e5  │  │
│  │  │           │  │  │
a4─b4─c4       e4─f4─g4
│  │  │           │  │  │
│  │  c3 ─ d3 ─ e3  │  │
│  │        │        │  │
│  b2 ─── d2 ─── f2   │
│           │           │
a1 ─────── d1 ─────── g1
```

24 intersections · 32 edges · 16 mill lines · canonical algebraic labels matching academic literature and Hungarian sources.

---

## Tech stack

Matches the sibling repos exactly:

| | |
|---|---|
| Framework | React 18 + TypeScript |
| Build | Vite 5 |
| Fonts | Caveat · Source Serif 4 · JetBrains Mono (Google Fonts) |
| Visual effects | SVG `feTurbulence` / `feDisplacementMap` for ballpoint wobble |
| AI | Hand-rolled minimax with alpha-beta, iterative deepening, Web Worker |
| Tests | Vitest |
| Deploy | GitHub Actions → GitHub Pages |

No UI framework, no game library, no canvas — pure SVG + React.

---

## Development

```bash
npm install
npm run dev        # http://localhost:5173/malom/
npm test           # 39 unit tests
npm run build      # production bundle → dist/
```

### Project layout

```
src/
  board.ts          topology: 24 points, ADJ[], MILLS[], canonical labels
  game.ts           state machine: applyPlace / applyMove / applyCapture
  ai.ts             minimax + alpha-beta + iterative deepening + opening book
  ai.worker.ts      Web Worker wrapper
  intel.ts          diagnostics: mills, threats, forks, swing-mills, mobility
  storage.ts        localStorage persistence (game / stats / rules)
  i18n.ts           bilingual string table (Hungarian + English)
  types.ts          TypeScript interfaces
  App.tsx           orchestration: player input, AI dispatch, undo, storage
  App.css           all styles — paper, ballpoint, layout, animations
  components/
    Board.tsx       SVG board: squares, spokes, pieces, mill ellipses, halos
    Glyphs.tsx      hand-drawn X and O, red strikethrough
    GlobalDefs.tsx  SVG filter defs (penWobble, penWobbleRed)
    Inventory.tsx   left column: pieces in hand + captured tally
    Sidebar.tsx     right column: turn block, score, diagnostics
    HouseRules.tsx  taped-note popover for the four rule toggles
tests/
  board.test.ts     adjacency symmetry, 32 edges, 16 mills, label map
  game.test.ts      all rule branches: capture, flying, double-mill, draw
  ai.test.ts        AI correctness, no illegal moves, game termination
```

### Key invariants verified by tests

- Adjacency graph is symmetric and has exactly 32 undirected edges
- All 16 mill lines are present; each has exactly 3 valid points
- Eligible captures exclude mill pieces unless all pieces are in mills
- Flying activates only after all 9 pieces are placed and 3 remain on board
- Draw counter reaches 26 plies → phase `gameover`, result `draw`
- Double-mill rule sets `double_capture_remaining = 2`
- AI `aiChoose` never returns an occupied destination
- A full game terminates within 500 half-moves

---

## Bilingual UI

All strings live in `src/i18n.ts`. Hungarian is the primary language; English appears as small-caps secondary text throughout — matching the convention in Amőba and Csatahajó. No runtime language switcher in v1.

---

## License

MIT
