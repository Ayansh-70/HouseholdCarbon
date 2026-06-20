const express = require('express');
const { historyStore } = require('../controllers/footprint.controller');

const router = express.Router();

router.get('/history', (req, res, next) => {
  try {
    // Map the internal history store to the exact format required by the heatmap
    // Schema required: [{ date, totalCarbon, electricity, gas, water }]
    
    const mappedHistory = historyStore.map(entry => {
      // Use the timestamp stored in the entry to generate an ISO date string
      const dateStr = new Date(entry.timestamp).toISOString().split('T')[0];
      
      return {
        date: dateStr,
        totalCarbon: entry.calculation.totalCO2e,
        electricity: entry.calculation.breakdown.electricity || 0,
        gas: entry.calculation.breakdown.naturalGas || 0, // Maps to whatever heating fuel was used
        water: entry.calculation.breakdown.water || 0
      };
    });

    // Return the last 90 entries maximum
    const last90 = mappedHistory.slice(-90);

    return res.status(200).json({
      success: true,
      data: last90
    });
  } catch (error) {
    console.error("Error in GET /history:", error);
    next(error);
  }
});

module.exports = router;
