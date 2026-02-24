import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Circle, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin } from "lucide-react";

// Fix default marker icon issue with bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom red marker for alert epicenter
const alertIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
});

// Click handler component
function MapClickHandler({ onMapClick }) {
    useMapEvents({
        click(e) {
            onMapClick(e.latlng);
        },
    });
    return null;
}

// Component to recenter map when position changes
function RecenterMap({ position }) {
    const map = useMap();
    useEffect(() => {
        if (position) {
            map.flyTo(position, map.getZoom(), { duration: 0.5 });
        }
    }, [position, map]);
    return null;
}

export default function MapPicker({
    onLocationSelect,
    initialLat = null,
    initialLng = null,
    initialRadius = 5000,
    height = '400px',
    showRadiusControl = true,
}) {
    const [position, setPosition] = useState(
        initialLat && initialLng ? [initialLat, initialLng] : null
    );
    const [radius, setRadius] = useState(initialRadius);

    const defaultCenter = [20.5937, 78.9629]; // Center of India
    const defaultZoom = 5;

    const handleMapClick = (latlng) => {
        const newPos = [latlng.lat, latlng.lng];
        setPosition(newPos);
        onLocationSelect?.(latlng.lat, latlng.lng, radius);
    };

    const handleRadiusChange = (e) => {
        const newRadius = parseInt(e.target.value, 10);
        setRadius(newRadius);
        if (position) {
            onLocationSelect?.(position[0], position[1], newRadius);
        }
    };

    const clearSelection = () => {
        setPosition(null);
        setRadius(5000);
        onLocationSelect?.(null, null, null);
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Select Alert Location
                </CardTitle>
                {position && (
                    <button
                        type="button"
                        onClick={clearSelection}
                        className="text-xs text-muted-foreground hover:text-destructive transition-colors"
                    >
                        Clear Selection
                    </button>
                )}
            </CardHeader>
            <CardContent className="space-y-3">
                <div className="rounded-lg overflow-hidden border border-border" style={{ height }}>
                    <MapContainer
                        center={position || defaultCenter}
                        zoom={position ? 10 : defaultZoom}
                        style={{ height: '100%', width: '100%' }}
                        scrollWheelZoom={true}
                    >
                        <TileLayer
                            attribution='&copy; <a href="https://carto.com/">CARTO</a>'
                            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                        />
                        <MapClickHandler onMapClick={handleMapClick} />
                        {position && <RecenterMap position={position} />}
                        {position && (
                            <>
                                <Marker position={position} icon={alertIcon} />
                                <Circle
                                    center={position}
                                    radius={radius}
                                    pathOptions={{
                                        color: '#ef4444',
                                        fillColor: '#ef4444',
                                        fillOpacity: 0.15,
                                        weight: 2,
                                        dashArray: '6 4',
                                    }}
                                />
                            </>
                        )}
                    </MapContainer>
                </div>

                {/* Coordinates Display */}
                {position && (
                    <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="bg-muted/50 rounded-md p-2.5 border border-border/50">
                            <span className="text-muted-foreground text-xs block mb-0.5">Latitude</span>
                            <span className="font-mono font-medium">{position[0].toFixed(6)}</span>
                        </div>
                        <div className="bg-muted/50 rounded-md p-2.5 border border-border/50">
                            <span className="text-muted-foreground text-xs block mb-0.5">Longitude</span>
                            <span className="font-mono font-medium">{position[1].toFixed(6)}</span>
                        </div>
                    </div>
                )}

                {/* Radius Control */}
                {showRadiusControl && (
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium">
                                Radius
                            </label>
                            <span className="text-sm font-mono text-muted-foreground">
                                {radius >= 1000 ? `${(radius / 1000).toFixed(1)} km` : `${radius} m`}
                            </span>
                        </div>
                        <input
                            type="range"
                            min="500"
                            max="100000"
                            step="500"
                            value={radius}
                            onChange={handleRadiusChange}
                            className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-red-500"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                            <span>500m</span>
                            <span>100km</span>
                        </div>
                    </div>
                )}

                {!position && (
                    <p className="text-sm text-muted-foreground text-center py-1">
                        Click on the map to drop a pin and select the alert epicenter
                    </p>
                )}
            </CardContent>
        </Card>
    );
}
