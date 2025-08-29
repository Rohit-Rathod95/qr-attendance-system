// src/app.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const attendanceRoutes = require('./routes/attendance');
const facilitiesRoutes = require('./routes/facilities');
const reportsRoutes = require('./routes/reports'); // Import the new router

const app = express();

app.use(express.json());
app.use(cors());
app.use(helmet());

app.use('/auth', authRoutes);
app.use('/attendance', attendanceRoutes);
app.use('/facilities', facilitiesRoutes);
app.use('/reports', reportsRoutes); // Use the new router

app.get('/', (req, res) => {
  res.send('QR Attendance API is running.');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});