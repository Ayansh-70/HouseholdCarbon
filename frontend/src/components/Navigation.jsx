import React from 'react';

function Navigation() {
  return (
    <nav>
      <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
        <span className="logo">household<span>carbon</span></span>
        <div className="nav-links">
          <a href="#workspace-section">Workspace</a>
        </div>
      </div>
    </nav>
  );
}

export default Navigation;
