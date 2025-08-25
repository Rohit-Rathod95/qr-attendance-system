// src/routes/auth.js
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const zod = require('zod');

const router = express.Router();

const loginSchema = zod.object({
  identifier: zod.string().min(1),
  password: zod.string().min(1),
  role: zod.enum(['student', 'faculty'])
});

const studentRegisterSchema = zod.object({
  roll_no: zod.string().min(1),
  name: zod.string().min(1),
  email: zod.string().email(),
  password: zod.string().min(6),
  department: zod.string().min(1),
  year: zod.number().int().positive()
});

const facultyRegisterSchema = zod.object({
  name: zod.string().min(1),
  email: zod.string().email(),
  password: zod.string().min(6),
  role: zod.enum(['admin', 'staff'])
});

router.post('/login', async (req, res) => {
  try {
    const { identifier, password, role } = loginSchema.parse(req.body);

    let user = null;
    let passwordHash = '';
    let userIdColumn = '';
    let userRoleToSign = role;

    if (role === 'student') {
      const [rows] = await pool.query('SELECT id, password_hash FROM students WHERE roll_no = ?', [identifier]);
      user = rows[0];
      if (user) {
        passwordHash = user.password_hash;
        userIdColumn = 'id';
      }
    } else if (role === 'faculty') {
      const [rows] = await pool.query('SELECT id, password, role FROM faculty WHERE email = ?', [identifier]);
      user = rows[0];
      if (user) {
        passwordHash = user.password;
        userIdColumn = 'id';
        userRoleToSign = user.role;
      }
    }

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    const passwordMatch = await bcrypt.compare(password, passwordHash);
    if (!passwordMatch) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    const token = jwt.sign(
      { id: user[userIdColumn], role: userRoleToSign },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    res.json({ token, role: userRoleToSign });

  } catch (error) {
    if (error instanceof zod.ZodError) {
      return res.status(400).json({ errors: error.errors });
    }
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login.' });
  }
});

router.post('/register-student', async (req, res) => {
  try {
    const { roll_no, name, email, password, department, year } = studentRegisterSchema.parse(req.body);
    const password_hash = await bcrypt.hash(password, 10);

    const [result] = await pool.query(
      'INSERT INTO students (roll_no, name, email, password_hash, department, year) VALUES (?, ?, ?, ?, ?, ?)',
      [roll_no, name, email, password_hash, department, year]
    );

    res.status(201).json({ message: 'Student registered successfully.', studentId: result.insertId });

  } catch (error) {
    if (error instanceof zod.ZodError) {
      return res.status(400).json({ errors: error.errors });
    }
    console.error('Student registration error:', error);
    res.status(500).json({ message: 'Server error during student registration.' });
  }
});

router.post('/register-faculty', async (req, res) => {
  try {
    const { name, email, password, role } = facultyRegisterSchema.parse(req.body);
    const password_hash = await bcrypt.hash(password, 10);

    const [result] = await pool.query(
      'INSERT INTO faculty (name, email, password, role) VALUES (?, ?, ?, ?)',
      [name, email, password_hash, role]
    );

    res.status(201).json({ message: 'Faculty registered successfully.', facultyId: result.insertId });

  } catch (error) {
    if (error instanceof zod.ZodError) {
      return res.status(400).json({ errors: error.errors });
    }
    console.error('Faculty registration error:', error);
    res.status(500).json({ message: 'Server error during faculty registration.' });
  }
});

module.exports = router;