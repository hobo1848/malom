interface GlyphProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
  ghost?: boolean;
}

export function GlyphX({ size = 40, color = 'var(--navy)', strokeWidth = 2.4, ghost = false }: GlyphProps) {
  const s = size;
  const pad = s * 0.18;
  const op = ghost ? 0.32 : 1;
  return (
    <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} style={{ display: 'block', opacity: op }}>
      <g filter="url(#penWobble)" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" fill="none">
        <path d={`M ${pad} ${pad + 1} Q ${s / 2 - 1} ${s / 2 - 2}, ${s - pad - 1} ${s - pad}`} />
        <path d={`M ${s - pad} ${pad + 2} Q ${s / 2 + 1} ${s / 2 + 1}, ${pad + 1} ${s - pad - 1}`} />
      </g>
    </svg>
  );
}

export function GlyphO({ size = 40, color = 'var(--navy)', strokeWidth = 2.2, ghost = false }: GlyphProps) {
  const s = size;
  const r = s * 0.34;
  const cx = s / 2, cy = s / 2;
  const startX = cx + r * Math.cos(-0.35);
  const startY = cy + r * Math.sin(-0.35);
  const op = ghost ? 0.32 : 1;
  return (
    <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} style={{ display: 'block', opacity: op }}>
      <g filter="url(#penWobble)" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" fill="none">
        <path d={
          `M ${startX} ${startY}
           C ${cx + r * 1.2} ${cy - r * 0.6}, ${cx + r * 0.6} ${cy - r * 1.2}, ${cx} ${cy - r}
           C ${cx - r * 1.2} ${cy - r * 0.9}, ${cx - r * 1.25} ${cy + r * 0.9}, ${cx} ${cy + r}
           C ${cx + r * 1.25} ${cy + r * 0.9}, ${cx + r * 1.15} ${cy - r * 0.2}, ${startX + 1.5} ${startY + 1}`
        } />
      </g>
    </svg>
  );
}

export function RedStrike({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
      <g filter="url(#penWobbleRed)" stroke="var(--red)" strokeWidth="2.2" strokeLinecap="round" fill="none">
        <path d={`M ${size * 0.1} ${size * 0.55} Q ${size * 0.5} ${size * 0.45}, ${size * 0.92} ${size * 0.6}`} />
      </g>
    </svg>
  );
}
