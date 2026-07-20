const jwt = require('jsonwebtoken');
const Parent = require('../models/Parent');

const auth = async (req, res, next) => {
  try {
    const header = req.headers.authorization;

    if (!header || !header.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.',
      });
    }

    const token = header.split(' ')[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const parent = await Parent.findById(decoded.id);

    if (!parent) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Parent not found.',
      });
    }

    req.parent = parent;
    req.parentId = parent._id;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token.',
    });
  }
};

module.exports = auth;
