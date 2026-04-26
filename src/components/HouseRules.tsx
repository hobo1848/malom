import { HouseRules } from '../types';
import { STRINGS } from '../i18n';

interface HouseRulesProps {
  rules: HouseRules;
  setRules: (r: HouseRules) => void;
  onClose: () => void;
}

const RULE_ITEMS: { key: keyof HouseRules; hu: string; en: string }[] = [
  { key: 'csiki_csuki_allowed',       hu: STRINGS.csikiCsuki.hu,    en: STRINGS.csikiCsuki.en },
  { key: 'double_mill_double_capture',hu: STRINGS.doubleCapture.hu, en: STRINGS.doubleCapture.en },
  { key: 'flying_allowed',            hu: STRINGS.flyingRule.hu,    en: STRINGS.flyingRule.en },
  { key: 'draw_after_13_pairs',       hu: STRINGS.drawRule.hu,      en: STRINGS.drawRule.en },
];

export function HouseRulesPopover({ rules, setRules, onClose }: HouseRulesProps) {
  return (
    <div
      className="popover-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`${STRINGS.houseRules.hu} — ${STRINGS.houseRules.en}`}
    >
      <div className="popover" onClick={e => e.stopPropagation()}>
        <span className="tape l" aria-hidden="true"></span>
        <span className="tape r" aria-hidden="true"></span>
        <button className="close" onClick={onClose} aria-label="Bezárás">× {STRINGS.close.hu}</button>
        <h3>{STRINGS.houseRules.hu}</h3>
        <div className="sub">{STRINGS.houseRules.en}</div>
        {RULE_ITEMS.map(it => (
          <div
            key={it.key}
            className="rule"
            role="checkbox"
            aria-checked={rules[it.key]}
            tabIndex={0}
            onClick={() => setRules({ ...rules, [it.key]: !rules[it.key] })}
            onKeyDown={e => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setRules({ ...rules, [it.key]: !rules[it.key] });
              }
            }}
          >
            <div className="check" aria-hidden="true">
              {rules[it.key] && (
                <svg width="22" height="22" viewBox="0 0 22 22" style={{ position: 'absolute', inset: -2 }}>
                  <g filter="url(#penWobble)" stroke="var(--navy)" strokeWidth="2.0" fill="none" strokeLinecap="round">
                    <path d="M 3 11 Q 7 16, 10 14 T 20 3" />
                  </g>
                </svg>
              )}
            </div>
            <div>
              <div className="label-hu">{it.hu}</div>
              <div className="label-en">{it.en}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
