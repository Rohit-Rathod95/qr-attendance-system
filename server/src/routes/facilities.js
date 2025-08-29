// src/routes/facilities.js
const express = require('express');
const pool = require('../db');
const authenticateToken = require('../middleware/auth');
const { authorizeFacultyOrAdmin } = require('../middleware/auth');
const zod = require('zod');
const jwt = require('jsonwebtoken');
const router = express.Router();

const createFacilitySchema = zod.object({
  name: zod.string().min(1),
  location: zod.string().min(1),
  qr_code: zod.string().min(1),
  department_id: zod.number().int().positive(),
  type: zod.enum(['Lab', 'Classroom', 'Other']),
});

// GET /facilities - List all facilities (admin/faculty can view)
router.get('/', authenticateToken, authorizeFacultyOrAdmin, async (req, res) => {
  try {
    const { departmentId, type } = req.query;
    let facilities;
    if (departmentId && type) {
      [facilities] = await pool.query(
        `SELECT f.id, f.name, f.location, f.qr_code, f.type, f.created_at, f.department_id, d.name AS department_name
         FROM facilities f
         LEFT JOIN departments d ON f.department_id = d.id
         WHERE f.department_id = ? AND f.type = ?`,
        [departmentId, type]
      );
    } else if (departmentId) {
      [facilities] = await pool.query(
        `SELECT f.id, f.name, f.location, f.qr_code, f.type, f.created_at, f.department_id, d.name AS department_name
         FROM facilities f
         LEFT JOIN departments d ON f.department_id = d.id
         WHERE f.department_id = ?`,
        [departmentId]
      );
    } else if (type) {
      [facilities] = await pool.query(
        `SELECT f.id, f.name, f.location, f.qr_code, f.type, f.created_at, f.department_id, d.name AS department_name
         FROM facilities f
         LEFT JOIN departments d ON f.department_id = d.id
         WHERE f.type = ?`,
        [type]
      );
    } else {
      [facilities] = await pool.query(
        `SELECT f.id, f.name, f.location, f.qr_code, f.type, f.created_at, f.department_id, d.name AS department_name
         FROM facilities f
         LEFT JOIN departments d ON f.department_id = d.id`
      );
    }
    res.json(facilities);
  } catch (error) {
    console.error('Error fetching facilities:', error);
    res.status(500).json({ message: 'Server error.' });
  }
});

// GET /facilities/departments - List all departments
router.get('/departments', authenticateToken, authorizeFacultyOrAdmin, async (req, res) => {
  try {
    const [departments] = await pool.query('SELECT id, name FROM departments ORDER BY name ASC');
    res.json(departments);
  } catch (error) {
    console.error('Error fetching departments:', error);
    res.status(500).json({ message: 'Server error.' });
  }
});

// POST /facilities - Create a new facility (admin only)
router.post('/', authenticateToken, async (req, res) => {
  if (req.userRole !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Only administrators can create facilities.' });
  }

  try {
    const { name, location, qr_code, department_id, type } = createFacilitySchema.parse(req.body);

    const [result] = await pool.query(
      'INSERT INTO facilities (name, location, qr_code, department_id, type) VALUES (?, ?, ?, ?, ?)',
      [name, location, qr_code, department_id, type]
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