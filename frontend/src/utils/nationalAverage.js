export const BENCHMARKS = {
  INDIA: 145,
  PARIS: 208,
  GLOBAL: 375
};

export const NATIONAL_AVG_MONTHLY_KG_CO2 = BENCHMARKS.INDIA;

/**
 * Compares a user's footprint against the national average.
 * @param {number} userKgCO2 - The user's total carbon footprint in kg CO2e
 * @returns {{percent: number, direction: 'above' | 'below'}} An object containing the percentage difference and the direction
 */
export function compareToAverage(userKgCO2) {
  const diff = ((NATIONAL_AVG_MONTHLY_KG_CO2 - userKgCO2) / NATIONAL_AVG_MONTHLY_KG_CO2) * 100;
  return {
    percent: Math.abs(Math.round(diff)),
    direction: diff >= 0 ? 'below' : 'above', // below = good, above = needs improvement
  };
}
