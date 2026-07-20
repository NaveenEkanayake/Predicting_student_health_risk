require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const childrenRoutes = require('./routes/children');
const predictionRoutes = require('./routes/prediction');

const app = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ───────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ── Routes ──────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/children', childrenRoutes);
app.use('/api/predict', predictionRoutes);

// ── Health check ────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ success: true, message: 'Student Health API running', timestamp: new Date().toISOString() });
});

// ── Global error handler ────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ success: false, message: 'Internal server error.' });
});

// ── Connect & listen ────────────────────────────────────────────────────
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('[INFO] Connected to MongoDB Atlas - database: student_health');
    app.listen(PORT, () => {
      console.log(`[INFO] Server listening on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('[ERROR] MongoDB connection failed:', err.message);
    process.exit(1);
  });
