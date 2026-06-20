import React, { useMemo } from 'react';
import { getEquivalent } from '../utils/carbonEquivalents';

export default function EquivalenceBadge({ kgCO2 }) {
  const equivalence = useMemo(() => getEquivalent(kgCO2), [kgCO2]);

  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      fontSize: '13px',
      color: '#aaa',
      background: 'rgba(255, 255, 255, 0.03)',
      padding: '4px 10px',
      borderRadius: '20px',
      whiteSpace: 'nowrap'
    }}>
      <span style={{ fontSize: '14px' }}>{equivalence.icon}</span>
      <span>{equivalence.text}</span>
    </div>
  );
}
