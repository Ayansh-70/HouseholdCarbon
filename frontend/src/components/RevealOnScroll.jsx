import React from 'react';
import { useScrollReveal } from '../hooks/useScrollReveal';

export default function RevealOnScroll({ children, delay = 0, className = '', style = {}, as: Component = 'div' }) {
  const { ref, isVisible } = useScrollReveal();

  const mergedStyle = {
    ...style,
    transition: `opacity 0.6s ease-out ${delay}ms, transform 0.6s ease-out ${delay}ms`,
  };

  return (
    <Component
      ref={ref}
      className={`reveal-on-scroll ${isVisible ? 'is-visible' : ''} ${className}`}
      style={mergedStyle}
    >
      {children}
    </Component>
  );
}
