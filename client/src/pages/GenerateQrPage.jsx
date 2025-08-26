// src/pages/GenerateQrPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { QRCodeCanvas } from 'qrcode.react';
import api from '../api';

const GenerateQrPage = () => {
  const [facilities, setFacilities] = useState([]);
  const [selectedFacilityId, setSelectedFacilityId] = useState('');
  const [qrToken, setQrToken] = useState('');
  const [countdown, setCountdown] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchFacilities = async () => {
      try {
        const response = await api.get('/facilities');
        setFacilities(response.data);
      } catch (error) {
        console.error('Error fetching facilities:', error);
        alert('Could not fetch facilities. Please log in as an admin/faculty.');
        navigate('/login');
      }
    };
    fetchFacilities();
  }, [navigate]);

  useEffect(() => {
    if (qrToken) {
      const interval = setInterval(() => {
        setCountdown(prev => (prev > 0 ? prev - 1 : 0));
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
      const response = await api.post(`/facilities/${selectedFacilityId}/qr/rotate`);
      setQrToken(response.data.qrToken);
      setCountdown(60);
      alert('New QR code generated!');
    } catch (error) {
      console.error('Error generating QR token:', error);
      alert('Failed to generate QR code.');
    }
  };

  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h1>Generate QR Code</h1>
      <div>
        <label>Select Facility:</label>
        <select value={selectedFacilityId} onChange={(e) => setSelectedFacilityId(e.target.value)}>
          <option value="">--Select--</option>
          {facilities.map(facility => (
            <option key={facility.id} value={facility.id}>
              {facility.name}
            </option>
          ))}
        </select>
        <button onClick={generateNewQrToken}>Generate QR</button>
      </div>
      {qrToken && (
        <div style={{ marginTop: '20px' }}>
          <h3>Scan this QR Code</h3>
          <p>This code will expire in {countdown} seconds.</p>
          <QRCodeCanvas value={qrToken} size={256} />
        </div>
      )}
    </div>
  );
};

export default GenerateQrPage;