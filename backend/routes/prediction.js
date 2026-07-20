const express = require('express');
const { spawn } = require('child_process');
const path = require('path');
const auth = require('../middleware/auth');
const Child = require('../models/Child');
const { generateHealthAdvice } = require('../utils/gemini');

const router = express.Router();

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
    const predictScript = path.join(__dirname, '..', 'ml', 'predict.py');

    const pythonProcess = spawn('python', [predictScript], {
      env: { ...process.env, PYTHONIOENCODING: 'utf-8' },
    });

    pythonProcess.stdin.write(JSON.stringify(habitData));
    pythonProcess.stdin.end();

    let stdout = '';
    let stderr = '';

    pythonProcess.stdout.on('data', (chunk) => { stdout += chunk.toString(); });
    pythonProcess.stderr.on('data', (chunk) => { stderr += chunk.toString(); });

    pythonProcess.on('close', async (exitCode) => {
      if (exitCode !== 0 || stderr) {
        console.error('Python ML error:', stderr);
        return res.status(502).json({
          success: false,
          message: 'Prediction engine failed.',
          details: stderr.trim(),
        });
      }

      let prediction;
      try {
        prediction = JSON.parse(stdout);
      } catch {
        return res.status(502).json({
          success: false,
          message: 'Invalid response from prediction engine.',
        });
      }

      // ── Gemini AI health advice ─────────────────────────────────────
      let aiSuggestion = '';
      try {
        aiSuggestion = await generateHealthAdvice(
          child.name,
          { sleepDuration: Number(sleepDuration), dailySteps: Number(dailySteps), dietQuality },
          { result: prediction.predicted_class, confidence: prediction.confidence },
        );
      } catch (geminiErr) {
        console.warn('Gemini non-fatal error:', geminiErr.message);
        aiSuggestion = 'AI advice temporarily unavailable. Please consult a healthcare professional.';
      }

      // ── Persist to MongoDB ──────────────────────────────────────────
      child.historicalHabits.push({ sleepDuration: Number(sleepDuration), dailySteps: Number(dailySteps), dietQuality });
      child.currentPrediction = prediction.predicted_class;
      child.aiSuggestions.push({ text: aiSuggestion });
      await child.save();

      // ── Return to frontend ─────────────────────────────────────────
      res.json({
        success: true,
        prediction: {
          result: prediction.predicted_class,
          confidence: prediction.confidence,
          probabilities: prediction.probabilities,
        },
        aiSuggestion,
      });
    });
  } catch (error) {
    console.error('Prediction route error:', error.message);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
});

module.exports = router;
