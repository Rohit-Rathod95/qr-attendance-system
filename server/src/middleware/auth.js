// src/middleware/auth.js
const jwt = require('jsonwebtoken');
require('dotenv').config();

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) return res.sendStatus(401);

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.userId = user.id;
    req.userRole = user.role;
    next();
  });
};

// Authorize roles: admin or staff (faculty)
const authorizeFacultyOrAdmin = (req, res, next) => {
  if (req.userRole !== 'admin' && req.userRole !== 'staff') {
    return res.status(403).json({ message: 'Access denied.' });
  }
  next();
};

module.exports = authenticateToken;
module.exports.authorizeFacultyOrAdmin = authorizeFacultyOrAdmin;