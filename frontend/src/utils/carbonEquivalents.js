import { useMemo } from 'react';

export function getEquivalent(kgCO2) {
  const options = [
    {
      type: 'tree',
      value: Math.round(kgCO2 / 21),
      text: (n) => `= ${n} trees working all year to absorb this`,
      icon: '🌲'
    },
    {
      type: 'car',
      value: Math.round(kgCO2 / 0.12),
      text: (n) => `= driving ${n} km in a petrol car`,
      icon: '🚗'
    },
    {
      type: 'phone',
      value: Math.round(kgCO2 / 0.005),
      text: (n) => `= charging your phone ${n} times`,
      icon: '📱'
    },
    {
      type: 'bulb',
      value: Math.round(kgCO2 / 0.004),
      text: (n) => `= running an LED bulb for ${n} hours`,
      icon: '💡'
    }
  ];
  
  // Predictably "random" based on the value so it doesn't flicker on re-render
  const index = Math.floor(kgCO2) % options.length;
  const selected = options[index];
  
  return {
    text: selected.text(selected.value),
    icon: selected.icon
  };
}
