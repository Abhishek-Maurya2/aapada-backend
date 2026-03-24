import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Activity, 
  Radio, 
  AlertCircle, 
  ListChecks, 
  MapPin, 
  Plus, 
  Clock, 
  CheckCircle2, 
  XCircle,
  BarChart3,
  ShieldAlert,
  Zap,
  TrendingUp,
  ArrowRight
} from "lucide-react";
import { MapContainer, TileLayer, Marker, Circle, Popup } from 'react-leaflet';
import L from 'leaflet';
import { cn } from '../lib/utils';

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
    LOW: 'hsl(210 100% 50%)',
    MEDIUM: 'hsl(38 92% 50%)',
    HIGH: 'hsl(15 92% 50%)',
    CRITICAL: 'hsl(0 84% 60%)',
};

const StatCard = ({ title, value, icon: Icon, trend, colorClass, glow = false }) => (
  <Card className={cn("glass border-white/5 overflow-hidden transition-all duration-300 hover:border-white/10 group", glow && `glow-${colorClass}`)}>
    <CardHeader className="flex flex-row items-center justify-between pb-2">
      <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground group-hover:text-white/80 transition-colors">
        {title}
      </CardTitle>
      <div className={cn("p-2 rounded-lg bg-white/5 group-hover:bg-white/10 transition-colors", trend === 'up' ? "text-primary" : "text-accent")}>
        <Icon className="h-4 w-4" />
      </div>
    </CardHeader>
    <CardContent>
      <div className="text-3xl font-black tracking-tight">{value}</div>
      {trend && (
        <p className="text-[10px] mt-2 font-medium flex items-center gap-1">
          <Badge variant="outline" className="border-white/5 bg-white/5 text-primary text-[10px] px-1.5 py-0">LIVE</Badge>
          <span className="text-muted-foreground">System active</span>
        </p>
      )}
    </CardContent>
  </Card>
);

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
        // Set up refresh interval
        const interval = setInterval(fetchStats, 30000);
        return () => clearInterval(interval);
    }, []);

    const fetchStats = async () => {
        try {
            const [devicesResult, alertsResult, queueResult] = await Promise.allSettled([
                api.get('/devices'),
                api.get('/alerts'),
                api.get('/queue/status')
            ]);

            const devicesData = devicesResult.status === 'fulfilled' ? devicesResult.value.data : null;
            const alertsDataRaw = alertsResult.status === 'fulfilled' ? alertsResult.value.data : null;
            const queueData = queueResult.status === 'fulfilled' ? queueResult.value.data : null;

            const alerts = alertsDataRaw?.data || [];
            const pendingAlerts = alerts.filter(a => a.status === 'PENDING').length;

            setStats({
                devices: devicesData?.count ?? 0,
                alerts: alertsDataRaw?.count ?? 0,
                pending: pendingAlerts,
                queueStatus: queueData?.data || { waiting: 0, active: 0, completed: 0, failed: 0 }
            });

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
        return (
          <div className="flex flex-col h-full items-center justify-center gap-4 bg-background">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin glow-primary"></div>
            <p className="text-muted-foreground animate-pulse font-medium tracking-widest text-xs uppercase">Initializing AAPADA Systems...</p>
          </div>
        );
    }

    return (
        <div className="flex-1 space-y-8 p-8 max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-4xl font-black tracking-tighter text-white">COMMAND CENTER</h2>
                  <p className="text-muted-foreground font-medium flex items-center gap-2 mt-1">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                    </span>
                    Real-time alert monitoring & system overview
                  </p>
                </div>
                <Button asChild size="lg" className="rounded-xl glow-primary font-bold px-6 border-0">
                    <Link to="/create-alert" className="flex items-center gap-2">
                        <Plus className="h-5 w-5" />
                        DEPLOY ALERT
                    </Link>
                </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <StatCard 
                  title="Registered Nodes" 
                  value={stats.devices} 
                  icon={Radio} 
                  trend="up" 
                  colorClass="primary"
                  glow={true}
                />
                <StatCard 
                  title="Total Broadcasts" 
                  value={stats.alerts} 
                  icon={AlertCircle} 
                  trend="up"
                />
                <StatCard 
                  title="Active Incidents" 
                  value={stats.pending} 
                  icon={Activity} 
                  colorClass="primary"
                />
                <Card className="glass border-white/5 overflow-hidden">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                      QUEUE LOAD
                      <BarChart3 className="h-4 w-4 text-accent" />
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-2">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-blue-400 uppercase"><Clock className="h-3 w-3" /> Waiting</div>
                        <div className="text-lg font-black">{stats.queueStatus.waiting}</div>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-accent uppercase"><Activity className="h-3 w-3" /> Active</div>
                        <div className="text-lg font-black text-accent">{stats.queueStatus.active}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                <Card className="lg:col-span-2 glass border-white/5 overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between border-b border-white/5 bg-white/2 pb-4 pt-4">
                        <div className="space-y-0.5">
                          <CardTitle className="text-lg font-bold flex items-center gap-2">
                              <MapPin className="h-5 w-5 text-primary" />
                              GEOSPATIAL MONITOR
                          </CardTitle>
                          <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-tight">Active alert zones in the region</p>
                        </div>
                        <Badge variant="outline" className="border-white/10 bg-white/5 text-primary font-bold">
                          {alertsData.length} ZONES
                        </Badge>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="relative" style={{ height: '480px' }}>
                            <MapContainer
                                center={[20.5937, 78.9629]}
                                zoom={5}
                                style={{ height: '100%', width: '100%' }}
                                scrollWheelZoom={true}
                                className="z-0"
                            >
                                <TileLayer
                                    attribution='&copy; <a href="https://carto.com/">CARTO</a>'
                                    url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                                />
                                {alertsData.map((alert) => {
                                    const [lng, lat] = alert.targetRegion.coordinates;
                                    const color = severityColors[alert.severity] || 'hsl(0 84% 60%)';
                                    return (
                                        <div key={alert._id}>
                                            <Marker position={[lat, lng]} icon={alertIcon}>
                                                <Popup className="glass-popup">
                                                    <div className="p-2 space-y-2 min-w-[160px]">
                                                        <div className="font-bold text-white border-b border-white/10 pb-1">{alert.title}</div>
                                                        <div className="flex items-center justify-between mt-2">
                                                            <Badge style={{ backgroundColor: color }} className="text-[10px] border-0 text-white font-bold">
                                                              {alert.severity}
                                                            </Badge>
                                                            <span className="text-[10px] text-muted-foreground font-medium">
                                                              {new Date(alert.createdAt).toLocaleDateString()}
                                                            </span>
                                                        </div>
                                                        {alert.targetRegion.radius && (
                                                            <div className="text-[11px] text-muted-foreground flex items-center gap-2 bg-white/5 p-1.5 rounded-lg border border-white/5">
                                                                <Activity className="h-3 w-3" />
                                                                Impact Radius: {alert.targetRegion.radius >= 1000
                                                                    ? `${(alert.targetRegion.radius / 1000).toFixed(1)} km`
                                                                    : `${alert.targetRegion.radius} m`
                                                                }
                                                            </div>
                                                        )}
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
                                                        fillOpacity: 0.15,
                                                        weight: 2,
                                                        dashArray: '8 6',
                                                    }}
                                                />
                                            )}
                                        </div>
                                    );
                                })}
                            </MapContainer>
                        </div>
                    </CardContent>
                </Card>

                <div className="space-y-6">
                  <Card className="glass border-white/5 overflow-hidden">
                    <CardHeader className="border-b border-white/5 bg-white/2 pb-4 pt-4">
                      <CardTitle className="text-lg font-bold flex items-center gap-2 uppercase tracking-tight">
                        <ListChecks className="h-5 w-5 text-accent" />
                        Queue Report
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-4">
                      <div className="flex items-center justify-between p-3 rounded-xl bg-green-500/5 border border-green-500/10 group hover:bg-green-500/10 transition-colors">
                        <div className="flex items-center gap-3">
                          <CheckCircle2 className="h-5 w-5 text-green-500" />
                          <span className="font-semibold text-sm">COMPLETED</span>
                        </div>
                        <span className="text-xl font-black text-green-500">{stats.queueStatus.completed}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-xl bg-red-500/5 border border-red-500/10 group hover:bg-red-500/10 transition-colors">
                        <div className="flex items-center gap-3">
                          <XCircle className="h-5 w-5 text-red-500" />
                          <span className="font-semibold text-sm">FAILED</span>
                        </div>
                        <span className="text-xl font-black text-red-500">{stats.queueStatus.failed}</span>
                      </div>
                      <div className="pt-4 mt-4 border-t border-white/5 flex items-center justify-between text-muted-foreground">
                        <span className="text-xs font-bold uppercase tracking-widest">System Health</span>
                        <span className="text-xs font-bold text-green-500">OPTIMAL</span>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="glass border-white/5 rounded-2xl p-6 flex flex-col items-center justify-center text-center gap-4 py-12 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="w-16 h-16 rounded-3xl bg-primary/10 flex items-center justify-center glow-primary mb-2 transition-transform group-hover:scale-110 duration-500">
                      <ShieldAlert className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white mb-1">Incident Report</h3>
                      <p className="text-xs text-muted-foreground px-4 leading-relaxed font-medium">
                        Quickly deploy emergency alerts to all registered nodes in specific radius.
                      </p>
                    </div>
                    <Button variant="outline" className="mt-2 rounded-xl border-white/10 hover:bg-white/5 transition-all" asChild>
                      <Link to="/alerts">VIEW ALL RECORDS</Link>
                    </Button>
                  </div>
                </div>
            </div>
        </div>
    );
}

// Stub for ShieldAlert since it's used and I didn't import it at start of Dashboard.jsx (actually I didn't)
// Fixed imports above.


