// Board topology for Nine Men's Morris (Malom / Mühle).
// 24 intersections, 0-indexed. Point layout:
//   Outer ring (0-7):   a7,d7,g7,g4,g1,d1,a1,a4
//   Middle ring (8-15): b6,d6,f6,f4,f2,d2,b2,b4
//   Inner ring (16-23): c5,d5,e5,e4,e3,d3,c3,c4

export const LABELS: string[] = [
  'a7','d7','g7','g4','g1','d1','a1','a4',
  'b6','d6','f6','f4','f2','d2','b2','b4',
  'c5','d5','e5','e4','e3','d3','c3','c4',
];

export const LABEL_TO_IDX: Record<string, number> = Object.fromEntries(
  LABELS.map((l, i) => [l, i])
);

// Ring membership per point (0=outer, 1=middle, 2=inner)
export const RING: number[] = [
  0,0,0,0,0,0,0,0,
  1,1,1,1,1,1,1,1,
  2,2,2,2,2,2,2,2,
];

// Pixel grid position (col 0-2, row 0-2) within each ring
export const GRID_POS: [number, number][] = [
  [0,0],[1,0],[2,0],[2,1],[2,2],[1,2],[0,2],[0,1], // outer
  [0,0],[1,0],[2,0],[2,1],[2,2],[1,2],[0,2],[0,1], // middle
  [0,0],[1,0],[2,0],[2,1],[2,2],[1,2],[0,2],[0,1], // inner
];

// Adjacency list — bidirectional edges, 32 total
export const ADJ: number[][] = [
  /* 0  a7 */ [1,7],
  /* 1  d7 */ [0,2,9],
  /* 2  g7 */ [1,3],
  /* 3  g4 */ [2,4,11],
  /* 4  g1 */ [3,5],
  /* 5  d1 */ [4,6,13],
  /* 6  a1 */ [5,7],
  /* 7  a4 */ [0,6,15],
  /* 8  b6 */ [9,15],
  /* 9  d6 */ [1,8,10,17],
  /* 10 f6 */ [9,11],
  /* 11 f4 */ [3,10,12,19],
  /* 12 f2 */ [11,13],
  /* 13 d2 */ [5,12,14,21],
  /* 14 b2 */ [13,15],
  /* 15 b4 */ [7,8,14,23],
  /* 16 c5 */ [17,23],
  /* 17 d5 */ [9,16,18],
  /* 18 e5 */ [17,19],
  /* 19 e4 */ [11,18,20],
  /* 20 e3 */ [19,21],
  /* 21 d3 */ [13,20,22],
  /* 22 c3 */ [21,23],
  /* 23 c4 */ [15,16,22],
];

// 16 mill lines (three-in-a-rows)
export const MILLS: number[][] = [
  // Outer ring horizontal (clockwise)
  [0,1,2],[2,3,4],[4,5,6],[6,7,0],
  // Middle ring horizontal
  [8,9,10],[10,11,12],[12,13,14],[14,15,8],
  // Inner ring horizontal
  [16,17,18],[18,19,20],[20,21,22],[22,23,16],
  // Spokes (vertical cross-ring)
  [1,9,17],[3,11,19],[5,13,21],[7,15,23],
];

// Per-point list of mills containing that point
export const MILLS_BY_POINT: number[][][] = Array.from({ length: 24 }, (_, i) =>
  MILLS.filter(m => m.includes(i))
);

// Semantic adjacency for keyboard navigation (along board edges)
export function getAdjacentPoints(pt: number): number[] {
  return ADJ[pt];
}

export const TOTAL_EDGES = 32;
export const TOTAL_MILLS = 16;
export const TOTAL_POINTS = 24;
