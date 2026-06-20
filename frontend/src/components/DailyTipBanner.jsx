import { useState, useEffect } from 'react';
import { THEME_COLORS } from '../utils/theme';

// Assuming base URL from standard React Vite pattern (empty string for relative/proxy)
const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export default function DailyTipBanner() {
  const [tip, setTip] = useState(null);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/daily-tip`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.tip) {
          setTip(data.tip);
        }
      })
      .catch(err => {
        // Fail silently as requested
        console.error("Failed to load daily tip:", err);
      });
  }, []);

  if (!tip || !visible) return null;

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      width: '100%',
      height: '40px',
      background: THEME_COLORS.surface.bg, // Updated to use theme surface color
      backdropFilter: 'blur(20px)',
      borderBottom: `1px solid ${THEME_COLORS.surface.border}`, // Updated border
      padding: '0 20px',
      boxSizing: 'border-box',
      color: THEME_COLORS.surface.textSecondary, // Updated text color
      fontSize: '13px',
      zIndex: 40 // Nav is 50, Hero is 10/relative. 40 keeps it safely below nav.
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        overflow: 'hidden',
        whiteSpace: 'nowrap',
        textOverflow: 'ellipsis',
        flex: 1,
        paddingRight: '16px'
      }}>
        <span>🌱</span>
        <span style={{
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}>
          <strong style={{ color: 'var(--text-primary)' }}>Eco Tip:</strong> {tip}
        </span>
      </div>
      <button 
        onClick={() => setVisible(false)}
        style={{
          background: 'none',
          border: 'none',
          color: THEME_COLORS.surface.textSecondary,
          cursor: 'pointer',
          fontSize: '16px',
          padding: '4px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
        aria-label="Dismiss"
      >
        &times;
      </button>
    </div>
  );
}
