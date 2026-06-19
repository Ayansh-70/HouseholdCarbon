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

async function getPersonalizedInsights(footprintData) {
  const { breakdown, householdSize, electricity_co2, gas_co2, water_co2, total, per_capita, fuel_type } = footprintData;

  let dominantCategory = 'electricity';
  let maxAmount = breakdown.electricity || 0;
  if ((breakdown.naturalGas || 0) > maxAmount) { maxAmount = breakdown.naturalGas; dominantCategory = 'naturalGas'; }
  if ((breakdown.water || 0) > maxAmount) { maxAmount = breakdown.water; dominantCategory = 'water'; }

  const systemPrompt = `You are an environmental data analyst specializing in residential carbon reduction. You receive structured household consumption data and return a prioritized action plan. Always respond in valid JSON only. No preamble, no markdown, no explanation outside the JSON structure.`;

  const userPrompt = `Household data:
- Monthly electricity: ${breakdown.electricity} kWh (CO₂e: ${electricity_co2} kg)
- Monthly heating fuel: ${breakdown.naturalGas} therms of ${fuel_type} (CO₂e: ${gas_co2} kg)
- Monthly water: ${breakdown.water} liters (CO₂e: ${water_co2} kg)
- Household size: ${householdSize} people
- Total monthly footprint: ${total} kg CO₂e
- Per-capita footprint: ${per_capita} kg CO₂e/person
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
