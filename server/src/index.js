// src/app.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const attendanceRoutes = require('./routes/attendance');
const facilitiesRoutes = require('./routes/facilities'); // Now included

const app = express();

// Middleware
app.use(express.json());
app.use(cors());
app.use(helmet());

// Routes
app.use('/auth', authRoutes);
app.use('/attendance', attendanceRoutes);
app.use('/facilities', facilitiesRoutes);

// Basic welcome route
app.get('/', (req, res) => {
  res.send('QR Attendance API is running.');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});