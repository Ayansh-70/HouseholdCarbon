import React, { useState, useEffect } from 'react';

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
      background: '#111827', // Muted slate from dark theme
      borderBottom: '0.5px solid rgba(255, 255, 255, 0.1)',
      padding: '0 20px',
      boxSizing: 'border-box',
      color: '#aaa',
      fontSize: '13px',
      zIndex: 40 // Sit above hero but below nav
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
          <strong>Eco Tip:</strong> {tip}
        </span>
      </div>
      <button 
        onClick={() => setVisible(false)}
        style={{
          background: 'none',
          border: 'none',
          color: '#888',
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
