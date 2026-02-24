import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Activity, Radio, AlertCircle, ListChecks, MapPin } from "lucide-react";
import { MapContainer, TileLayer, Marker, Circle, Popup } from 'react-leaflet';
import L from 'leaflet';

// Red marker icon for alerts
const alertIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
});

const severityColors = {
    LOW: '#3b82f6',
    MEDIUM: '#f59e0b',
    HIGH: '#f97316',
    CRITICAL: '#ef4444',
};

export default function Dashboard() {
    const [stats, setStats] = useState({
        devices: 0,
        alerts: 0,
        pending: 0,
        queueStatus: { waiting: 0, active: 0, completed: 0, failed: 0 }
    });
    const [alertsData, setAlertsData] = useState([]);
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

            const alerts = alertsRes.data.data || [];
            const pendingAlerts = alerts.filter(a => a.status === 'PENDING').length;

            setStats({
                devices: devicesRes.data.count || 0,
                alerts: alertsRes.data.count || 0,
                pending: pendingAlerts,
                queueStatus: queueRes.data.data || { waiting: 0, active: 0, completed: 0, failed: 0 }
            });

            // Filter alerts that have geofence coordinates
            const geoAlerts = alerts.filter(
                a => a.targetRegion && a.targetRegion.type === 'Point' && a.targetRegion.coordinates?.length === 2
            );
            setAlertsData(geoAlerts);
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

            {/* Alert Locations Map */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        Alert Locations
                    </CardTitle>
                    <span className="text-xs text-muted-foreground">
                        {alertsData.length} geofenced alert{alertsData.length !== 1 ? 's' : ''}
                    </span>
                </CardHeader>
                <CardContent>
                    <div className="rounded-lg overflow-hidden border border-border" style={{ height: '400px' }}>
                        <MapContainer
                            center={[20.5937, 78.9629]}
                            zoom={5}
                            style={{ height: '100%', width: '100%' }}
                            scrollWheelZoom={true}
                        >
                            <TileLayer
                                attribution='&copy; <a href="https://carto.com/">CARTO</a>'
                                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                            />
                            {alertsData.map((alert) => {
                                const [lng, lat] = alert.targetRegion.coordinates;
                                const color = severityColors[alert.severity] || '#ef4444';
                                return (
                                    <div key={alert._id}>
                                        <Marker position={[lat, lng]} icon={alertIcon}>
                                            <Popup>
                                                <div className="text-sm space-y-1">
                                                    <div className="font-semibold">{alert.title}</div>
                                                    <div className="flex items-center gap-1">
                                                        <span
                                                            className="inline-block w-2 h-2 rounded-full"
                                                            style={{ backgroundColor: color }}
                                                        />
                                                        <span>{alert.severity}</span>
                                                    </div>
                                                    {alert.targetRegion.radius && (
                                                        <div className="text-muted-foreground">
                                                            Radius: {alert.targetRegion.radius >= 1000
                                                                ? `${(alert.targetRegion.radius / 1000).toFixed(1)} km`
                                                                : `${alert.targetRegion.radius} m`
                                                            }
                                                        </div>
                                                    )}
                                                    <div className="text-xs text-muted-foreground">
                                                        {new Date(alert.createdAt).toLocaleString()}
                                                    </div>
                                                </div>
                                            </Popup>
                                        </Marker>
                                        {alert.targetRegion.radius && (
                                            <Circle
                                                center={[lat, lng]}
                                                radius={alert.targetRegion.radius}
                                                pathOptions={{
                                                    color,
                                                    fillColor: color,
                                                    fillOpacity: 0.1,
                                                    weight: 1.5,
                                                    dashArray: '6 4',
                                                }}
                                            />
                                        )}
                                    </div>
                                );
                            })}
                        </MapContainer>
                    </div>
                    {alertsData.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center mt-3">
                            No geofenced alerts yet. Create one with a specific location to see it here.
                        </p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

