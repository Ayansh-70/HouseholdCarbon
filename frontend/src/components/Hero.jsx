import React, { useEffect, useRef } from 'react';

function Hero() {
  const heroRef = useRef(null);

  useEffect(() => {
    function updateHeroOpacity() {
      if (!heroRef.current) return;
      const fade = Math.max(0, 1 - window.scrollY / (window.innerHeight * 0.4));
      heroRef.current.style.opacity = fade;
    }
    
    window.addEventListener('scroll', updateHeroOpacity, { passive: true });
    return () => window.removeEventListener('scroll', updateHeroOpacity);
  }, []);

  return (
    <section id="hero" ref={heroRef}>
      <div className="gradient-overlay"></div>
      <div className="content">
        <h1>
          Intelligent tracking for a{' '}
          <span className="underlined">
            <span className="line"></span>
            <span>decarbonized</span>
          </span>{' '}
          future.
        </h1>
        <p className="description">
          Input your home resource consumption metrics and let customized Gemini prompt models instantly structure actionable reduction models.
        </p>
        <div className="ctas">
          <a href="#workspace-section" className="cta-btn">Launch Workspace &rarr;</a>
        </div>
      </div>
      <div className="bounce-arrow">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </div>
    </section>
  );
}

export default Hero;
