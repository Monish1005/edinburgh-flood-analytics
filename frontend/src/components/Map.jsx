import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, GeoJSON, useMap, Marker, LayersControl } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css'; // Draw CSS
import L from 'leaflet';
import 'leaflet-draw'; // Draw JS
import { ExternalLink, Map as MapIcon } from 'lucide-react';

// Fix generic Leaflet marker icon issue
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
const DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// Helper component to handle Map Flying
function LocationController({ location }) {
    const map = useMap();
    useEffect(() => {
        if (location) {
            map.flyTo([location.lat, location.lng], 16, {
                duration: 2
            });
        }
    }, [location, map]);
    return null;
}

// Custom Draw Control
function DrawControl({ setFilterPolygon, filterPolygon }) {
    const map = useMap();

    useEffect(() => {
        // FeatureGroup is to store editable layers
        const drawnItems = new L.FeatureGroup();
        // Since we are moving to LayersControl, we might want to ensure this group is managed correctly
        // But simply adding it to map works fine overlaying base layers
        map.addLayer(drawnItems);

        // Define Draw Control options
        const drawControl = new L.Control.Draw({
            position: 'bottomright', // Move to bottom right to avoid sidebar conflict
            edit: {
                featureGroup: drawnItems,
                remove: true,
                edit: false // Disable editing for simplicity, allow delete/redraw
            },
            draw: {
                polygon: {
                    shapeOptions: {
                        color: '#a855f7', // Purple
                        fillOpacity: 0.2
                    }
                },
                rectangle: false, // DISABLED as requested
                marker: false,
                circle: false,
                circlemarker: false,
                polyline: false // We only want areas
            }
        });
        map.addControl(drawControl);

        // Handle Create Event
        map.on(L.Draw.Event.CREATED, (e) => {
            const layer = e.layer;
            drawnItems.clearLayers(); // Only allow one shape at a time
            drawnItems.addLayer(layer);

            // Extract GeoJSON
            const geoJson = layer.toGeoJSON();
            setFilterPolygon(geoJson);
        });

        // Handle Delete Event
        map.on(L.Draw.Event.DELETED, () => {
            setFilterPolygon(null);
        });

        // Cleanup
        return () => {
            map.removeControl(drawControl);
            map.removeLayer(drawnItems);
        };
    }, [map, setFilterPolygon]);

    // External reset support (if parent clears polygon)
    useEffect(() => {
        if (!filterPolygon) {
            // We can't easily clear the drawnItems FeatureGroup from here without ref
            // But the map re-render might handle it or we assume user uses delete button
            // For now, this loop just ensures map state is consistent if we cared about 2-way sync
            // A real implementation might need a Ref for drawnItems
        }
    }, [filterPolygon]);

    return null;
}

const Map = ({ buildings, scenario, depthReduction, showExtents, showSimdLayer, selectedQuintiles, colorMode, userLocation, simdColorMode, setFilterPolygon, filterPolygon }) => {
    const [processedBuildings, setProcessedBuildings] = useState([]);
    const [extentData, setExtentData] = useState(null);
    const [simdData, setSimdData] = useState(null);

    // Load Extents & SIMD Data
    useEffect(() => {
        // Clear previous data to prevent showing wrong layer during fetch
        setExtentData(null);

        // Determine API URL (add time to break cache if needed, or versioning)
        const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
            ? 'http://localhost:8000'
            : window.location.origin;

        async function loadLayers() {
            try {
                // Load current scenario extent
                const sceneName = scenario === 'H' ? 'high' : scenario === 'M' ? 'medium' : 'low';
                // Add version param to force fresh load
                const resExt = await fetch(`${API_URL}/data/extent_${sceneName}.geojson?v=2`);
                if (resExt.ok) {
                    setExtentData(await resExt.json());
                }

                // Load SIMD
                if (!simdData) {
                    const resSimd = await fetch(`${API_URL}/data/simd_zones.geojson?v=2`);
                    if (resSimd.ok) {
                        setSimdData(await resSimd.json());
                    }
                }
            } catch (e) {
                console.error("Layer load error:", e);
            }
        }
        loadLayers();
    }, [scenario]); // Reload extent when scenario changes

    // Process Buildings (Apply Mitigation & Color Mode)
    useEffect(() => {
        if (!buildings || buildings.length === 0) return;

        const sceneKey = scenario.toLowerCase();
        const gridKey = `gridcode_${sceneKey}`;

        const processed = buildings.map(b => {
            const originalGrid = b.properties[gridKey];
            let newGrid = Math.max(0, originalGrid - depthReduction);
            let newDamage = 0;
            if (newGrid === 1) newDamage = b.properties.property_value * 0.25 * b.properties.residential_units;
            else if (newGrid === 2) newDamage = b.properties.property_value * 0.40 * b.properties.residential_units;
            else if (newGrid === 3) newDamage = b.properties.property_value * 0.75 * b.properties.residential_units;

            let color = '#10b981'; // Green (Safe/Default Risk)

            if (colorMode === 'usage') {
                const u = b.properties.use_class; // Residential, Commercial, Mixed, Other
                if (u === 'Residential') color = '#3b82f6'; // Blue
                else if (u === 'Commercial') color = '#a855f7'; // Purple
                else if (u === 'Mixed') color = '#fb923c'; // Orange
                else color = '#64748b'; // Gray (Other)
            } else {
                // Risk Mode
                if (newGrid === 1) color = '#facc15'; // Yellow
                if (newGrid === 2) color = '#f97316'; // Orange
                if (newGrid === 3) color = '#ef4444'; // Red
            }

            if (originalGrid > 0) {
                return {
                    ...b,
                    computed: {
                        grid: newGrid,
                        damage: newDamage,
                        color: color
                    }
                };
            }
            return null;
        }).filter(b => b !== null);

        setProcessedBuildings(processed);
    }, [buildings, scenario, depthReduction, colorMode]);

    // Style for SIMD Zones
    const simdStyle = (feature) => {
        // Apply Quintile Filter to SIMD Layer Viz as well
        const q = feature.properties.Quintilev2;
        // If NOT in selected quintiles, hide it (make transparent)
        if (selectedQuintiles && !selectedQuintiles.includes(q)) {
            return { fillOpacity: 0, opacity: 0, weight: 0 };
        }

        const sc = scenario.toLowerCase(); // high, medium, low
        let color = '#fee2e2';
        let opacity = 0.4;

        if (simdColorMode === 'units') {
            // Coloring by Units at Risk
            const units = feature.properties[`units_risk_${sc}`] || 0;
            color = '#e0f2fe'; // Base Light Blue
            if (units > 10) color = '#7dd3fc';
            if (units > 50) color = '#0ea5e9';
            if (units > 100) color = '#0369a1';
        } else {
            // Default: Coloring by Damage
            const dmg = feature.properties[`zone_damage_${sc}`] || 0;
            if (dmg > 5000000) color = '#fca5a5';
            if (dmg > 20000000) color = '#ef4444';
            if (dmg > 50000000) color = '#b91c1c';
        }

        return {
            fillColor: color,
            weight: 1,
            opacity: 1,
            color: 'white', // Border color
            fillOpacity: opacity
        };
    };

    return (
        <MapContainer
            center={[55.9533, -3.1883]}
            zoom={12}
            style={{ height: '100%', width: '100%', background: '#0f172a' }}
        // Remove className that adds glassmorphism to container itself, keeps it clean
        >
            {/* Base Layers Control */}
            <LayersControl position="bottomright">

                <LayersControl.BaseLayer checked name="Dark Mode">
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
                        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                    />
                </LayersControl.BaseLayer>

                <LayersControl.BaseLayer name="Satellite">
                    <TileLayer
                        attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
                        url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                    />
                </LayersControl.BaseLayer>

                <LayersControl.BaseLayer name="Light Mode">
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
                        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{y}/{x}{r}.png"
                    />
                </LayersControl.BaseLayer>

                <LayersControl.BaseLayer name="OpenStreetMap">
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                </LayersControl.BaseLayer>

                <LayersControl.BaseLayer name="Terrain">
                    <TileLayer
                        attribution='Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (CC-BY-SA)'
                        url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
                    />
                </LayersControl.BaseLayer>

            </LayersControl>

            {/* Lasso Draw Control */}
            <DrawControl setFilterPolygon={setFilterPolygon} filterPolygon={filterPolygon} />

            {/* User Location Control & Marker */}
            <LocationController location={userLocation} />
            {userLocation && <Marker position={[userLocation.lat, userLocation.lng]} />}

            {/* 1. Flood Extents (Controlled by Prop) */}
            {showExtents && extentData && (
                <GeoJSON
                    key={`extent-${scenario}`}
                    data={extentData}
                    style={{ color: '#3b82f6', weight: 0, fillOpacity: 0.3 }}
                    interactive={false}
                />
            )}

            {/* 2. SIMD Zones (Controlled by Prop + Quintile Filter) */}
            {showSimdLayer && simdData && (
                <GeoJSON
                    key="simd-layer" // Key doesn't need to change unless data changes
                    data={simdData}
                    style={simdStyle}
                    onEachFeature={(feature, layer) => {
                        const sc = scenario.toLowerCase();
                        const unitsRisk = feature.properties[`units_risk_${sc}`] || 0;
                        const damage = feature.properties[`zone_damage_${sc}`] || 0;

                        layer.bindPopup(`
                        <div class='text-slate-800 font-sans' style='min-width:150px'>
                            <strong>${feature.properties.DZName}</strong><br/>
                            <span class='text-xs'>Quintile ${feature.properties.Quintilev2}</span><hr class='my-1'/>
                            Total Damage: £${(damage / 1000000).toFixed(1)}M<br/>
                            Units at risk: ${unitsRisk}
                        </div>
                    `);
                    }}
                />
            )}

            {/* 3. Buildings (Already filtered by App before passed here, but we iterate processed) */}
            {processedBuildings.map((b) => (
                <CircleMarker
                    key={b.properties.osid}
                    center={[b.geometry.coordinates[1], b.geometry.coordinates[0]]}
                    pathOptions={{
                        color: b.computed.color,
                        fillColor: b.computed.color,
                        fillOpacity: 0.7,
                        weight: 0
                    }}
                    radius={b.computed.grid === 0 ? 3 : 5}
                >
                    <Popup className="glass-popup">
                        <div className="text-slate-800 min-w-[200px]">
                            <h3 className="font-bold text-sm m-0 text-slate-900 border-b border-slate-200 pb-1 mb-2">
                                {b.properties.description || "Building"}
                            </h3>

                            <div className="text-xs space-y-1 mb-3">
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Usage:</span>
                                    <span className="font-medium text-slate-700">{b.properties.use_class}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Zone:</span>
                                    <span className="font-medium text-slate-700">{b.properties.zone_name}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Sector:</span>
                                    <span className="font-medium text-slate-700">{b.properties.postcode_sector}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">SIMD:</span>
                                    <span className="font-medium text-slate-700">Quintile {b.properties.quintile}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Res. Units:</span>
                                    <span className="font-medium text-slate-700">{Math.round(b.properties.residential_units)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Comm. Units:</span>
                                    <span className="font-medium text-slate-700">{Math.round(b.properties.buildinguse_addresscount_commercial || 0)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Val/Unit:</span>
                                    <span className="font-medium text-slate-700">£{Math.round(b.properties.property_value).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between border-t border-dashed border-slate-300 pt-1 mt-1">
                                    <span className="text-slate-500 font-semibold">Total Asset:</span>
                                    <span className="font-bold text-slate-800">£{Math.round(b.properties.property_value * b.properties.residential_units).toLocaleString()}</span>
                                </div>
                            </div>

                            <a
                                href={`https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${b.geometry.coordinates[1]},${b.geometry.coordinates[0]}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block w-full text-center bg-blue-50 hover:bg-blue-100 text-blue-600 font-medium py-2 rounded transition-colors flex items-center justify-center gap-2 text-xs"
                            >
                                <ExternalLink size={12} /> Open Street View
                            </a>

                            <div className="bg-slate-50 p-2 rounded border border-slate-200 mt-2">
                                <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1">
                                    Risk Analysis ({scenario === 'H' ? '10yr' : scenario === 'M' ? '200yr' : '1000yr'})
                                </div>
                                <div className="flex justify-between items-end mb-1">
                                    <span className="text-xs text-slate-500">Orig Depth:</span>
                                    <span className="font-mono font-bold text-slate-700">{b.properties[`gridcode_${scenario.toLowerCase()}`]}</span>
                                </div>
                                <div className="flex justify-between items-end mb-1">
                                    <span className="text-xs text-emerald-600 font-medium">New Depth:</span>
                                    <span className="font-mono font-bold text-emerald-600">{b.computed.grid}</span>
                                </div>
                                <div className="border-t border-slate-200 mt-1 pt-1 flex justify-between items-end">
                                    <span className="text-xs font-bold text-red-500">Damage:</span>
                                    <span className="font-bold text-red-600">£{Math.round(b.computed.damage).toLocaleString()}</span>
                                </div>
                            </div>
                        </div>
                    </Popup>
                </CircleMarker>
            ))}

        </MapContainer>
    );
};

export default Map;
