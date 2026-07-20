const express = require('express');
const jwt = require('jsonwebtoken');
const Parent = require('../models/Parent');
const auth = require('../middleware/auth');

const router = express.Router();

// Generate JWT token
const generateToken = (parentId) => {
  return jwt.sign({ id: parentId }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });
};

// ─── POST /api/auth/register ────────────────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, and password.',
      });
    }

    // Check if parent already exists
    const existingParent = await Parent.findOne({ email });
    if (existingParent) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email already exists.',
      });
    }

    const parent = await Parent.create({ name, email, password });

    const token = generateToken(parent._id);

    res.status(201).json({
      success: true,
      message: 'Account created successfully!',
      token,
      parent: {
        id: parent._id,
        name: parent.name,
        email: parent.email,
      },
    });
  } catch (error) {
    console.error('Register error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error during registration.',
    });
  }
});

// ─── POST /api/auth/login ───────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password.',
      });
    }

    // Find parent and include password field
    const parent = await Parent.findOne({ email }).select('+password');
    if (!parent) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    const isMatch = await parent.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    const token = generateToken(parent._id);

    res.json({
      success: true,
      message: 'Login successful!',
      token,
      parent: {
        id: parent._id,
        name: parent.name,
        email: parent.email,
      },
    });
  } catch (error) {
    console.error('Login error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error during login.',
    });
  }
});

// ─── GET /api/auth/me ── (get current logged-in parent) ─────────────────
router.get('/me', auth, async (req, res) => {
  res.json({
    success: true,
    parent: {
      id: req.parent._id,
      name: req.parent.name,
      email: req.parent.email,
    },
  });
});

module.exports = router;
