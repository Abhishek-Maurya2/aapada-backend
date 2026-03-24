import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import MapPicker from '../components/MapPicker';
import { 
  AlertCircle, 
  Clock, 
  Flag, 
  FileText, 
  MapPin, 
  Send,
  ArrowLeft,
  Info,
  ShieldAlert,
  Zap,
  CheckCircle2
} from 'lucide-react';
import { cn } from '../lib/utils';

const ALERT_TYPES = [
    { value: 'Earthquake', icon: '🌍' },
    { value: 'Flood', icon: '🌊' },
    { value: 'Cyclone', icon: '🌀' },
    { value: 'Tsunami', icon: '🌊' },
    { value: 'Landslide', icon: '⛰️' },
    { value: 'Fire', icon: '🔥' },
    { value: 'Industrial Accident', icon: '🏭' },
    { value: 'Heatwave', icon: '☀️' },
    { value: 'Thunderstorm', icon: '⛈️' },
    { value: 'Other', icon: '⚠️' },
];

const FLAGS = [
    { value: 'RED', color: 'bg-red-500', label: 'Critical', desc: 'Extreme danger' },
    { value: 'ORANGE', color: 'bg-orange-500', label: 'High', desc: 'High risk' },
    { value: 'YELLOW', color: 'bg-yellow-500', label: 'Elevated', desc: 'Moderate risk' },
    { value: 'GREEN', color: 'bg-green-500', label: 'Guard', desc: 'Low risk' },
];

const EXPIRY_OPTIONS = [
    { value: 1, label: '1h' },
    { value: 6, label: '6h' },
    { value: 24, label: '24h' },
    { value: 72, label: '3d' },
    { value: 168, label: '7d' },
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
            title: prev.title || `${type.value} RED ALERT`,
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
        <div className="flex-1 p-8 max-w-5xl mx-auto space-y-8 pb-20">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" asChild className="rounded-full hover:bg-white/5">
                <Link to="/">
                  <ArrowLeft className="h-6 w-6" />
                </Link>
              </Button>
              <div>
                <h2 className="text-3xl font-black tracking-tight text-white uppercase">New Deployment</h2>
                <p className="text-muted-foreground font-medium text-sm flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 text-primary" />
                  Configure and broadcast emergency alerts to nodes.
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                {success && (
                    <div className="glass border-green-500/50 bg-green-500/10 text-green-400 p-4 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-500">
                        <CheckCircle2 className="h-5 w-5" />
                        <span className="font-bold">Transmission Successful: Alert queued for broadcast.</span>
                    </div>
                )}
                
                {error && (
                    <div className="glass border-red-500/50 bg-red-500/10 text-red-400 p-4 rounded-2xl flex items-center gap-3 animate-shake">
                        <AlertCircle className="h-5 w-5" />
                        <span className="font-bold">Error: {error}</span>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  {/* Left Column: Core Configuration */}
                  <div className="lg:col-span-12 space-y-8">
                    {/* Alert Type */}
                    <Card className="glass border-white/5 overflow-hidden">
                        <CardHeader className="bg-white/2 border-b border-white/5 pb-4">
                            <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                                <Zap className="h-4 w-4 text-accent" />
                                1. Select Incident Type
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                                {ALERT_TYPES.map((type) => (
                                    <button
                                        key={type.value}
                                        type="button"
                                        onClick={() => handleAlertTypeSelect(type)}
                                        className={cn(
                                          "flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all duration-300 gap-2",
                                          formData.alertType === type.value
                                            ? "bg-primary/10 border-primary shadow-[0_0_15px_-3px_hsl(var(--primary)/0.4)] scale-105"
                                            : "bg-white/2 border-transparent hover:border-white/10 hover:bg-white/5"
                                        )}
                                    >
                                        <span className="text-2xl">{type.icon}</span>
                                        <span className={cn(
                                          "text-[10px] font-black uppercase tracking-tight text-center",
                                          formData.alertType === type.value ? "text-primary" : "text-muted-foreground"
                                        )}>
                                          {type.value}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {/* Alert Details */}
                      <Card className="glass border-white/5 overflow-hidden h-full">
                          <CardHeader className="bg-white/2 border-b border-white/5 pb-4">
                              <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                                  <FileText className="h-4 w-4 text-accent" />
                                  2. Transmission Details
                              </CardTitle>
                          </CardHeader>
                          <CardContent className="pt-6 space-y-5">
                              <div className="space-y-2">
                                  <Label htmlFor="title" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Broadcast Title</Label>
                                  <Input
                                      type="text"
                                      id="title"
                                      name="title"
                                      value={formData.title}
                                      onChange={handleChange}
                                      placeholder="e.g., FLASH FLOOD EMERGENCY"
                                      className="glass border-white/10 focus:border-primary/50 h-12 font-bold placeholder:font-normal"
                                      required
                                  />
                              </div>

                              <div className="space-y-2">
                                  <Label htmlFor="message" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Primary Message</Label>
                                  <Textarea
                                      id="message"
                                      name="message"
                                      value={formData.message}
                                      onChange={handleChange}
                                      placeholder="Evacuate to higher ground immediately..."
                                      rows={5}
                                      className="glass border-white/10 focus:border-primary/50 font-medium leading-relaxed resize-none"
                                      required
                                  />
                              </div>
                          </CardContent>
                      </Card>

                      {/* Severity & Settings */}
                      <div className="space-y-8">
                        <Card className="glass border-white/5 overflow-hidden">
                            <CardHeader className="bg-white/2 border-b border-white/5 pb-4">
                                <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                                    <Flag className="h-4 w-4 text-accent" />
                                    3. Severity Protocol
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <div className="grid grid-cols-2 gap-3">
                                    {FLAGS.map((f) => (
                                        <button
                                            key={f.value}
                                            type="button"
                                            onClick={() => setFormData(prev => ({ ...prev, flag: f.value, severity: f.value === 'RED' ? 'CRITICAL' : f.value === 'ORANGE' ? 'HIGH' : f.value === 'YELLOW' ? 'MEDIUM' : 'LOW' }))}
                                            className={cn(
                                              "flex flex-col items-start p-3 rounded-xl border-2 transition-all duration-300 gap-1 text-left relative overflow-hidden group",
                                              formData.flag === f.value
                                                ? "bg-white/5 border-white/20"
                                                : "bg-white/2 border-transparent hover:border-white/5"
                                            )}
                                        >
                                            <div className={cn("w-1 h-full absolute left-0 top-0", f.color)} />
                                            <span className={cn("text-[10px] font-black uppercase tracking-tighter", formData.flag === f.value ? "text-white" : "text-muted-foreground")}>
                                              {f.label}
                                            </span>
                                            <span className="text-[9px] text-muted-foreground/60 leading-tight">
                                              {f.desc}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="glass border-white/5 overflow-hidden">
                            <CardHeader className="bg-white/2 border-b border-white/5 pb-4">
                                <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-accent" />
                                    4. Duration Limit
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <div className="flex flex-wrap gap-2">
                                    {EXPIRY_OPTIONS.map((opt) => (
                                        <button
                                            key={opt.value}
                                            type="button"
                                            onClick={() => setFormData(prev => ({ ...prev, expiresIn: opt.value }))}
                                            className={cn(
                                              "px-4 py-2 rounded-xl text-xs font-black border transition-all duration-300",
                                              formData.expiresIn === opt.value
                                                ? "bg-primary text-white border-primary glow-primary"
                                                : "bg-white/5 border-transparent text-muted-foreground hover:bg-white/10"
                                            )}
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                                <p className="text-[10px] text-muted-foreground mt-4 italic flex items-center gap-1.5">
                                  <Info className="h-3 w-3" />
                                  System will cease transmission after this window.
                                </p>
                            </CardContent>
                        </Card>
                      </div>
                    </div>

                    {/* Target Area */}
                    <Card className="glass border-white/5 overflow-hidden">
                        <CardHeader className="bg-white/2 border-b border-white/5 pb-4 flex flex-row items-center justify-between">
                            <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-accent" />
                                5. Target Geofence
                            </CardTitle>
                            <div className="flex items-center gap-2 bg-black/20 p-1 rounded-lg">
                              <button 
                                type="button" 
                                onClick={() => setUseGeofence(true)}
                                className={cn("px-3 py-1 text-[10px] font-bold rounded-md transition-all", useGeofence ? "bg-primary text-white" : "text-muted-foreground")}
                              >
                                CUSTOM ZONE
                              </button>
                              <button 
                                type="button" 
                                onClick={() => {
                                  setUseGeofence(false);
                                  handleLocationSelect(null, null, null);
                                }}
                                className={cn("px-3 py-1 text-[10px] font-bold rounded-md transition-all", !useGeofence ? "bg-primary text-white" : "text-muted-foreground")}
                              >
                                BROADCAST ALL
                              </button>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            {useGeofence ? (
                                <div className="relative">
                                  <MapPicker
                                      onLocationSelect={handleLocationSelect}
                                      initialRadius={5000}
                                      height="400px"
                                  />
                                </div>
                            ) : (
                                <div className="p-8 flex flex-col items-center justify-center gap-4 bg-primary/2">
                                    <div className="w-16 h-16 rounded-3xl bg-primary/10 flex items-center justify-center glow-primary">
                                      <ShieldAlert className="h-8 w-8 text-primary" />
                                    </div>
                                    <div className="text-center max-w-sm">
                                      <h3 className="font-bold text-white mb-2 uppercase tracking-widest text-sm">Global Broadcast Mode</h3>
                                      <p className="text-xs text-muted-foreground leading-relaxed">
                                        Alert will be transmitted to every registered device in the network system-wide. Use this only for critical national emergencies.
                                      </p>
                                    </div>
                                    <Input
                                        type="text"
                                        id="targetRegion"
                                        name="targetRegion"
                                        value={formData.targetRegion}
                                        onChange={handleChange}
                                        placeholder="Region Name (Optional, e.g. North Zone)"
                                        className="glass border-white/10 max-w-xs text-center font-bold text-xs"
                                    />
                                </div>
                            )}
                        </CardContent>
                    </Card>
                    
                    {/* Final Submission Card */}
                    <Card className="glass-dark border-primary/20 bg-primary/2 overflow-hidden">
                      <CardContent className="p-8 flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="space-y-1">
                          <h3 className="text-xl font-black text-white italic tracking-tighter uppercase">Ready for Deployment?</h3>
                          <p className="text-xs text-muted-foreground font-medium max-w-md">
                            Review all parameters. Once initiated, the broadcast protocol will begin immediately across all selected channels.
                          </p>
                        </div>
                        <Button 
                          type="submit" 
                          disabled={loading} 
                          size="lg" 
                          className="h-14 px-10 rounded-2xl bg-primary hover:bg-red-600 glow-primary font-black text-lg transition-all active:scale-95 border-0"
                        >
                          {loading ? (
                            <div className="flex items-center gap-2">
                              <Clock className="h-5 w-5 animate-spin" />
                              INITIATING...
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              DEPLOY BROADCAST
                              <Send className="h-5 w-5" />
                            </div>
                          )}
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                </div>
            </form>
        </div>
    );
}

// Ensured all icons are imported at the top

