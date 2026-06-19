const express = require('express');
const { getGoalCoaching } = require('../services/gemini.service');
const { z } = require('zod');

const router = express.Router();

const goalCoachingSchema = z.object({
  milestone: z.union([z.literal(25), z.literal(50), z.literal(75), z.literal(100)]),
  goalPercent: z.number().positive(),
  goalDays: z.number().positive(),
  baselineCarbon: z.number().positive(),
  currentCarbon: z.number().positive(),
  daysElapsed: z.number().min(0)
}).strict();

router.post('/goal-coaching', async (req, res) => {
  try {
    const validatedData = goalCoachingSchema.parse(req.body);
    
    // Call the AI service
    const message = await getGoalCoaching(validatedData);

    return res.status(200).json({ success: true, message });
  } catch (error) {
    console.error("Error in POST /goal-coaching:", error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        details: error.issues
      });
    }

    // Fallback message per requirements if something unexpected breaks
    return res.status(200).json({ 
      success: true, 
      message: "Great progress! Keep focusing on your highest-use category to stay on track." 
    });
  }
});

module.exports = router;
