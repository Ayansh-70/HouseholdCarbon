import React from 'react';
import { compareToAverage } from '../utils/nationalAverage';

export default function AverageComparisonBadge({ kgCO2 }) {
  const { percent, direction } = compareToAverage(kgCO2);

  const isBelow = direction === 'below';
  const bgColor = isBelow ? 'rgba(0, 200, 150, 0.1)' : 'rgba(245, 166, 35, 0.1)';
  const textColor = isBelow ? '#00c896' : '#f5a623';
  const arrow = isBelow ? '↓' : '↑';

  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      fontSize: '13px',
      color: textColor,
      background: bgColor,
      padding: '4px 10px',
      borderRadius: '20px',
      whiteSpace: 'nowrap',
      fontWeight: '500'
    }}>
      <span>{percent}% {direction} average {arrow}</span>
    </div>
  );
}
