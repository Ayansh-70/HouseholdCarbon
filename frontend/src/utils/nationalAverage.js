export const NATIONAL_AVG_MONTHLY_KG_CO2 = 150;

export function compareToAverage(userKgCO2) {
  const diff = ((NATIONAL_AVG_MONTHLY_KG_CO2 - userKgCO2) / NATIONAL_AVG_MONTHLY_KG_CO2) * 100;
  return {
    percent: Math.abs(Math.round(diff)),
    direction: diff >= 0 ? 'below' : 'above', // below = good, above = needs improvement
  };
}
