import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import './AlertList.css';

export default function AlertList() {
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAlerts();
    }, []);

    const fetchAlerts = async () => {
        try {
            const response = await api.get('/alerts');
            if (response.data.success) {
                // Fetch feedback for each alert
                const alertsWithFeedback = await Promise.all(
                    response.data.data.map(async (alert) => {
                        try {
                            const feedbackRes = await api.get(`/alerts/${alert._id}/feedback`);
                            return {
                                ...alert,
                                feedbackCount: feedbackRes.data.count || 0
                            };
                        } catch {
                            return { ...alert, feedbackCount: 0 };
                        }
                    })
                );
                setAlerts(alertsWithFeedback);
            }
        } catch (err) {
            console.error('Failed to fetch alerts:', err);
        } finally {
            setLoading(false);
        }
    };

    const getSeverityClass = (severity) => {
        const map = {
            LOW: 'severity-low',
            MEDIUM: 'severity-medium',
            HIGH: 'severity-high',
            CRITICAL: 'severity-critical'
        };
        return map[severity] || 'severity-medium';
    };

    const getStatusClass = (status) => {
        const map = {
            PENDING: 'status-pending',
            PROCESSING: 'status-processing',
            SENT: 'status-sent',
            FAILED: 'status-failed'
        };
        return map[status] || 'status-pending';
    };

    if (loading) {
        return <div className="loading">Loading alerts...</div>;
    }

    return (
        <div className="alert-list">
            <div className="header">
                <h1>All Alerts</h1>
                <Link to="/create-alert" className="btn btn-primary">
                    + Create Alert
                </Link>
            </div>

            {alerts.length === 0 ? (
                <div className="empty-state">
                    <p>No alerts created yet.</p>
                    <Link to="/create-alert">Create your first alert</Link>
                </div>
            ) : (
                <div className="alerts-table">
                    <table>
                        <thead>
                            <tr>
                                <th>Title</th>
                                <th>Location</th>
                                <th>Severity</th>
                                <th>Status</th>
                                <th>Feedback</th>
                                <th>Created</th>
                            </tr>
                        </thead>
                        <tbody>
                            {alerts.map((alert) => (
                                <tr key={alert._id}>
                                    <td className="title-cell">
                                        <strong>{alert.title}</strong>
                                        <span className="message-preview">{alert.message.substring(0, 50)}...</span>
                                    </td>
                                    <td>{alert.targetRegion || 'ALL'}</td>
                                    <td>
                                        <span className={`severity-badge ${getSeverityClass(alert.severity)}`}>
                                            {alert.severity}
                                        </span>
                                    </td>
                                    <td>
                                        <span className={`status-badge ${getStatusClass(alert.status)}`}>
                                            {alert.status}
                                        </span>
                                    </td>
                                    <td className="feedback-cell">
                                        <span className="feedback-count">{alert.feedbackCount}</span>
                                        <span className="feedback-label">received</span>
                                    </td>
                                    <td className="date-cell">
                                        {new Date(alert.createdAt).toLocaleDateString()}
                                        <span className="time">{new Date(alert.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
