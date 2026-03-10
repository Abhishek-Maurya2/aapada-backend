import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import MapPicker from '../components/MapPicker';
import { AlertCircle, Clock, Flag, FileText, MapPin, Send } from 'lucide-react';

const ALERT_TYPES = [
    { value: 'Earthquake', emoji: '🌍' },
    { value: 'Flood', emoji: '🌊' },
    { value: 'Cyclone', emoji: '🌀' },
    { value: 'Tsunami', emoji: '🌊' },
    { value: 'Landslide', emoji: '⛰️' },
    { value: 'Fire', emoji: '🔥' },
    { value: 'Industrial Accident', emoji: '🏭' },
    { value: 'Heatwave', emoji: '☀️' },
    { value: 'Thunderstorm', emoji: '⛈️' },
    { value: 'Other', emoji: '⚠️' },
];

const FLAGS = [
    { value: 'RED', color: '#EF4444', label: 'Red', desc: 'Extreme danger' },
    { value: 'ORANGE', color: '#F97316', label: 'Orange', desc: 'High risk' },
    { value: 'YELLOW', color: '#EAB308', label: 'Yellow', desc: 'Moderate risk' },
    { value: 'GREEN', color: '#22C55E', label: 'Green', desc: 'Low risk / Adv.' },
];

const EXPIRY_OPTIONS = [
    { value: 1, label: '1 hr' },
    { value: 2, label: '2 hrs' },
    { value: 6, label: '6 hrs' },
    { value: 12, label: '12 hrs' },
    { value: 24, label: '1 day' },
    { value: 72, label: '3 days' },
    { value: 168, label: '7 days' },
];

export default function CreateAlert() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        alertType: '',
        title: '',
        message: '',
        severity: 'MEDIUM',
        flag: 'YELLOW',
        expiresIn: 6,
        additionalInfo: '',
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

    const handleAlertTypeSelect = (type) => {
        setFormData(prev => ({
            ...prev,
            alertType: type.value,
            title: prev.title || `${type.value} Warning`,
        }));
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

        if (!formData.alertType) {
            setError('Please select an alert type');
            setLoading(false);
            return;
        }

        try {
            let payload = { ...formData };
            if (formData.latitude && formData.longitude && formData.radius) {
                payload.targetRegion = {
                    type: 'Point',
                    coordinates: [parseFloat(formData.longitude), parseFloat(formData.latitude)],
                    radius: parseFloat(formData.radius)
                };
            } else {
                payload.targetRegion = formData.targetRegion || 'ALL';
            }
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
        <div className="flex-1 space-y-6 p-8 pt-6">
            <h2 className="text-3xl font-bold tracking-tight">Create Alert</h2>

            <form onSubmit={handleSubmit} className="max-w-4xl space-y-6">
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

                {/* Alert Type Chips */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                            <AlertCircle className="h-4 w-4" />
                            Alert Type
                        </CardTitle>
                        <CardDescription>Select the type of disaster</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-2">
                            {ALERT_TYPES.map((type) => (
                                <button
                                    key={type.value}
                                    type="button"
                                    onClick={() => handleAlertTypeSelect(type)}
                                    className={`px-4 py-2 rounded-full text-sm font-medium border transition-all duration-200 ${formData.alertType === type.value
                                            ? 'bg-primary text-primary-foreground border-primary shadow-md scale-105'
                                            : 'bg-background border-border hover:bg-accent hover:border-primary/50'
                                        }`}
                                >
                                    <span className="mr-1.5">{type.emoji}</span>
                                    {type.value}
                                </button>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Title & Message */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            Alert Details
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
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
                            <Label htmlFor="message">Message</Label>
                            <Textarea
                                id="message"
                                name="message"
                                value={formData.message}
                                onChange={handleChange}
                                placeholder="Detailed alert message..."
                                rows={4}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="additionalInfo">Additional Information</Label>
                            <Textarea
                                id="additionalInfo"
                                name="additionalInfo"
                                value={formData.additionalInfo}
                                onChange={handleChange}
                                placeholder="Any extra context, resources, or instructions..."
                                rows={3}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Severity & Flag */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">Severity Level</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <select
                                id="severity"
                                name="severity"
                                value={formData.severity}
                                onChange={handleChange}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            >
                                <option value="LOW">Low</option>
                                <option value="MEDIUM">Medium</option>
                                <option value="HIGH">High</option>
                                <option value="CRITICAL">Critical</option>
                            </select>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base flex items-center gap-2">
                                <Flag className="h-4 w-4" />
                                Color Flag
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex gap-3">
                                {FLAGS.map((f) => (
                                    <button
                                        key={f.value}
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, flag: f.value }))}
                                        className={`flex-1 flex flex-col items-center gap-1.5 p-3 rounded-lg border-2 transition-all duration-200 ${formData.flag === f.value
                                                ? 'border-primary shadow-md scale-105'
                                                : 'border-border hover:border-primary/30'
                                            }`}
                                    >
                                        <div
                                            className="w-6 h-6 rounded-full shadow-sm"
                                            style={{ backgroundColor: f.color }}
                                        />
                                        <span className="text-xs font-medium">{f.label}</span>
                                    </button>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Expiry Time */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            Alert Expiry Time
                        </CardTitle>
                        <CardDescription>Alert will auto-expire and stop reaching users after this duration</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-2">
                            {EXPIRY_OPTIONS.map((opt) => (
                                <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => setFormData(prev => ({ ...prev, expiresIn: opt.value }))}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all duration-200 ${formData.expiresIn === opt.value
                                            ? 'bg-primary text-primary-foreground border-primary shadow-md'
                                            : 'bg-background border-border hover:bg-accent hover:border-primary/50'
                                        }`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Geofence / Location */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            Target Area
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center gap-3">
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

                        {useGeofence && (
                            <MapPicker
                                onLocationSelect={handleLocationSelect}
                                initialRadius={5000}
                                height="350px"
                            />
                        )}

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
                </Card>

                {/* Submit */}
                <Button type="submit" disabled={loading} className="w-full sm:w-auto" size="lg">
                    <Send className="h-4 w-4 mr-2" />
                    {loading ? 'Creating...' : 'Create & Broadcast Alert'}
                </Button>
            </form>
        </div>
    );
}
