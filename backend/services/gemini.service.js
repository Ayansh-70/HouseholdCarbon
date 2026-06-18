const { GoogleGenerativeAI } = require('@google/generative-ai');

// Ensure API key exists on startup
if (!process.env.GEMINI_API_KEY && process.env.NODE_ENV !== 'test') {
  console.error("CRITICAL ERROR: GEMINI_API_KEY environment variable is missing.");
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const FALLBACK_INSIGHTS = {
  electricity: [
    "Switch to LED light bulbs to reduce electricity usage.",
    "Unplug unused electronics to prevent phantom power draw.",
    "Consider washing laundry in cold water."
  ],
  naturalGas: [
    "Lower your thermostat by 2 degrees in winter to save natural gas.",
    "Check your home for drafts and improve insulation.",
    "Consider a smart thermostat to optimize heating schedules."
  ],
  water: [
    "Install low-flow showerheads and faucet aerators.",
    "Fix any leaky faucets or running toilets promptly.",
    "Run the dishwasher and washing machine only with full loads."
  ],
  default: [
    "Turn off lights when leaving a room.",
    "Reduce heating and cooling when you are away from home.",
    "Take shorter showers to save water and energy."
  ]
};

async function getPersonalizedInsights(footprintData) {
  const { breakdown, householdSize } = footprintData;

  // Determine dominant category for fallback
  let dominantCategory = 'electricity';
  let maxAmount = breakdown.electricity;

  if (breakdown.naturalGas > maxAmount) {
    maxAmount = breakdown.naturalGas;
    dominantCategory = 'naturalGas';
  }
  if (breakdown.water > maxAmount) {
    maxAmount = breakdown.water;
    dominantCategory = 'water';
  }

  const prompt = `You are a sustainability expert providing practical, tailored carbon reduction tips for a household of ${householdSize}.
Here is their monthly utility carbon footprint breakdown (in kg CO2e):
- Electricity: ${breakdown.electricity}
- Natural Gas: ${breakdown.naturalGas}
- Water: ${breakdown.water}
- Heating Adjustment (penalty for oil heating, 0 if electric/gas): ${breakdown.heatingAdjustment}

Based on this specific data, provide 3 to 5 highly specific, prioritized, practical actions this household can take to reduce their footprint.
Prioritize tips for their highest emission category.
Return ONLY a valid JSON array of strings. Do not include markdown formatting like \`\`\`json. Just the array.`;

  try {
    // Note: this model was chosen for stability and availability over raw capability, since the insights-generation task here is simple (short structured output, no complex reasoning needed). If this specific model is ever deprecated, check https://ai.google.dev/gemini-api/docs/models for the current GA-tier flash/flash-lite model and prefer GA over preview/experimental tiers for the same reason.
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" }); // Fast and cheap model for this
    
    let result;
    try {
      // Set a timeout using AbortController (available in Node.js)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout

      result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.2,
        }
      }, { signal: controller.signal });
      clearTimeout(timeoutId);
    } catch (apiError) {
      if (apiError.message && apiError.message.includes('503')) {
        console.warn("Gemini API returned 503. Retrying once in 1.5s...");
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        const retryController = new AbortController();
        const retryTimeoutId = setTimeout(() => retryController.abort(), 8000);
        result = await model.generateContent({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.2,
          }
        }, { signal: retryController.signal });
        clearTimeout(retryTimeoutId);
      } else {
        throw apiError;
      }
    }

    const responseText = result.response.text().trim();
    
    // Clean up potential markdown formatting from Gemini
    let cleanJson = responseText;
    if (cleanJson.startsWith('```json')) {
      cleanJson = cleanJson.substring(7);
    }
    if (cleanJson.startsWith('```')) {
      cleanJson = cleanJson.substring(3);
    }
    if (cleanJson.endsWith('```')) {
      cleanJson = cleanJson.substring(0, cleanJson.length - 3);
    }
    cleanJson = cleanJson.trim();

    const insights = JSON.parse(cleanJson);

    if (Array.isArray(insights) && insights.length >= 3 && insights.length <= 5 && typeof insights[0] === 'string') {
      return { insights, source: 'ai' };
    } else {
      throw new Error("Invalid AI response shape");
    }
  } catch (error) {
    console.error("Gemini API call failed or timed out:", error.message);
    // Fallback contract
    return {
      insights: FALLBACK_INSIGHTS[dominantCategory] || FALLBACK_INSIGHTS.default,
      source: 'fallback'
    };
  }
}

module.exports = { getPersonalizedInsights };
