// src/pages/HistoryPage.jsx
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../api';
import Navbar from '../components/Navbar';
import './HistoryPage.css'; // Import the CSS file

const HistoryPage = () => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const response = await api.get(`/reports/me/attendance`);
                setHistory(response.data);
            } catch (error) {
                console.error('Error fetching history:', error);
                alert('Could not fetch attendance history. Please log in.');
                navigate('/login');
            } finally {
                setLoading(false);
            }
        };
        fetchHistory();
    }, [navigate, location.state?.refreshAt]);

    if (loading) {
        return (
            <>
                <Navbar />
                <div className="history-container">
                    <div className="loading-text">Loading attendance history...</div>
                </div>
            </>
        );
    }

    return (
        <>
            <Navbar />
            <div className="history-container">
                <h1>My Attendance History</h1>
                {history.length > 0 ? (
                    <ul className="history-list">
                        {history.map((record, index) => (
                            <li key={index} className="history-list-item">
                                <p><strong>Facility:</strong> {record.facility_name}</p>
                                <p><strong>Location:</strong> {record.location}</p>
                                <p><strong>Time:</strong> {new Date(record.scanned_at).toLocaleString()}</p>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="no-records-text">No attendance records found.</p>
                )}
            </div>
        </>
    );
};

export default HistoryPage;