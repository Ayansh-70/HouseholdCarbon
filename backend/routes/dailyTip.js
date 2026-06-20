const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');

let cachedTip = null;
let cachedTipDate = null;

const FALLBACK_TIPS = [
  "Switch your geyser off 10 minutes before you finish bathing — it stays hot.",
  "Run your washing machine with a full load on cold water to save heating energy.",
  "Turn off the AC 15 minutes before leaving the room.",
  "Fix leaky taps promptly; a dripping tap wastes up to 20 liters a day.",
  "Unplug phantom energy drainers like chargers and TVs when not in use."
];

router.get('/daily-tip', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    if (cachedTipDate === today && cachedTip) {
      return res.status(200).json({ success: true, tip: cachedTip });
    }

    if (process.env.GEMINI_API_KEY) {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
      const prompt = "Generate one short, practical, specific household energy or water saving tip for an Indian household. Maximum 18 words. No markdown, no quotes, no preamble — output ONLY the tip text itself. Make it concrete and actionable, not generic advice like 'save energy'. Example style: 'Switch your geyser off 10 minutes before you finish bathing — it stays hot.'";
      
      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7 }
      }, { timeout: 5000 });
      
      const text = result.response.text().trim().replace(/^["']|["']$/g, '');
      if (text) {
        cachedTip = text;
        cachedTipDate = today;
        return res.status(200).json({ success: true, tip: cachedTip });
      }
    }
    
    // Fallback if API fails or no text
    throw new Error('Fallback triggered');
  } catch (error) {
    console.error("Daily tip generation failed:", error.message || error);
    const dayOfMonth = new Date().getDate();
    const fallbackTip = FALLBACK_TIPS[dayOfMonth % FALLBACK_TIPS.length];
    return res.status(200).json({ success: true, tip: fallbackTip, source: 'fallback' });
  }
});

module.exports = router;
