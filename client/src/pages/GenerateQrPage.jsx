// src/pages/GenerateQrPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { QRCodeCanvas } from 'qrcode.react';
import api from '../api';
import Navbar from '../components/Navbar';
import './GenerateQr.css';

const GenerateQrPage = () => {
  const [departments, setDepartments] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [labFacilities, setLabFacilities] = useState([]);
  const [classroomFacilities, setClassroomFacilities] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedFacilityId, setSelectedFacilityId] = useState('');
  const [selectedLabId, setSelectedLabId] = useState('');
  const [selectedClassroomId, setSelectedClassroomId] = useState('');
  const [selectedType, setSelectedType] = useState(''); // 'Lab' | 'Classroom'
  const [qrToken, setQrToken] = useState('');
  const [countdown, setCountdown] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const response = await api.get('/facilities/departments');
        setDepartments(response.data);
      } catch (error) {
        console.error('Error fetching departments:', error);
        alert('Could not fetch departments. Please log in as an admin/faculty.');
        navigate('/login');
      }
    };
    fetchDepartments();
  }, [navigate]);

  useEffect(() => {
    const fetchFacilities = async () => {
      try {
        const params = {};
        if (selectedDepartment) params.departmentId = selectedDepartment;
        if (selectedType) params.type = selectedType;
        const response = await api.get('/facilities', { params });
        setFacilities(response.data);
        setSelectedFacilityId('');
        setSelectedLabId('');
        setSelectedClassroomId('');
      } catch (error) {
        console.error('Error fetching facilities:', error);
        alert('Could not fetch facilities.');
      }
    };
    fetchFacilities();
  }, [selectedDepartment, selectedType]);

  // Derive labs and classrooms lists from facilities (uses server-provided type when available)
  useEffect(() => {
    const isLab = (facility) => {
      if (facility.type) return facility.type.toLowerCase() === 'lab';
      return /lab|laborator/i.test(facility.name || '');
    };
    const isClassroom = (facility) => {
      if (facility.type) return facility.type.toLowerCase() === 'classroom';
      return /class|classroom/i.test(facility.name || '');
    };

    setLabFacilities(facilities.filter(isLab));
    setClassroomFacilities(facilities.filter(isClassroom));
  }, [facilities]);

  useEffect(() => {
    if (qrToken) {
      const interval = setInterval(() => {
        setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);

      const timeout = setTimeout(() => {
        generateNewQrToken();
      }, 60000); // 60 seconds

      return () => {
        clearInterval(interval);
        clearTimeout(timeout);
      };
    }
  }, [qrToken]);

  const generateNewQrToken = async () => {
    if (!selectedFacilityId) {
      alert('Please select a facility.');
      return;
    }
    try {
      const response = await api.post(
        `/facilities/${selectedFacilityId}/qr/rotate`
      );
      setQrToken(response.data.qrToken);
      setCountdown(60);
      alert('New QR code generated!');
    } catch (error) {
      console.error('Error generating QR token:', error);
      alert('Failed to generate QR code.');
    }
  };

  // Departments come from API now

  return (
    <>
      <Navbar />
      <div className="qr-generator-container"> {/* Apply the class here */}
        <h1>Generate QR Code</h1>
        <div>
          <label htmlFor="department-select">Select Department:</label>
          <select
            id="department-select"
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
          >
            <option value="">--All Departments--</option>
            {departments.map((dept) => (
              <option key={dept.id} value={dept.id}>
                {dept.name}
              </option>
            ))}
          </select>
        </div>
        {selectedDepartment && (
          <>
            <div>
              <label htmlFor="type-select">Select Type:</label>
              <select
                id="type-select"
                value={selectedType}
                onChange={(e) => {
                  const value = e.target.value;
                  setSelectedType(value);
                  setSelectedLabId('');
                  setSelectedClassroomId('');
                  setSelectedFacilityId('');
                }}
              >
                <option value="">--Select Type--</option>
                <option value="Classroom">Classrooms</option>
                <option value="Lab">Labs</option>
              </select>
            </div>

            {selectedType === 'Classroom' && (
              <div>
                <label htmlFor="classroom-select">Select Classroom:</label>
                <select
                  id="classroom-select"
                  value={selectedClassroomId}
                  onChange={(e) => {
                    setSelectedClassroomId(e.target.value);
                    setSelectedFacilityId(e.target.value);
                  }}
                >
                  <option value="">--Select Classroom--</option>
                  {classroomFacilities.map((facility) => (
                    <option key={facility.id} value={facility.id}>
                      {facility.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {selectedType === 'Lab' && (
              <div>
                <label htmlFor="lab-select">Select Lab:</label>
                <select
                  id="lab-select"
                  value={selectedLabId}
                  onChange={(e) => {
                    setSelectedLabId(e.target.value);
                    setSelectedFacilityId(e.target.value);
                  }}
                >
                  <option value="">--Select Lab--</option>
                  {labFacilities.map((facility) => (
                    <option key={facility.id} value={facility.id}>
                      {facility.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </>
        )}
        <button onClick={generateNewQrToken}>Generate QR</button>
        {qrToken && (
          <div className="qr-display-area"> {/* Apply the class here */}
            <h3>Scan this QR Code</h3>
            <p>This code will expire in {countdown} seconds.</p>
            <QRCodeCanvas value={qrToken} size={256} />
          </div>
        )}
      </div>
    </>
  );
};

export default GenerateQrPage;