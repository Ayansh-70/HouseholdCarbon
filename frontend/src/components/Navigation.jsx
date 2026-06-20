import { useEffect, useRef } from 'react';

function Navigation() {
  const stripRef = useRef(null);

  useEffect(() => {
    const workspaceEl = document.getElementById('workspace-section');
    if (!workspaceEl || !stripRef.current) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        stripRef.current.classList.add('visible');
      } else {
        stripRef.current.classList.remove('visible');
      }
    }, { threshold: 0.1 });

    observer.observe(workspaceEl);
    return () => observer.disconnect();
  }, []);

  return (
    <nav style={{ position: 'relative' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
        <span className="logo">household<span>carbon</span></span>
        <div className="nav-links">
          <a href="#workspace-section">Workspace</a>
        </div>
      </div>
      <div className="context-strip" ref={stripRef}>
        household carbon &rsaquo; Workspace &middot; Carbon footprint tracker for homes
      </div>
    </nav>
  );
}

export default Navigation;
