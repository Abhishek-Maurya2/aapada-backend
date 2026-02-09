import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import './CreateAlert.css';

export default function CreateAlert() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        title: '',
        message: '',
        severity: 'MEDIUM',
        targetRegion: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const response = await api.post('/alerts', formData);
            if (response.data.success) {
                setSuccess(true);
                setTimeout(() => {
                    navigate('/alerts');
                }, 1500);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create alert');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="create-alert">
            <h1>Create New Alert</h1>

            {success && (
                <div className="alert-success">
                    ✅ Alert created and queued for broadcast!
                </div>
            )}

            {error && (
                <div className="alert-error">
                    ❌ {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="alert-form">
                <div className="form-group">
                    <label htmlFor="title">Alert Title</label>
                    <input
                        type="text"
                        id="title"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        placeholder="e.g., Flood Warning"
                        required
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="targetRegion">Location / Region</label>
                    <input
                        type="text"
                        id="targetRegion"
                        name="targetRegion"
                        value={formData.targetRegion}
                        onChange={handleChange}
                        placeholder="e.g., Zone A, District XYZ"
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="severity">Severity</label>
                    <select
                        id="severity"
                        name="severity"
                        value={formData.severity}
                        onChange={handleChange}
                    >
                        <option value="LOW">Low</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="HIGH">High</option>
                        <option value="CRITICAL">Critical</option>
                    </select>
                </div>

                <div className="form-group">
                    <label htmlFor="message">Message</label>
                    <textarea
                        id="message"
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        placeholder="Detailed alert message..."
                        rows={5}
                        required
                    />
                </div>

                <button type="submit" className="submit-btn" disabled={loading}>
                    {loading ? 'Creating...' : 'Create & Broadcast Alert'}
                </button>
            </form>
        </div>
    );
}
