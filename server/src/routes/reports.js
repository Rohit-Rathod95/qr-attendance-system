// src/routes/reports.js
const express = require('express');
const pool = require('../db');
const authenticateToken = require('../middleware/auth');
const router = express.Router();

// Middleware to restrict access to faculty and admins
const authorizeFacultyOrAdmin = (req, res, next) => {
  if (req.userRole !== 'admin' && req.userRole !== 'staff') {
    return res.status(403).json({ message: 'Access denied. You must be a faculty or administrator.' });
  }
  next();
};

// GET /reports/facility-usage
router.get('/facility-usage', authenticateToken, authorizeFacultyOrAdmin, async (req, res) => {
  try {
    const { facilityId, from, to } = req.query;
    if (!facilityId || !from || !to) {
      return res.status(400).json({ message: 'Missing facilityId, from, or to parameters.' });
    }
    
    const [rows] = await pool.query(
      `SELECT * FROM attendance WHERE facility_id = ? AND scanned_at BETWEEN ? AND ?`,
      [facilityId, from, to]
    );

    res.json(rows);
  } catch (error) {
    console.error('Error fetching facility usage report:', error);
    res.status(500).json({ message: 'Server error.' });
  }
});

// GET /reports/attendance
router.get('/attendance', authenticateToken, authorizeFacultyOrAdmin, async (req, res) => {
  try {
    const { facilityId, date } = req.query;
    if (!facilityId || !date) {
      return res.status(400).json({ message: 'Missing facilityId or date parameter.' });
    }

    const [rows] = await pool.query(
      `SELECT 
         s.roll_no, s.name, s.department, a.scanned_at 
       FROM attendance a
       JOIN students s ON a.student_id = s.id
       WHERE a.facility_id = ? AND DATE(a.scanned_at) = ?`,
      [facilityId, date]
    );

    res.json(rows);
  } catch (error) {
    console.error('Error fetching attendance report:', error);
    res.status(500).json({ message: 'Server error.' });
  }
});

// GET /me/attendance - Student history
router.get('/me/attendance', authenticateToken, async (req, res) => {
  if (req.userRole !== 'student') {
    return res.status(403).json({ message: 'Access denied. Only students can view this report.' });
  }

  try {
    const { from, to } = req.query;
    const studentId = req.userId;

    let rows;
    if (from && to) {
      [rows] = await pool.query(
        `SELECT
           f.name AS facility_name, f.location, a.scanned_at
         FROM attendance a
         JOIN facilities f ON a.facility_id = f.id
         WHERE a.student_id = ? AND a.scanned_at BETWEEN ? AND ?
         ORDER BY a.scanned_at DESC`,
        [studentId, from, to]
      );
    } else {
      [rows] = await pool.query(
        `SELECT
           f.name AS facility_name, f.location, a.scanned_at
         FROM attendance a
         JOIN facilities f ON a.facility_id = f.id
         WHERE a.student_id = ?
         ORDER BY a.scanned_at DESC
         LIMIT 50`,
        [studentId]
      );
    }

    res.json(rows);
  } catch (error) {
    console.error('Error fetching student attendance history:', error);
    res.status(500).json({ message: 'Server error.' });
  }
});

module.exports = router;