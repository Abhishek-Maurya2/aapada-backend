import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Activity, Radio, AlertCircle, ListChecks } from "lucide-react";

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

            const pendingAlerts = alertsRes.data.data ? alertsRes.data.data.filter(a => a.status === 'PENDING').length : 0;

            setStats({
                devices: devicesRes.data.count || 0,
                alerts: alertsRes.data.count || 0,
                pending: pendingAlerts,
                queueStatus: queueRes.data.data || { waiting: 0, active: 0, completed: 0, failed: 0 }
            });
        } catch (err) {
            console.error('Failed to fetch stats:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="flex h-full items-center justify-center">Loading...</div>;
    }

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
                <div className="flex items-center space-x-2">
                    <Button asChild>
                        <Link to="/create-alert">
                            Create Alert
                        </Link>
                    </Button>
                </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Registered Devices
                        </CardTitle>
                        <Radio className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.devices}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Total Alerts
                        </CardTitle>
                        <AlertCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.alerts}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Pending Alerts
                        </CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.pending}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Queue Status
                        </CardTitle>
                        <ListChecks className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-sm text-muted-foreground space-y-1">
                            <div className="flex justify-between"><span>Waiting:</span> <span>{stats.queueStatus.waiting}</span></div>
                            <div className="flex justify-between"><span>Active:</span> <span>{stats.queueStatus.active}</span></div>
                            <div className="flex justify-between"><span>Completed:</span> <span>{stats.queueStatus.completed}</span></div>
                            <div className="flex justify-between"><span>Failed:</span> <span>{stats.queueStatus.failed}</span></div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
