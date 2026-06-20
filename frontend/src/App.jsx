import React from 'react';
import BackgroundEffects from './components/BackgroundEffects';
import Navigation from './components/Navigation';
import Hero from './components/Hero';
import Workspace from './components/Workspace';
import FooterReveal from './components/FooterReveal';

import DailyTipBanner from './components/DailyTipBanner';

function App() {
  return (
    <>
      <BackgroundEffects />
      <Navigation />
      <DailyTipBanner />
      
      <div id="content">
        <Hero />
        <Workspace />
        <FooterReveal />
      </div>
    </>
  );
}

export default App;
