import React, { useEffect, useRef } from 'react';

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
        <p>Optimized For Tomorrow</p>
        <h2>HouseholdCarbon</h2>
      </div>
    </section>
  );
}

export default FooterReveal;
