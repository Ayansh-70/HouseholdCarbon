import { useMemo } from 'react';
import { getEquivalent } from '../utils/carbonEquivalents';
import { THEME_COLORS } from '../utils/theme';

export default function EquivalenceBadge({ kgCO2, seedIndex = 0 }) {
  // Use the passed seed index to pick the comparison consistently for this submission
  // Logic and readability filter is now in carbonEquivalents.js
  const equivalence = useMemo(() => getEquivalent(kgCO2, seedIndex), [kgCO2, seedIndex]);

  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      fontSize: '13px',
      color: THEME_COLORS.surface.textSecondary,
      background: THEME_COLORS.surface.bg,
      border: `1px solid ${THEME_COLORS.surface.border}`,
      padding: '4px 10px',
      borderRadius: '20px',
      whiteSpace: 'nowrap'
    }}>
      <span style={{ fontSize: '14px' }}>{equivalence.icon}</span>
      <span>{equivalence.text}</span>
    </div>
  );
}
