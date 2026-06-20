
import { compareToAverage } from '../utils/nationalAverage';
import { THEME_COLORS } from '../utils/theme';

export default function AverageComparisonBadge({ kgCO2 }) {
  const { percent, direction } = compareToAverage(kgCO2);

  const isBelow = direction === 'below';
  const theme = isBelow ? THEME_COLORS.success : THEME_COLORS.warning;
  const arrow = isBelow ? '↓' : '↑';

  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      fontSize: '13px',
      color: theme.text,
      background: theme.bg,
      border: `1px solid ${theme.border}`,
      padding: '4px 10px',
      borderRadius: '20px',
      whiteSpace: 'nowrap',
      fontWeight: '500'
    }}>
      <span>{percent}% {direction} India avg {arrow}</span>
    </div>
  );
}
