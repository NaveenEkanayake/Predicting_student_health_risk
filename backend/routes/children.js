const express = require('express');
const Child = require('../models/Child');
const auth = require('../middleware/auth');

const router = express.Router();
router.use(auth);

// ── GET /api/children ── list all children for parent ───────────────────
router.get('/', async (req, res) => {
  try {
    const children = await Child.find({ parent: req.parentId })
      .select('name age gender currentPrediction aiSuggestions createdAt')
      .sort({ createdAt: -1 });

    const mapped = children.map((c) => ({
      _id: c._id,
      name: c.name,
      age: c.age,
      gender: c.gender,
      currentPrediction: c.currentPrediction,
      predictionCount: c.aiSuggestions.length,
      createdAt: c.createdAt,
    }));

    res.json({ success: true, count: mapped.length, children: mapped });
  } catch (error) {
    console.error('List children error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to fetch children.' });
  }
});

// ── GET /api/children/stats/overview ── dashboard analytics ─────────────
router.get('/stats/overview', async (req, res) => {
  try {
    const children = await Child.find({ parent: req.parentId });

    const stats = {
      totalChildren: children.length,
      predictionDistribution: { 'At-Risk': 0, Unhealthy: 0, Fit: 0 },
      childrenWithPredictions: 0,
      totalPredictions: 0,
    };

    for (const child of children) {
      if (child.currentPrediction) {
        stats.predictionDistribution[child.currentPrediction]++;
        stats.childrenWithPredictions++;
      }
      stats.totalPredictions += child.aiSuggestions.length;
    }

    res.json({ success: true, stats });
  } catch (error) {
    console.error('Stats error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to fetch stats.' });
  }
});

// ── GET /api/children/:id ── single child with full details ─────────────
router.get('/:id', async (req, res) => {
  try {
    const child = await Child.findOne({ _id: req.params.id, parent: req.parentId });
    if (!child) return res.status(404).json({ success: false, message: 'Child not found.' });
    res.json({ success: true, child });
  } catch (error) {
    console.error('Get child error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to fetch child.' });
  }
});

// ── POST /api/children ── add a new child ──────────────────────────────
router.post('/', async (req, res) => {
  try {
    const { name, age, gender } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Child name is required.' });

    const child = await Child.create({ name, age: age || null, gender: gender || null, parent: req.parentId });
    res.status(201).json({ success: true, message: `${name} added successfully!`, child });
  } catch (error) {
    console.error('Create child error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to add child.' });
  }
});

// ── DELETE /api/children/:id ────────────────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    const child = await Child.findOneAndDelete({ _id: req.params.id, parent: req.parentId });
    if (!child) return res.status(404).json({ success: false, message: 'Child not found.' });
    res.json({ success: true, message: `${child.name} removed.` });
  } catch (error) {
    console.error('Delete child error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to delete child.' });
  }
});

module.exports = router;
