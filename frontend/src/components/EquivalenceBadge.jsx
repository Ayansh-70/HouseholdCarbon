import React, { useMemo } from 'react';
import { getEquivalent } from '../utils/carbonEquivalents';
import { THEME_COLORS } from '../utils/theme';

export default function EquivalenceBadge({ kgCO2, seedIndex = 0 }) {
  // Use the passed seed index to pick the comparison consistently for this submission
  const equivalence = useMemo(() => {
    const options = [
      { text: (n) => `= ${Math.round(kgCO2 / 21)} trees working all year to absorb this` },
      { text: (n) => `= driving ${Math.round(kgCO2 / 0.12)} km in a petrol car` },
      { text: (n) => `= charging your phone ${Math.round(kgCO2 / 0.005)} times` },
      { text: (n) => `= running an LED bulb for ${Math.round(kgCO2 / 0.004)} hours` }
    ];
    return {
      text: options[seedIndex % options.length].text(),
      icon: '🌱'
    };
  }, [kgCO2, seedIndex]);

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
