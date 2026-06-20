/**
 * Deterministic carbon footprint calculation.
 *
 * Emission Factors:
 * - Electricity: 0.4 kg CO2e per kWh
 * - Natural Gas: 5.3 kg CO2e per therm
 * - Water: 0.003 kg CO2e per liter
 *
 * Heating Fuel Modifier:
 * - oil: 1.25x (applies to electricity + natural gas)
 * - electric, gas, none: 1.0x
 */

// These are illustrative national-average emission factors chosen for simplicity.
// In a real application, electricity intensity would vary significantly by local power grid.
const FACTORS = {
  electricity: 0.4,
  naturalGas: 5.3,
  water: 0.003,
};

function calculateFootprint(data) {
  const { electricity, naturalGas, water, householdSize, heatingFuel } = data;

  // Calculate base emissions and round to 2 decimal places
  const electricityCO2e = Math.round((electricity * FACTORS.electricity) * 100) / 100;
  const naturalGasCO2e = Math.round((naturalGas * FACTORS.naturalGas) * 100) / 100;
  const waterCO2e = Math.round((water * FACTORS.water) * 100) / 100;

  let heatingAdjustment = 0;
  if (heatingFuel === 'oil') {
    // 25% additional emissions penalty. Scope: applied only to electricity and natural gas (not water)
    // because water usage emissions are generally decoupled from the household's primary space-heating inefficiency.
    heatingAdjustment = Math.round(((electricityCO2e + naturalGasCO2e) * 0.25) * 100) / 100;
  }

  // Exact total that sums the components
  const totalCO2e = Math.round((electricityCO2e + naturalGasCO2e + waterCO2e + heatingAdjustment) * 100) / 100;
  const perCapitaCO2e = householdSize > 0 ? Math.round((totalCO2e / householdSize) * 100) / 100 : 0;

  return {
    totalCO2e,
    perCapitaCO2e,
    breakdown: {
      electricity: electricityCO2e,
      naturalGas: naturalGasCO2e,
      water: waterCO2e,
      heatingAdjustment
    }
  };
}

module.exports = { calculateFootprint, FACTORS };
