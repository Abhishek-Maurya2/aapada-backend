import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus } from "lucide-react";

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

    const getSeverityVariant = (severity) => {
        const map = {
            LOW: 'secondary',
            MEDIUM: 'default', // blue-ish usually
            HIGH: 'destructive', // red
            CRITICAL: 'destructive'
        };
        return map[severity] || 'default';
    };

    const getStatusVariant = (status) => {
        const map = {
            PENDING: 'outline',
            PROCESSING: 'secondary',
            SENT: 'default',
            FAILED: 'destructive'
        };
        return map[status] || 'outline';
    };

    if (loading) {
        return <div className="flex h-full items-center justify-center">Loading alerts...</div>;
    }

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">All Alerts</h2>
                <div className="flex items-center space-x-2">
                    <Button asChild>
                        <Link to="/create-alert">
                            <Plus className="mr-2 h-4 w-4" /> Create Alert
                        </Link>
                    </Button>
                </div>
            </div>

            {alerts.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 border rounded-lg bg-card text-card-foreground shadow-sm">
                    <p className="text-muted-foreground mb-4">No alerts created yet.</p>
                    <Button asChild variant="outline">
                        <Link to="/create-alert">Create your first alert</Link>
                    </Button>
                </div>
            ) : (
                <Card>
                    <CardHeader>
                        <CardTitle>Alert History</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Title</TableHead>
                                    <TableHead>Location</TableHead>
                                    <TableHead>Severity</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Feedback</TableHead>
                                    <TableHead>Created</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {alerts.map((alert) => (
                                    <TableRow key={alert._id}>
                                        <TableCell className="font-medium">
                                            <div>{alert.title}</div>
                                            <div className="text-xs text-muted-foreground truncate max-w-[200px]">{alert.message}</div>
                                        </TableCell>
                                        <TableCell>
                                            {typeof alert.targetRegion === 'object' && alert.targetRegion?.type === 'Point' ? (
                                                <div className="text-xs">
                                                    <div>Lat: {alert.targetRegion.coordinates[1].toFixed(4)}</div>
                                                    <div>Lon: {alert.targetRegion.coordinates[0].toFixed(4)}</div>
                                                    <div>Rad: {alert.targetRegion.radius}m</div>
                                                </div>
                                            ) : (
                                                alert.targetRegion || 'ALL'
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={getSeverityVariant(alert.severity)}>
                                                {alert.severity}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={getStatusVariant(alert.status)}>
                                                {alert.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-bold">{alert.feedbackCount}</span>
                                                <span className="text-xs text-muted-foreground">received</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span>{new Date(alert.createdAt).toLocaleDateString()}</span>
                                                <span className="text-xs text-muted-foreground">{new Date(alert.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
