// src/routes/attendance.js
const express = require('express');
const pool = require('../db');
const authenticateToken = require('../middleware/auth');
const zod = require('zod');

const router = express.Router();

const attendanceSchema = zod.object({
  scannedQrCode: zod.string().min(1)
});

router.post('/mark', authenticateToken, async (req, res) => {
  const studentId = req.userId;
  if (req.userRole !== 'student') {
    return res.status(403).json({ message: 'Only students can mark attendance.' });
  }

  try {
    const { scannedQrCode } = attendanceSchema.parse(req.body);

    const [facilityRows] = await pool.query('SELECT id FROM facilities WHERE qr_code = ?', [scannedQrCode]);
    const facility = facilityRows[0];
    if (!facility) {
      return res.status(404).json({ message: 'Facility not found with this QR code.' });
    }

    const facilityId = facility.id;

    const [lastScanRows] = await pool.query(
      'SELECT scanned_at FROM attendance WHERE student_id = ? AND facility_id = ? ORDER BY scanned_at DESC LIMIT 1',
      [studentId, facilityId]
    );

    if (lastScanRows.length > 0) {
      const lastScannedAt = new Date(lastScanRows[0].scanned_at);
      const cooldownPeriod = 60 * 1000;
      if (Date.now() - lastScannedAt.getTime() < cooldownPeriod) {
        return res.status(409).json({ message: 'Duplicate scan attempt. Please wait a moment.' });
      }
    }

    await pool.query(
      'INSERT INTO attendance (student_id, facility_id, scanned_at) VALUES (?, ?, NOW())',
      [studentId, facilityId]
    );

    res.status(201).json({ message: 'Attendance marked successfully.' });

  } catch (error) {
    if (error instanceof zod.ZodError) {
      return res.status(400).json({ errors: error.errors });
    }
    console.error('Attendance marking error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
});

module.exports = router;