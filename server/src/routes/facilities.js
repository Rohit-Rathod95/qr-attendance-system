// src/routes/facilities.js
const express = require('express');
const pool = require('../db');
const authenticateToken = require('../middleware/auth');
const zod = require('zod');
const jwt = require('jsonwebtoken');
const router = express.Router();

const createFacilitySchema = zod.object({
  name: zod.string().min(1),
  location: zod.string().min(1),
  qr_code: zod.string().min(1),
});

// GET /facilities - List all facilities (admin/faculty can view)
router.get('/', authenticateToken, async (req, res) => {
  if (req.userRole !== 'admin' && req.userRole !== 'staff') {
    return res.status(403).json({ message: 'Access denied.' });
  }

  try {
    const [facilities] = await pool.query('SELECT id, name, location, qr_code, created_at FROM facilities');
    res.json(facilities);
  } catch (error) {
    console.error('Error fetching facilities:', error);
    res.status(500).json({ message: 'Server error.' });
  }
});

// POST /facilities - Create a new facility (admin only)
router.post('/', authenticateToken, async (req, res) => {
  if (req.userRole !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Only administrators can create facilities.' });
  }

  try {
    const { name, location, qr_code } = createFacilitySchema.parse(req.body);

    const [result] = await pool.query(
      'INSERT INTO facilities (name, location, qr_code) VALUES (?, ?, ?)',
      [name, location, qr_code]
    );

    res.status(201).json({ message: 'Facility created successfully.', facilityId: result.insertId });

  } catch (error) {
    if (error instanceof zod.ZodError) {
      return res.status(400).json({ errors: error.errors });
    }
    console.error('Error creating facility:', error);
    res.status(500).json({ message: 'Server error.' });
  }
});

router.post('/:id/qr/rotate', authenticateToken, async (req, res) => {
  if (req.userRole !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Only administrators can generate QR codes.' });
  }

  try {
    const facilityId = req.params.id;
    const now = new Date();
    const ttlSeconds = parseInt(process.env.QR_TOKEN_TTL_SEC || 300, 10);
    const validUntil = new Date(now.getTime() + ttlSeconds * 1000);

    // Payload for the JWT
    const payload = {
      facility_id: facilityId,
      iat: Math.floor(now.getTime() / 1000),
      exp: Math.floor(validUntil.getTime() / 1000),
      nonce: Math.random().toString(36).substring(7), // Unique string
    };

    // Generate the signed JWT token
    const qrToken = jwt.sign(payload, process.env.JWT_SECRET);

    // Insert the new token into qr_sessions table
    await pool.query(
      'INSERT INTO qr_sessions (facility_id, qr_token, valid_from, valid_until) VALUES (?, ?, ?, ?)',
      [facilityId, qrToken, now, validUntil]
    );

    res.status(200).json({ qrToken });

  } catch (error) {
    console.error('Error generating QR token:', error);
    res.status(500).json({ message: 'Server error.' });
  }
});


module.exports = router;