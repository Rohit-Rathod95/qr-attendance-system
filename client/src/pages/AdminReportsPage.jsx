// src/pages/AdminReportsPage.jsx
import React, { useState, useEffect } from 'react';
import api from '../api';
import Navbar from '../components/Navbar';
import './AdminReportsPage.css'; // Import the CSS file

const AdminReportsPage = () => {
    const [facilities, setFacilities] = useState([]);
    const [selectedFacility, setSelectedFacility] = useState('');
    const [dailyReportData, setDailyReportData] = useState([]);
    const [usageReportData, setUsageReportData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [reportType, setReportType] = useState('daily');
    const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

    useEffect(() => {
        const fetchFacilities = async () => {
            try {
                const response = await api.get('/facilities');
                setFacilities(response.data);
            } catch (error) {
                console.error('Error fetching facilities:', error);
            }
        };
        fetchFacilities();
    }, []);

    const handleFetchReport = async () => {
        if (!selectedFacility) {
            alert('Please select a facility.');
            return;
        }
        setLoading(true);
        try {
            if (reportType === 'daily') {
                const response = await api.get(`/reports/attendance?facilityId=${selectedFacility}&date=${date}`);
                setDailyReportData(response.data);
            } else {
                const fromDate = `${date}T00:00:00Z`;
                const toDate = `${date}T23:59:59Z`;
                const response = await api.get(`/reports/facility-usage?facilityId=${selectedFacility}&from=${fromDate}&to=${toDate}`);
                setUsageReportData(response.data);
            }
        } catch (error) {
            console.error('Error fetching report:', error);
            alert('Failed to fetch report.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Navbar />
            <div className="reports-container">
                <h1>Admin Reports</h1>
                <div className="reports-options">
                    <div>
                        <label>Select Report Type:</label>
                        <select value={reportType} onChange={(e) => setReportType(e.target.value)}>
                            <option value="daily">Daily Attendance List</option>
                            <option value="usage">Facility Usage (Per Day)</option>
                        </select>
                    </div>
                    <div>
                        <label>Select Facility:</label>
                        <select value={selectedFacility} onChange={(e) => setSelectedFacility(e.target.value)}>
                            <option value="">--Select--</option>
                            {facilities.map(facility => (
                                <option key={facility.id} value={facility.id}>
                                    {facility.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label>Select Date:</label>
                        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                    </div>
                    <button onClick={handleFetchReport}>Fetch Report</button>
                </div>

                {loading && <div>Loading report...</div>}

                {reportType === 'daily' && dailyReportData.length > 0 && (
                    <div className="report-display">
                        <h3>Daily Attendance for {date}</h3>
                        <ul className="report-list">
                            {dailyReportData.map((record, index) => (
                                <li key={index} className="report-list-item">
                                    <p><strong>Student:</strong> {record.name} ({record.roll_no})</p>
                                    <p><strong>Scanned At:</strong> {new Date(record.scanned_at).toLocaleTimeString()}</p>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {reportType === 'usage' && usageReportData.length > 0 && (
                    <div className="report-display">
                        <h3>Facility Usage for {date}</h3>
                        <p>Total Scans: {usageReportData.length}</p>
                        <ul className="report-list">
                            {usageReportData.map((record, index) => (
                                <li key={index} className="report-list-item">
                                    <p><strong>Scanned By (ID):</strong> {record.student_id}</p>
                                    <p><strong>Time:</strong> {new Date(record.scanned_at).toLocaleTimeString()}</p>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
                
                {!loading && reportType === 'daily' && dailyReportData.length === 0 && <p style={{ marginTop: '20px' }}>No attendance records found for this date.</p>}
                {!loading && reportType === 'usage' && usageReportData.length === 0 && <p style={{ marginTop: '20px' }}>No usage records found for this date.</p>}
            </div>
        </>
    );
};

export default AdminReportsPage;