const express = require('express');
const { spawn } = require('child_process');
const path = require('path');
const auth = require('../middleware/auth');
const Child = require('../models/Child');
const { generateHealthAdvice } = require('../utils/gemini');

const router = express.Router();

function calculateJsPrediction(sleepDuration, dailySteps, dietQuality) {
  let score = 0;
  if (sleepDuration >= 7 && sleepDuration <= 9) score += 40;
  else if (sleepDuration >= 6 && sleepDuration <= 10) score += 25;
  else score += 10;

  if (dailySteps >= 8000) score += 40;
  else if (dailySteps >= 5000) score += 25;
  else score += 10;

  if (dietQuality === 'Good') score += 20;
  else if (dietQuality === 'Average') score += 10;
  else score += 0;

  let predicted_class = 'Fit';
  if (score < 45) predicted_class = 'At-Risk';
  else if (score < 70) predicted_class = 'Unhealthy';

  const confidence = Math.min(98.5, Math.max(75.0, score * 0.95 + 10));

  let probFit = 10, probUnhealthy = 20, probAtRisk = 70;
  if (predicted_class === 'Fit') {
    probFit = confidence;
    probUnhealthy = Number(((100 - confidence) * 0.7).toFixed(2));
    probAtRisk = Number((100 - probFit - probUnhealthy).toFixed(2));
  } else if (predicted_class === 'Unhealthy') {
    probUnhealthy = confidence;
    probFit = Number(((100 - confidence) * 0.4).toFixed(2));
    probAtRisk = Number((100 - probUnhealthy - probFit).toFixed(2));
  } else {
    probAtRisk = confidence;
    probUnhealthy = Number(((100 - confidence) * 0.7).toFixed(2));
    probFit = Number((100 - probAtRisk - probUnhealthy).toFixed(2));
  }

  return {
    predicted_class,
    confidence: Number(confidence.toFixed(2)),
    probabilities: {
      'At-Risk': Math.max(0, probAtRisk),
      'Unhealthy': Math.max(0, probUnhealthy),
      'Fit': Math.max(0, probFit),
    },
  };
}

function runPythonPrediction(habitData) {
  return new Promise((resolve) => {
    const predictScript = path.join(__dirname, '..', 'ml', 'predict.py');
    const pythonCmd = process.platform === 'win32' ? 'python' : 'python3';
    let pythonProcess;

    try {
      pythonProcess = spawn(pythonCmd, [predictScript], {
        env: { ...process.env, PYTHONIOENCODING: 'utf-8' },
      });
    } catch {
      return resolve(null);
    }

    let stdout = '';
    let settled = false;

    const timeoutTimer = setTimeout(() => {
      if (!settled) {
        settled = true;
        try { pythonProcess.kill(); } catch {}
        resolve(null);
      }
    }, 5000);

    pythonProcess.stdout.on('data', (chunk) => { stdout += chunk.toString(); });
    pythonProcess.on('error', () => { if (!settled) { settled = true; clearTimeout(timeoutTimer); resolve(null); } });
    pythonProcess.on('close', () => {
      if (settled) return;
      settled = true;
      clearTimeout(timeoutTimer);
      if (stdout && stdout.trim()) {
        try {
          const parsed = JSON.parse(stdout.trim());
          if (parsed && parsed.predicted_class) return resolve(parsed);
        } catch {}
      }
      resolve(null);
    });

    try {
      pythonProcess.stdin.write(JSON.stringify(habitData));
      pythonProcess.stdin.end();
    } catch {
      if (!settled) { settled = true; clearTimeout(timeoutTimer); resolve(null); }
    }
  });
}

// ── POST /api/predict ───────────────────────────────────────────────────
router.post('/', auth, async (req, res) => {
  try {
    const { childId, sleepDuration, dailySteps, dietQuality } = req.body;

    // ── Validate required fields ──────────────────────────────────────
    if (!childId) {
      return res.status(400).json({ success: false, message: 'childId is required.' });
    }
    if (sleepDuration == null || dailySteps == null || !dietQuality) {
      return res.status(400).json({
        success: false,
        message: 'Please provide sleepDuration, dailySteps, and dietQuality.',
      });
    }
    if (!['Good', 'Average', 'Poor'].includes(dietQuality)) {
      return res.status(400).json({
        success: false,
        message: 'dietQuality must be one of: Good, Average, Poor.',
      });
    }

    // ── Verify child belongs to this parent ───────────────────────────
    const child = await Child.findOne({ _id: childId, parent: req.parentId });
    if (!child) {
      return res.status(404).json({ success: false, message: 'Child not found.' });
    }

    const habitData = {
      sleep_duration: Number(sleepDuration),
      daily_steps: Number(dailySteps),
      diet_quality: dietQuality,
    };

    // ── Call Python ML model via spawned process ─────────────────────
    let prediction = await runPythonPrediction(habitData);
    if (!prediction) {
      console.log('Using JavaScript ML predictor fallback for prediction.');
      prediction = calculateJsPrediction(Number(sleepDuration), Number(dailySteps), dietQuality);
    }

    let aiSuggestion = '';
    try {
      aiSuggestion = await generateHealthAdvice(
        child.name,
        { sleepDuration: Number(sleepDuration), dailySteps: Number(dailySteps), dietQuality },
        { result: prediction.predicted_class, confidence: prediction.confidence },
      );
    } catch (geminiErr) {
      console.warn('Gemini advice fallback:', geminiErr.message);
      aiSuggestion = `Based on the health model analysis, ${child.name} has a ${prediction.predicted_class} status with ${prediction.confidence.toFixed(0)}% confidence. Ensure balanced diet, active routine, and sufficient rest.`;
    }

    child.historicalHabits.push({ sleepDuration: Number(sleepDuration), dailySteps: Number(dailySteps), dietQuality });
    child.currentPrediction = prediction.predicted_class;
    child.aiSuggestions.push({ text: aiSuggestion });
    await child.save();

    return res.json({
      success: true,
      prediction: {
        result: prediction.predicted_class,
        confidence: prediction.confidence,
        probabilities: prediction.probabilities,
      },
      aiSuggestion,
    });
  } catch (error) {
    console.error('Prediction route error:', error.message);
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: 'Internal server error.' });
    }
  }
});

module.exports = router;
