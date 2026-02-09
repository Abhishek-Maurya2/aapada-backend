import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import './Dashboard.css';

export default function Dashboard() {
    const [stats, setStats] = useState({
        devices: 0,
        alerts: 0,
        pending: 0,
        queueStatus: { waiting: 0, active: 0, completed: 0, failed: 0 }
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const [devicesRes, alertsRes, queueRes] = await Promise.all([
                api.get('/devices'),
                api.get('/alerts'),
                api.get('/queue/status')
            ]);

            const pendingAlerts = alertsRes.data.data.filter(a => a.status === 'PENDING').length;

            setStats({
                devices: devicesRes.data.count || 0,
                alerts: alertsRes.data.count || 0,
                pending: pendingAlerts,
                queueStatus: queueRes.data.data || {}
            });
        } catch (err) {
            console.error('Failed to fetch stats:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="loading">Loading...</div>;
    }

    return (
        <div className="dashboard">
            <h1>Dashboard</h1>
            <div className="stats-grid">
                <div className="stat-card devices">
                    <h3>Registered Devices</h3>
                    <p className="stat-value">{stats.devices}</p>
                </div>
                <div className="stat-card alerts">
                    <h3>Total Alerts</h3>
                    <p className="stat-value">{stats.alerts}</p>
                </div>
                <div className="stat-card pending">
                    <h3>Pending Alerts</h3>
                    <p className="stat-value">{stats.pending}</p>
                </div>
                <div className="stat-card queue">
                    <h3>Queue Status</h3>
                    <div className="queue-stats">
                        <span>Waiting: {stats.queueStatus.waiting}</span>
                        <span>Active: {stats.queueStatus.active}</span>
                        <span>Completed: {stats.queueStatus.completed}</span>
                        <span>Failed: {stats.queueStatus.failed}</span>
                    </div>
                </div>
            </div>
            <div className="quick-actions">
                <Link to="/create-alert" className="btn btn-primary">
                    + Create New Alert
                </Link>
                <Link to="/alerts" className="btn btn-secondary">
                    View All Alerts
                </Link>
            </div>
        </div>
    );
}
