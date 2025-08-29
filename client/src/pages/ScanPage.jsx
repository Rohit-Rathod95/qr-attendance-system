// src/pages/ScanPage.jsx
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5QrcodeScanner } from 'html5-qrcode';
import api from '../api';
import Navbar from '../components/Navbar';
import './ScanPage.css'; // Import the CSS file

const ScanPage = () => {
    const [scanResult, setScanResult] = useState(null);
    const scannerRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        const onScanSuccess = async (decodedText, decodedResult) => {
            if (decodedText === scanResult) return;

            setScanResult(decodedText);
            console.log(`Scan result: ${decodedText}`);

            try {
                const response = await api.post('/attendance/mark', { scannedQrToken: decodedText });
                console.log('Attendance marked successfully:', response.data.message);
                alert('Attendance marked!');
                navigate('/history', { state: { refreshAt: Date.now() } });
            } catch (error) {
                console.error('Error marking attendance:', error.response?.data?.message || error.message);
                alert(`Error: ${error.response?.data?.message || 'An error occurred.'}`);
            } finally {
                if (scannerRef.current) {
                    scannerRef.current.clear().catch(e => console.error("Failed to clear scanner", e));
                }
            }
        };

        const onScanError = (errorMessage) => {
            console.error(errorMessage);
        };

        const containerId = "reader";
        const container = document.getElementById(containerId);
        if (!container) {
            console.error('QR container not found');
            return;
        }
        scannerRef.current = new Html5QrcodeScanner(containerId, { fps: 10, qrbox: { width: 250, height: 250 } }, false);
        try {
            scannerRef.current.render(onScanSuccess, onScanError);
            const headerEl = container.querySelector('#reader__scan_region');
            if (headerEl) {
                // Not using setHeaderMessage here as it's not a standard method for Html5QrcodeScanner
            }
        } catch (e) {
            console.error('Failed to render scanner', e);
        }

        return () => {
            if (scannerRef.current) {
                scannerRef.current.clear().catch(e => console.error("Failed to clear scanner: ", e));
            }
        };
    }, []);

    return (
        <>
            <Navbar />
            <div className="scanner-container">
                <h1>Scan Facility QR Code</h1>
                <div id="reader" style={{ width: '400px', margin: '0 auto' }}></div>
            </div>
        </>
    );
};

export default ScanPage;