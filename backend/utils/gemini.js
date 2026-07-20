const { GoogleGenAI } = require('@google/genai');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

/**
 * Generate a personalized health advice paragraph using Gemini AI.
 *
 * @param {string}  childName   - The child's name
 * @param {object}  habits      - { sleepDuration, dailySteps, dietQuality }
 * @param {object}  prediction  - { result, confidence }
 * @returns {Promise<string>}   - AI-generated suggestion text
 */
async function generateHealthAdvice(childName, habits, prediction) {
  // If no real API key is configured, return a sensible fallback immediately
  if (!GEMINI_API_KEY || GEMINI_API_KEY.startsWith('your_')) {
    return buildFallbackAdvice(childName, habits, prediction.result);
  }

  try {
    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

    const prompt = `You are a warm, professional student-health advisor speaking to a teacher or parent.

Student's Name: ${childName}
Predicted Health: ${prediction.result} (confidence ${prediction.confidence.toFixed(1)}%)
Recent Habits:
- Sleep: ${habits.sleepDuration} hours/night
- Daily Steps: ${habits.dailySteps}
- Diet Quality: ${habits.dietQuality}

Write exactly ONE short paragraph (max 120 words) that:
1. Gently interprets what this prediction means for ${childName}.
2. Gives 2-3 specific, actionable suggestions tied to the habits above.
3. Ends with an encouraging sentence.

Use plain English. No markdown. No lists. Just one flowing paragraph.`;

    const result = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    const text = result.text;

    if (text && text.trim()) {
      return text.trim();
    }
    return buildFallbackAdvice(childName, habits, prediction.result);
  } catch (error) {
    console.error('Gemini API error:', error.message);
    return buildFallbackAdvice(childName, habits, prediction.result);
  }
}

/**
 * Fallback advice generator — used when Gemini is unavailable.
 */
function buildFallbackAdvice(childName, habits, result) {
  const { sleepDuration, dailySteps, dietQuality } = habits;

  const tips = [];

  if (sleepDuration < 7) {
    tips.push('gradually increasing their sleep to 8-9 hours by setting a consistent bedtime');
  }
  if (sleepDuration >= 7 && sleepDuration <= 9) {
    tips.push('maintaining their healthy sleep routine');
  }
  if (sleepDuration > 9) {
    tips.push('slightly reducing sleep to 8-9 hours and adding more daytime activity');
  }

  if (dailySteps < 5000) {
    tips.push('aiming for at least 8,000 daily steps — a family walk after dinner helps');
  } else if (dailySteps < 8000) {
    tips.push('working toward 10,000 daily steps for better cardiovascular health');
  } else {
    tips.push('keeping up their excellent step count');
  }

  if (dietQuality === 'Poor') {
    tips.push('replacing processed snacks with fruits, vegetables, and whole grains');
  } else if (dietQuality === 'Average') {
    tips.push('adding one more serving of vegetables and reducing sugary drinks');
  }

  const outcome =
    result === 'Fit'
      ? `is showing great health indicators. ${childName} would benefit from ${tips.join(', ')}. Keep encouraging these positive habits!`
      : result === 'Unhealthy'
        ? `has some areas that need attention. Consider ${tips.join(', ')}. Small, consistent changes can lead to big improvements.`
        : `may be at risk. We recommend starting with ${tips.join(', ')} and scheduling a check-up with their pediatrician for personalized guidance.`;

  return outcome;
}

module.exports = { generateHealthAdvice };
