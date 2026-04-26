import { describe, it, expect } from 'vitest';
import { ADJ, MILLS, TOTAL_EDGES, TOTAL_MILLS, LABELS, LABEL_TO_IDX } from '../src/board';

describe('Board topology', () => {
  it('has exactly 24 points', () => {
    expect(ADJ.length).toBe(24);
  });

  it('adjacency is symmetric', () => {
    for (let i = 0; i < 24; i++) {
      for (const j of ADJ[i]) {
        expect(ADJ[j]).toContain(i);
      }
    }
  });

  it('has exactly 32 undirected edges', () => {
    const seen = new Set<string>();
    for (let i = 0; i < 24; i++) {
      for (const j of ADJ[i]) {
        const k = i < j ? `${i}-${j}` : `${j}-${i}`;
        seen.add(k);
      }
    }
    expect(seen.size).toBe(TOTAL_EDGES);
  });

  it('has exactly 16 mill lines', () => {
    expect(MILLS.length).toBe(TOTAL_MILLS);
  });

  it('each mill has exactly 3 points', () => {
    for (const m of MILLS) {
      expect(m.length).toBe(3);
    }
  });

  it('all mill points are valid (0-23)', () => {
    for (const m of MILLS) {
      for (const p of m) {
        expect(p).toBeGreaterThanOrEqual(0);
        expect(p).toBeLessThan(24);
      }
    }
  });

  it('no diagonal edges (no point connects to a point in a different ring and non-spoke position)', () => {
    // All cross-ring edges must be spokes (along a column)
    const RING = [
      0,0,0,0,0,0,0,0,
      1,1,1,1,1,1,1,1,
      2,2,2,2,2,2,2,2,
    ];
    for (let i = 0; i < 24; i++) {
      for (const j of ADJ[i]) {
        if (RING[i] !== RING[j]) {
          // Must share the same column index within ring (0-7)
          const iPos = i % 8;
          const jPos = j % 8;
          expect(iPos).toBe(jPos);
        }
      }
    }
  });

  it('all 24 points have at least 2 adjacencies', () => {
    for (let i = 0; i < 24; i++) {
      expect(ADJ[i].length).toBeGreaterThanOrEqual(2);
    }
  });

  it('canonical labels are correct', () => {
    expect(LABELS[0]).toBe('a7');
    expect(LABELS[5]).toBe('d1');
    expect(LABELS[6]).toBe('a1');
    expect(LABELS[13]).toBe('d2');
    expect(LABELS[17]).toBe('d5');
    expect(LABELS[23]).toBe('c4');
  });

  it('label-to-index map is consistent', () => {
    for (let i = 0; i < 24; i++) {
      expect(LABEL_TO_IDX[LABELS[i]]).toBe(i);
    }
  });

  it('the 16 canonical mills match expected patterns', () => {
    // Outer ring: a7-d7-g7, g7-g4-g1, g1-d1-a1, a1-a4-a7
    expect(MILLS).toContainEqual([0, 1, 2]);
    expect(MILLS).toContainEqual([2, 3, 4]);
    expect(MILLS).toContainEqual([4, 5, 6]);
    expect(MILLS).toContainEqual([6, 7, 0]);
    // Spokes
    expect(MILLS).toContainEqual([1, 9, 17]);  // d7-d6-d5
    expect(MILLS).toContainEqual([5, 13, 21]); // d1-d2-d3
    expect(MILLS).toContainEqual([7, 15, 23]); // a4-b4-c4
    expect(MILLS).toContainEqual([3, 11, 19]); // g4-f4-e4
  });
});
