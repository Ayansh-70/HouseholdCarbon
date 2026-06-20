const { GoogleGenerativeAI } = require('@google/generative-ai');

// Ensure API key exists on startup
if (!process.env.GEMINI_API_KEY && process.env.NODE_ENV !== 'test') {
  console.error("CRITICAL ERROR: GEMINI_API_KEY environment variable is missing.");
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const FALLBACK_INSIGHTS = {
  electricity: {
    summary: "Your electricity usage is the largest contributor to your footprint.",
    severity: "medium",
    actions: [
      { priority: 1, category: "electricity", title: "Switch to LED bulbs", detail: "Replace incandescent bulbs to reduce lighting energy by 80%.", estimated_saving_kg: 15 },
      { priority: 2, category: "behavior", title: "Unplug idle electronics", detail: "Stop phantom power draw from TVs and computers.", estimated_saving_kg: 5 },
      { priority: 3, category: "electricity", title: "Cold water laundry", detail: "Wash clothes in cold water to save heating energy.", estimated_saving_kg: 10 }
    ],
    encouragement: "Small changes in daily habits add up to big impacts!"
  },
  naturalGas: {
    summary: "Heating is the primary driver of your household emissions.",
    severity: "high",
    actions: [
      { priority: 1, category: "heating", title: "Lower thermostat by 2°", detail: "Reducing your winter thermostat saves significant gas.", estimated_saving_kg: 25 },
      { priority: 2, category: "heating", title: "Improve insulation", detail: "Seal drafts around windows and doors.", estimated_saving_kg: 15 },
      { priority: 3, category: "heating", title: "Smart thermostat", detail: "Automate heating schedules to avoid wasting energy when away.", estimated_saving_kg: 20 }
    ],
    encouragement: "Optimizing your heating will quickly cut down your footprint!"
  },
  water: {
    summary: "Water treatment and heating is your highest impact area.",
    severity: "medium",
    actions: [
      { priority: 1, category: "water", title: "Install low-flow fixtures", detail: "Use aerators and efficient showerheads.", estimated_saving_kg: 8 },
      { priority: 2, category: "water", title: "Fix leaks promptly", detail: "A running toilet can waste hundreds of liters a day.", estimated_saving_kg: 5 },
      { priority: 3, category: "behavior", title: "Full loads only", detail: "Run dishwashers and laundry machines fully loaded.", estimated_saving_kg: 12 }
    ],
    encouragement: "Conserving water saves both energy and natural resources!"
  },
  default: {
    summary: "Your footprint is balanced across multiple utilities.",
    severity: "low",
    actions: [
      { priority: 1, category: "behavior", title: "Turn off lights", detail: "Always turn off lights when leaving a room.", estimated_saving_kg: 5 },
      { priority: 2, category: "heating", title: "Adjust thermostat", detail: "Reduce heating and cooling when away.", estimated_saving_kg: 15 },
      { priority: 3, category: "water", title: "Shorter showers", detail: "Cut showers by 2 minutes to save water and heating energy.", estimated_saving_kg: 10 }
    ],
    encouragement: "Every step counts towards a more sustainable future!"
  }
};

const GLOBAL_RATE_LIMIT = 12; // Max 12 requests per minute globally
const GLOBAL_RATE_WINDOW_MS = 60 * 1000; // 1 minute
let requestTimestamps = [];

function checkGlobalRateLimit() {
  const now = Date.now();
  // Clean up timestamps older than the 1-minute window
  requestTimestamps = requestTimestamps.filter(timestamp => now - timestamp < GLOBAL_RATE_WINDOW_MS);
  
  if (requestTimestamps.length >= GLOBAL_RATE_LIMIT) {
    return false; // Limit exceeded
  }
  
  requestTimestamps.push(now);
  return true; // OK
}

async function getPersonalizedInsights(footprintData) {
  const { breakdown, householdSize, electricityCo2, gasCo2, waterCo2, total, perCapita, fuelType } = footprintData;

  // Provide sensible fallbacks for potentially missing data
  const safeBreakdown = breakdown || {};
  const e_raw = safeBreakdown.electricity ?? 0;
  const g_raw = safeBreakdown.naturalGas ?? 0;
  const w_raw = safeBreakdown.water ?? 0;
  const h_size = householdSize ?? 1;
  
  const e_co2 = electricityCo2 ?? 0;
  const g_co2 = gasCo2 ?? 0;
  const w_co2 = waterCo2 ?? 0;
  const t_co2 = total ?? 0;
  const p_co2 = perCapita ?? 0;
  const f_type = fuelType || 'unknown';

  let dominantCategory = 'electricity';
  let maxAmount = e_co2;
  if (g_co2 > maxAmount) { maxAmount = g_co2; dominantCategory = 'naturalGas'; }
  if (w_co2 > maxAmount) { maxAmount = w_co2; dominantCategory = 'water'; }

  const systemPrompt = `You are an environmental data analyst specializing in residential carbon reduction. You receive structured household consumption data and return a prioritized action plan. Always respond in valid JSON only. No preamble, no markdown, no explanation outside the JSON structure.`;

  const userPrompt = `Household data:
- Monthly electricity: ${e_raw} kWh (CO₂e: ${e_co2} kg)
- Monthly heating fuel: ${g_raw} therms of ${f_type} (CO₂e: ${g_co2} kg)
- Monthly water: ${w_raw} liters (CO₂e: ${w_co2} kg)
- Household size: ${h_size} people
- Total monthly footprint: ${t_co2} kg CO₂e
- Per-capita footprint: ${p_co2} kg CO₂e/person
- Global average for reference: 375 kg CO₂e/month

Return a JSON object with this exact shape:
{
  "summary": "One sentence summary of the household's situation and biggest opportunity",
  "severity": "low" | "medium" | "high",
  "actions": [
    {
      "priority": 1,
      "category": "electricity" | "heating" | "water" | "behavior",
      "title": "Short action title (max 8 words)",
      "detail": "Specific actionable detail with estimated CO₂e savings in kg/month",
      "estimated_saving_kg": 15
    }
  ],
  "encouragement": "One short motivational sentence tailored to their specific data"
}`;

  // Defensive guard: validate that no literal 'undefined' string leaked into the prompt
  if (userPrompt.includes('undefined') || userPrompt.includes('null')) {
    console.error("CRITICAL: userPrompt contains 'undefined' or 'null'. Falling back to avoid broken AI response.");
    return {
      insights: FALLBACK_INSIGHTS[dominantCategory] || FALLBACK_INSIGHTS.default,
      source: 'fallback'
    };
  }

  // Check global rate limit before calling API
  if (!checkGlobalRateLimit()) {
    console.warn("GLOBAL RATE LIMIT EXCEEDED. Returning fallback insights.");
    return {
      insights: FALLBACK_INSIGHTS[dominantCategory] || FALLBACK_INSIGHTS.default,
      source: 'fallback'
    };
  }

  try {
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash-lite",
      systemInstruction: systemPrompt 
    });
    
    let result;
    try {
      result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
        generationConfig: { temperature: 0.2 }
      }, { timeout: 8000 });
    } catch (apiError) {
      // We explicitly check for 503 Service Unavailable, which is a transient
      // server error that often resolves on immediate retry. 400, 401, or 404
      // indicate persistent client/auth issues and should not be retried.
      if (apiError.message && apiError.message.includes('503')) {
        console.warn("Gemini API returned 503. Retrying once in 1.5s...");
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        result = await model.generateContent({
          contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
          generationConfig: { temperature: 0.2 }
        }, { timeout: 8000 });
      } else {
        throw apiError;
      }
    }

    const responseText = result.response.text().trim();
    
    let cleanJson = responseText.replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();

    const insights = JSON.parse(cleanJson);

    if (insights && insights.summary && Array.isArray(insights.actions)) {
      return { insights, source: 'ai' };
    } else {
      throw new Error("Invalid AI response shape");
    }
  } catch (error) {
    console.error("Gemini API call failed or timed out:", error);
    // Fallback contract
    return {
      insights: FALLBACK_INSIGHTS[dominantCategory] || FALLBACK_INSIGHTS.default,
      source: 'fallback'
    };
  }
}

async function getGoalCoaching(coachingData) {
  const { milestone, goalPercent, goalDays, baselineCarbon, currentCarbon, daysElapsed } = coachingData;
  const reduction = (baselineCarbon - currentCarbon).toFixed(1);
  const pct = ((reduction / baselineCarbon) * 100).toFixed(1);

  const prompt = `You are an encouraging but concise carbon reduction coach. A household has just crossed the ${milestone}% milestone of their carbon reduction goal.

Their stats:
- Goal: reduce carbon footprint by ${goalPercent}% over ${goalDays} days
- Baseline footprint: ${baselineCarbon.toFixed(1)} kg CO₂/month
- Current footprint: ${currentCarbon.toFixed(1)} kg CO₂/month
- Days elapsed: ${daysElapsed} of ${goalDays}
- Reduction so far: ${reduction} kg CO₂ (${pct}%)

Write exactly 2–3 sentences:
1. Celebrate their progress warmly and specifically
2. Identify the single highest-impact next action they can take based on their current trajectory
3. (Optional) End with a motivational one-liner

Tone: warm, specific, not generic. No bullet points. No markdown. Plain text only.`;

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.5 }
    });
    
    return result.response.text().trim();
  } catch (error) {
    console.error("Gemini API call failed for goal coaching:", error);
    return "Great progress! Keep focusing on your highest-use category to stay on track.";
  }
}

module.exports = { getPersonalizedInsights, getGoalCoaching };
