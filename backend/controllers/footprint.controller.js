const { calculateFootprint } = require('../utils/calculateFootprint');
const { getPersonalizedInsights } = require('../services/gemini.service');
const crypto = require('crypto');

// In-memory store (as allowed per instructions). Note: will reset on server restart.
const historyStore = [];

async function submitFootprint(req, res) {
  try {
    const inputData = req.body;

    // 1. Calculate deterministic footprint
    const calculation = calculateFootprint(inputData);

    // 2. Fetch AI Insights
    // Pass raw inputs as breakdown and calculated co2 fields to aiData
    const aiData = {
      breakdown: {
        electricity: inputData.electricity,
        naturalGas: inputData.naturalGas,
        water: inputData.water
      },
      householdSize: inputData.householdSize,
      electricity_co2: calculation.breakdown.electricity,
      gas_co2: calculation.breakdown.naturalGas,
      water_co2: calculation.breakdown.water,
      total: calculation.totalCO2e,
      per_capita: calculation.perCapitaCO2e,
      fuel_type: inputData.heatingFuel || 'unknown'
    };
    
    const { insights, source } = await getPersonalizedInsights(aiData);

    // 3. Save to store
    const entry = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      inputs: inputData,
      calculation,
      insights,
      insightsSource: source
    };

    historyStore.push(entry);

    // 4. Return response
    return res.status(200).json({
      success: true,
      data: entry
    });

  } catch (error) {
    console.error("Error in submitFootprint:", error);
    return res.status(500).json({ 
      success: false, 
      error: "An internal server error occurred while processing the footprint." 
    });
  }
}

function getHistory(req, res) {
  return res.status(200).json({
    success: true,
    data: historyStore
  });
}

module.exports = {
  submitFootprint,
  getHistory,
  historyStore // exported for testing purposes if needed
};
