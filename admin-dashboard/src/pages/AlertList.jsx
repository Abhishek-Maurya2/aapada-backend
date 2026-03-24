import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Plus, 
  Trash2, 
  Search, 
  Filter, 
  MapPin, 
  MessageSquare, 
  Clock, 
  AlertCircle,
  MoreVertical,
  Download,
  ShieldAlert,
  ArrowLeft
} from "lucide-react";
import { cn } from '../lib/utils';

export default function AlertList() {
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState(null);

    useEffect(() => {
        fetchAlerts();
    }, []);

    const fetchAlerts = async () => {
        try {
            const response = await api.get('/alerts?includeExpired=true');
            if (response.data.success) {
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

    const getSeverityStyles = (severity) => {
        const map = {
            LOW: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
            MEDIUM: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
            HIGH: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
            CRITICAL: 'bg-red-500/10 text-red-500 border-red-500/30'
        };
        return map[severity] || 'bg-white/5 text-white/70 border-white/10';
    };

    const getStatusStyles = (status) => {
        const map = {
            PENDING: 'bg-white/5 text-muted-foreground border-white/10',
            PROCESSING: 'bg-accent/10 text-accent border-accent/20 animate-pulse',
            SENT: 'bg-green-500/10 text-green-500 border-green-500/20',
            FAILED: 'bg-red-500/10 text-red-500 border-red-500/20'
        };
        return map[status] || 'bg-white/5 text-white/50 border-white/5';
    };

    const deleteAlert = async (alertId, title) => {
        if (!window.confirm(`SECURE DELETE: Remove alert "${title}" and all associated logs?\n\nThis operation cannot be reversed.`)) {
            return;
        }
        setDeleting(alertId);
        try {
            const response = await api.delete(`/alerts/${alertId}`);
            if (response.data.success) {
                setAlerts(prev => prev.filter(a => a._id !== alertId));
            }
        } catch (err) {
            console.error('Failed to delete alert:', err);
        } finally {
            setDeleting(null);
        }
    };

    const isExpired = (expiresAt) => {
        if (!expiresAt) return false;
        return new Date(expiresAt) < new Date();
    };

    const getFlagColor = (flag) => {
        const map = {
            RED: '#EF4444',
            ORANGE: '#F97316',
            YELLOW: '#EAB308',
            GREEN: '#22C55E'
        };
        return map[flag] || '#6B7280';
    };

    if (loading) {
        return (
          <div className="flex flex-col h-full items-center justify-center gap-4 bg-background">
            <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="text-muted-foreground font-bold tracking-widest text-[10px] uppercase">Retrieving Transmission History...</p>
          </div>
        );
    }

    return (
        <div className="flex-1 space-y-8 p-8 max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <Button variant="ghost" size="icon" asChild className="rounded-full hover:bg-white/5 hidden md:flex">
                    <Link to="/">
                      <ArrowLeft className="h-6 w-6" />
                    </Link>
                  </Button>
                  <div>
                    <h2 className="text-3xl font-black tracking-tight text-white uppercase italic">Broadcast Registry</h2>
                    <p className="text-muted-foreground font-medium text-sm flex items-center gap-2">
                      <ShieldAlert className="h-4 w-4 text-primary" />
                      Comprehensive history of emergency transmissions.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" className="glass border-white/10 rounded-xl h-11 px-4 text-xs font-bold gap-2">
                        <Download className="h-4 w-4" />
                        EXPORT LOGS
                    </Button>
                    <Button asChild className="h-11 px-6 rounded-xl glow-primary font-bold border-0">
                        <Link to="/create-alert" className="flex items-center gap-2">
                            <Plus className="h-5 w-5" />
                            NEW DEPLOYMENT
                        </Link>
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="glass border-white/5 p-5 rounded-2xl space-y-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Active Streams</p>
                <p className="text-3xl font-black text-white">{alerts.filter(a => !isExpired(a.expiresAt)).length}</p>
              </div>
              <div className="glass border-white/5 p-5 rounded-2xl space-y-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Total Transactions</p>
                <p className="text-3xl font-black text-white">{alerts.length}</p>
              </div>
              <div className="glass border-white/5 p-5 rounded-2xl space-y-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Response Rate</p>
                <p className="text-3xl font-black text-accent">98.4%</p>
              </div>
            </div>

            {alerts.length === 0 ? (
                <Card className="glass border-white/5 h-64 flex flex-col items-center justify-center text-center gap-6">
                    <div className="w-16 h-16 rounded-full bg-white/2 flex items-center justify-center">
                      <Search className="h-8 w-8 text-muted-foreground/40" />
                    </div>
                    <div>
                      <p className="text-white font-bold mb-1">No transmissions detected</p>
                      <p className="text-xs text-muted-foreground max-w-xs mx-auto">The deployment registry is currently empty. Initialize a new alert to begin monitoring.</p>
                    </div>
                </Card>
            ) : (
                <Card className="glass border-white/5 overflow-hidden">
                    <CardHeader className="bg-white/2 border-b border-white/5 flex flex-row items-center justify-between py-4">
                        <CardTitle className="text-sm font-black uppercase tracking-widest">Incident History</CardTitle>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-muted-foreground hover:bg-white/5"><Search className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-muted-foreground hover:bg-white/5"><Filter className="h-4 w-4" /></Button>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader className="bg-white/2">
                                <TableRow className="border-white/5 hover:bg-transparent">
                                    <TableHead className="text-[10px] font-black uppercase text-muted-foreground">Broadcast Metadata</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase text-muted-foreground">Regional Target</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase text-muted-foreground text-center">Threat Level</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase text-muted-foreground text-center">Transmission</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase text-muted-foreground text-center">Engagement</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase text-muted-foreground">Post Timestamp</TableHead>
                                    <TableHead className="w-[60px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {alerts.map((alert) => (
                                    <TableRow key={alert._id} className="border-white/5 hover:bg-white/1 group transition-colors">
                                        <TableCell className="py-5">
                                            <div className="flex items-start gap-3">
                                                <div 
                                                  className="w-1 h-10 rounded-full mt-1 shrink-0" 
                                                  style={{ backgroundColor: getFlagColor(alert.flag) }} 
                                                />
                                                <div className="space-y-1">
                                                  <div className="flex items-center gap-2">
                                                      <span className="font-bold text-white text-sm">{alert.title}</span>
                                                      {isExpired(alert.expiresAt) && (
                                                          <Badge variant="outline" className="text-[9px] font-black uppercase tracking-tighter h-4 border-red-500/30 text-red-500/60 bg-red-500/5">OFFLINE</Badge>
                                                      )}
                                                  </div>
                                                  <div className="flex items-center gap-1.5 overflow-hidden">
                                                      <Badge variant="outline" className="text-[9px] font-bold px-1 py-0 border-white/10 bg-white/5 text-muted-foreground shrink-0">{alert.alertType}</Badge>
                                                      <span className="text-[11px] text-muted-foreground truncate leading-none">
                                                        {alert.message}
                                                      </span>
                                                  </div>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2 group/loc cursor-default">
                                              <MapPin className="h-3.5 w-3.5 text-muted-foreground group-hover/loc:text-primary transition-colors" />
                                              {typeof alert.targetRegion === 'object' && alert.targetRegion?.type === 'Point' ? (
                                                  <div className="text-[10px] font-bold text-muted-foreground leading-tight space-y-0.5">
                                                      <div className="text-white/80">LAT {alert.targetRegion.coordinates[1].toFixed(3)}</div>
                                                      <div className="text-white/80">LON {alert.targetRegion.coordinates[0].toFixed(3)}</div>
                                                      <div className="text-primary/70">{alert.targetRegion.radius / 1000}km ZONE</div>
                                                  </div>
                                              ) : (
                                                  <span className="text-xs font-bold text-white/80">{alert.targetRegion || 'ALL NODES'}</span>
                                              )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Badge className={cn("text-[10px] font-black uppercase shadow-sm border px-2 py-0.5", getSeverityStyles(alert.severity))}>
                                                {alert.severity}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Badge className={cn("text-[10px] font-black uppercase shadow-sm border px-2 py-0.5", getStatusStyles(alert.status))}>
                                                {alert.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <div className="flex flex-col items-center group/feedback">
                                                <div className="flex items-center gap-1 font-black text-white">
                                                  <MessageSquare className="h-3 w-3 text-accent group-hover/feedback:scale-110 transition-transform" />
                                                  {alert.feedbackCount}
                                                </div>
                                                <span className="text-[9px] font-bold text-muted-foreground uppercase opacity-60">Reports</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-0.5">
                                                <div className="flex items-center gap-1 text-[11px] font-bold text-white/90">
                                                  <Clock className="h-3 w-3 text-muted-foreground" />
                                                  {new Date(alert.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                                <div className="text-[10px] font-medium text-muted-foreground ml-4">
                                                  {new Date(alert.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                              <button
                                                  onClick={() => deleteAlert(alert._id, alert.title)}
                                                  disabled={deleting === alert._id}
                                                  className="p-2 rounded-xl text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-all disabled:opacity-50"
                                                  title="Delete record"
                                              >
                                                  <Trash2 className="h-4 w-4" />
                                              </button>
                                              <button className="p-2 rounded-xl text-muted-foreground hover:text-white hover:bg-white/5 transition-all">
                                                <MoreVertical className="h-4 w-4" />
                                              </button>
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

// Ensure all Lucide icons used are imported

