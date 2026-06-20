export const MAX_READABLE_VALUE = 5000;

export function getEquivalent(kgCO2, seedIndex = 0) {
  const options = [
    {
      type: 'tree',
      value: Math.round(kgCO2 / 21),
      text: (n) => `= ${n} trees working all year to absorb this`,
      icon: '🌱'
    },
    {
      type: 'car',
      value: Math.round(kgCO2 / 0.12),
      text: (n) => `= driving ${n} km in a petrol car`,
      icon: '🌱'
    },
    {
      type: 'phone',
      value: Math.round(kgCO2 / 0.005),
      text: (n) => `= charging your phone ${n} times`,
      icon: '🌱'
    },
    {
      type: 'bulb',
      value: Math.round(kgCO2 / 0.004),
      text: (n) => `= running an LED bulb for ${n} hours`,
      icon: '🌱'
    }
  ];
  
  // Filter options to only those with readable numbers
  let eligibleOptions = options.filter(opt => opt.value <= MAX_READABLE_VALUE);
  
  // Fallback if all options exceed the threshold (extremely high footprint)
  if (eligibleOptions.length === 0) {
    // Find the option with the absolute smallest resulting number
    const minOption = options.reduce((min, curr) => curr.value < min.value ? curr : min, options[0]);
    eligibleOptions = [minOption];
  }
  
  // Use the passed seed index to pick consistently for this submission among eligible options
  const selected = eligibleOptions[seedIndex % eligibleOptions.length];
  
  return {
    text: selected.text(selected.value),
    icon: selected.icon
  };
}
