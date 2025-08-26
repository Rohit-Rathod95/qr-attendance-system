// src/pages/ScanPage.jsx
import React, { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import api from '../api'; // Your Axios instance

const ScanPage = () => {
  const [scanResult, setScanResult] = useState(null);
  const scannerRef = useRef(null);

  useEffect(() => {
    // This function will be called on a successful scan
    const onScanSuccess = async (decodedText, decodedResult) => {
      // Avoid multiple scans of the same QR code
      if (decodedText === scanResult) return; 
      
      setScanResult(decodedText);
      console.log(`Scan result: ${decodedText}`);

      try {
        // Send the scanned token to your backend
        const response = await api.post('/attendance/mark', { scannedQrToken: decodedText });
        console.log('Attendance marked successfully:', response.data.message);
        alert('Attendance marked!');
      } catch (error) {
        console.error('Error marking attendance:', error.response.data.message);
        alert(`Error: ${error.response.data.message}`);
      }
    };

    // This function will be called on an error
    const onScanError = (errorMessage) => {
      console.error(errorMessage);
    };

    // Instantiate the QR code scanner
    scannerRef.current = new Html5QrcodeScanner(
      "reader", { fps: 10, qrbox: { width: 250, height: 250 } }, false
    );

    // Render the scanner
    scannerRef.current.render(onScanSuccess, onScanError);

    // Cleanup function to stop the scanner when the component unmounts
    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(error => console.error("Failed to clear scanner: ", error));
      }
    };
  }, [scanResult]);

  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h1>Scan Facility QR Code</h1>
      <div id="reader" style={{ width: '400px', margin: '0 auto' }}></div>
    </div>
  );
};

export default ScanPage;