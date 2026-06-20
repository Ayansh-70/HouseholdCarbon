import { useEffect, useRef } from 'react';

function FooterReveal() {
  const innerRef = useRef(null);

  useEffect(() => {
    const sectionThreeInner = innerRef.current;
    if (!sectionThreeInner) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        sectionThreeInner.classList.add('visible');
        observer.unobserve(sectionThreeInner);
      }
    }, { threshold: 0.15 });
    
    observer.observe(sectionThreeInner);
    
    return () => {
      if (sectionThreeInner) observer.unobserve(sectionThreeInner);
    };
  }, []);

  return (
    <section id="section-three">
      <div className="inner" id="section-three-inner" ref={innerRef}>
        <p style={{ marginBottom: '2rem' }}>HOW IT WORKS</p>
        <div className="how-it-works-grid">
          <div className="how-it-works-col">
            <div className="how-it-works-col-top"></div>
            <div className="num">01</div>
            <h3>Enter Your Usage</h3>
            <p>Add your monthly electricity, gas, water, and household size.</p>
          </div>
          <div className="how-it-works-col">
            <div className="how-it-works-col-top"></div>
            <div className="num">02</div>
            <h3>Calculate Your Footprint</h3>
            <p>Instantly see your CO₂e output and how it compares to global benchmarks.</p>
          </div>
          <div className="how-it-works-col">
            <div className="how-it-works-col-top"></div>
            <div className="num">03</div>
            <h3>Get Your AI Reduction Plan</h3>
            <p>Gemini AI analyzes your data and gives you a custom, step-by-step plan to cut emissions.</p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default FooterReveal;
