const mongoose = require('mongoose');

// ── Sub-document: single habit log entry ────────────────────────────────
const habitLogSchema = new mongoose.Schema(
  {
    sleepDuration: {
      type: Number,
      required: true,
      min: [0, 'Sleep duration cannot be negative'],
      max: [24, 'Sleep duration cannot exceed 24 hours'],
    },
    dailySteps: {
      type: Number,
      required: true,
      min: [0, 'Steps cannot be negative'],
      max: [100000, 'Steps seem unrealistic'],
    },
    dietQuality: {
      type: String,
      required: true,
      enum: ['Good', 'Average', 'Poor'],
    },
  },
  { _id: false }
);

// ── Sub-document: single prediction record ──────────────────────────────
const predictionRecordSchema = new mongoose.Schema(
  {
    result: {
      type: String,
      enum: ['At-Risk', 'Unhealthy', 'Fit'],
      required: true,
    },
    confidence: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    aiSuggestion: {
      type: String,
      default: '',
    },
    habits: {
      type: habitLogSchema,
      required: true,
    },
  },
  { timestamps: true }
);

// ── Main Child Schema ───────────────────────────────────────────────────
const childSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Child name is required'],
      trim: true,
    },
    age: {
      type: Number,
      min: [3, 'Age must be at least 3'],
      max: [25, 'Age must be at most 25'],
    },
    gender: {
      type: String,
      enum: ['Male', 'Female', 'Other', null],
      default: null,
    },
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Parent',
      required: true,
      index: true,
    },
    currentPrediction: {
      type: String,
      enum: ['At-Risk', 'Unhealthy', 'Fit', null],
      default: null,
    },
    aiSuggestions: [
      {
        text: String,
        createdAt: { type: Date, default: Date.now },
      },
    ],
    historicalHabits: [habitLogSchema],
  },
  { timestamps: true }
);

// ── Virtual: total prediction count (from aiSuggestions length) ─────────
childSchema.virtual('predictionCount').get(function () {
  return this.aiSuggestions.length;
});

// Ensure virtuals are included in JSON / object output
childSchema.set('toJSON', { virtuals: true });
childSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Child', childSchema);
