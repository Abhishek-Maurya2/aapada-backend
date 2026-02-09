import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

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
        <div className="flex-1 space-y-4 p-8 pt-6">
            <h2 className="text-3xl font-bold tracking-tight">Create Alert</h2>

            <Card className="max-w-2xl">
                <CardHeader>
                    <CardTitle>New Alert Details</CardTitle>
                    <CardDescription>Enter the details of the disaster alert to be broadcasted.</CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-4">
                        {success && (
                            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative" role="alert">
                                <span className="block sm:inline">✅ Alert created and queued for broadcast!</span>
                            </div>
                        )}

                        {error && (
                            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
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
                            <Label htmlFor="targetRegion">Location / Region</Label>
                            <Input
                                type="text"
                                id="targetRegion"
                                name="targetRegion"
                                value={formData.targetRegion}
                                onChange={handleChange}
                                placeholder="e.g., Zone A, District XYZ"
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
                    </CardContent>
                    <CardFooter>
                        <Button type="submit" disabled={loading} className="w-full sm:w-auto">
                            {loading ? 'Creating...' : 'Create & Broadcast Alert'}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
