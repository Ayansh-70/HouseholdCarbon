import React from 'react';
import BackgroundEffects from './components/BackgroundEffects';
import Navigation from './components/Navigation';
import Hero from './components/Hero';
import Workspace from './components/Workspace';
import FooterReveal from './components/FooterReveal';

import DailyTipBanner from './components/DailyTipBanner';
import RevealOnScroll from './components/RevealOnScroll';

function App() {
  return (
    <>
      <BackgroundEffects />
      <Navigation />
      <div id="content">
        <Hero />
        <DailyTipBanner />
        <Workspace />
        <RevealOnScroll delay={0}>
          <FooterReveal />
        </RevealOnScroll>
      </div>
    </>
  );
}

export default App;
