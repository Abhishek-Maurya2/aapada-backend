import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import MapPicker from '../components/MapPicker';

export default function CreateAlert() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        title: '',
        message: '',
        severity: 'MEDIUM',
        targetRegion: '',
        latitude: '',
        longitude: '',
        radius: ''
    });
    const [useGeofence, setUseGeofence] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleLocationSelect = (lat, lng, radius) => {
        setFormData(prev => ({
            ...prev,
            latitude: lat !== null ? lat.toString() : '',
            longitude: lng !== null ? lng.toString() : '',
            radius: radius !== null ? radius.toString() : '',
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // Build the payload
            let payload = { ...formData };
            if (formData.latitude && formData.longitude && formData.radius) {
                payload.targetRegion = {
                    type: 'Point',
                    // Note: backend expects [longitude, latitude]
                    coordinates: [parseFloat(formData.longitude), parseFloat(formData.latitude)],
                    radius: parseFloat(formData.radius)
                };
            } else {
                payload.targetRegion = formData.targetRegion || 'ALL';
            }
            // Remove the helper fields from the final payload
            delete payload.latitude;
            delete payload.longitude;
            delete payload.radius;

            const response = await api.post('/alerts', payload);
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
        <div className="flex-1 space-y-4 p-8 pt-6">
            <h2 className="text-3xl font-bold tracking-tight">Create Alert</h2>

            <div className="max-w-4xl space-y-4">
                <Card>
                    <CardHeader>
                        <CardTitle>New Alert Details</CardTitle>
                        <CardDescription>Enter the details of the disaster alert to be broadcasted.</CardDescription>
                    </CardHeader>
                    <form onSubmit={handleSubmit}>
                        <CardContent className="space-y-4">
                            {success && (
                                <div className="bg-green-900/30 border border-green-500/50 text-green-400 px-4 py-3 rounded-lg" role="alert">
                                    <span className="block sm:inline">✅ Alert created and queued for broadcast!</span>
                                </div>
                            )}

                            {error && (
                                <div className="bg-red-900/30 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg" role="alert">
                                    <span className="block sm:inline">❌ {error}</span>
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label htmlFor="title">Alert Title</Label>
                                <Input
                                    type="text"
                                    id="title"
                                    name="title"
                                    value={formData.title}
                                    onChange={handleChange}
                                    placeholder="e.g., Flood Warning"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="severity">Severity</Label>
                                <select
                                    id="severity"
                                    name="severity"
                                    value={formData.severity}
                                    onChange={handleChange}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    <option value="LOW">Low</option>
                                    <option value="MEDIUM">Medium</option>
                                    <option value="HIGH">High</option>
                                    <option value="CRITICAL">Critical</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="message">Message</Label>
                                <Textarea
                                    id="message"
                                    name="message"
                                    value={formData.message}
                                    onChange={handleChange}
                                    placeholder="Detailed alert message..."
                                    rows={5}
                                    required
                                />
                            </div>

                            {/* Geofence Toggle */}
                            <div className="flex items-center gap-3 pt-2 border-t border-border">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={useGeofence}
                                        onChange={(e) => {
                                            setUseGeofence(e.target.checked);
                                            if (!e.target.checked) {
                                                handleLocationSelect(null, null, null);
                                            }
                                        }}
                                        className="w-4 h-4 rounded accent-red-500"
                                    />
                                    <span className="text-sm font-medium">Target specific area (Geofence)</span>
                                </label>
                                {!useGeofence && (
                                    <span className="text-xs text-muted-foreground">Alert will be sent to ALL devices</span>
                                )}
                            </div>

                            {/* Map Picker */}
                            {useGeofence && (
                                <MapPicker
                                    onLocationSelect={handleLocationSelect}
                                    initialRadius={5000}
                                    height="350px"
                                />
                            )}

                            {/* Fallback text region (when geofencing is off) */}
                            {!useGeofence && (
                                <div className="space-y-2">
                                    <Label htmlFor="targetRegion">Target Region (Text)</Label>
                                    <Input
                                        type="text"
                                        id="targetRegion"
                                        name="targetRegion"
                                        value={formData.targetRegion}
                                        onChange={handleChange}
                                        placeholder="e.g., Zone A, District XYZ (or leave blank for ALL)"
                                    />
                                </div>
                            )}
                        </CardContent>
                        <CardFooter>
                            <Button type="submit" disabled={loading} className="w-full sm:w-auto">
                                {loading ? 'Creating...' : 'Create & Broadcast Alert'}
                            </Button>
                        </CardFooter>
                    </form>
                </Card>
            </div>
        </div>
    );
}
