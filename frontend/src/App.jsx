import React, { useState, useEffect, useMemo } from 'react';
import './index.css';
import Map from './components/Map';
import Dashboard from './components/Dashboard';
import { Loader2 } from 'lucide-react';
import TourGuide from './components/TourGuide';
import * as turf from '@turf/turf';

function App() {
  const [buildings, setBuildings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Interaction State
  const [scenario, setScenario] = useState('M'); // Default Medium
  const [depthReduction, setDepthReduction] = useState(0); // 0 = no mitigation

  // Layer State
  const [showExtents, setShowExtents] = useState(false);
  const [showSimdLayer, setShowSimdLayer] = useState(false);

  // Advanced Filter State
  const [selectedQuintiles, setSelectedQuintiles] = useState([1, 2, 3, 4, 5]);
  const [selectedUsages, setSelectedUsages] = useState(['Residential', 'Mixed']);
  // Color Mode: 'risk' or 'usage'
  const [colorMode, setColorMode] = useState('risk');
  // SIMD Color Mode: 'damage' or 'units'
  const [simdColorMode, setSimdColorMode] = useState('damage');

  // User Location State
  const [userLocation, setUserLocation] = useState(null); // { lat, lng } or null

  // Filter Polygon State (Lasso)
  const [filterPolygon, setFilterPolygon] = useState(null);

  useEffect(() => {
    // Determine API URL
    const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      ? 'http://localhost:8000'
      : window.location.origin;

    async function fetchData() {
      try {
        console.log("Fetching buildings...");
        const res = await fetch(`${API_URL}/data/buildings.geojson`);
        if (!res.ok) throw new Error("Failed to fetch data");
        const data = await res.json();

        // GeoJSON FeatureCollection -> Array of features
        setBuildings(data.features);
        setLoading(false);
      } catch (err) {
        console.error(err);
        setLoading(false);
        setError(err.message);
      }
    }

    fetchData();
  }, []);

  // Filter Logic (Memoized)
  const filteredBuildings = useMemo(() => {
    if (!buildings) return [];

    return buildings.filter(b => {
      const props = b.properties;
      const q = props.quintile || 0;
      const u = props.use_class || 'Other';

      // 1. Quintile Filter
      const quintileMatch = selectedQuintiles.includes(q) || (q === 0 && selectedQuintiles.length === 5);
      if (!quintileMatch) return false;

      // 2. Usage Filter
      const usageMatch = selectedUsages.includes(u);
      if (!usageMatch) return false;

      // 3. Polygon Filter (Lasso)
      if (filterPolygon) {
        try {
          // Creating a Turf point [lon, lat] from GeoJSON [lon, lat]
          const pt = turf.point(b.geometry.coordinates);
          if (!turf.booleanPointInPolygon(pt, filterPolygon)) {
            return false;
          }
        } catch (e) {
          console.warn("Polygon check failed", e);
        }
      }

      return true;
    });
  }, [buildings, selectedQuintiles, selectedUsages, filterPolygon]);

  if (loading) {
    return (
      <div className="w-screen h-screen bg-slate-900 flex items-center justify-center flex-col gap-4">
        <Loader2 className="animate-spin text-blue-500" size={48} />
        <p className="text-slate-400 font-mono animate-pulse">Loading Flood Risk Models...</p>
      </div>
    );
  }
  if (error) return <div className="h-screen w-screen bg-slate-900 flex items-center justify-center text-red-500">Error: {error}</div>;


  return (
    <div className="h-screen w-screen bg-slate-900 text-white overflow-hidden relative">

      {/* 1. Main Map Area (Full Screen Background) */}
      <div id="map-container" className="absolute inset-0 z-0">
        <Map
          buildings={filteredBuildings}
          scenario={scenario}
          depthReduction={depthReduction}
          showExtents={showExtents}
          showSimdLayer={showSimdLayer}
          selectedQuintiles={selectedQuintiles}
          colorMode={colorMode}
          simdColorMode={simdColorMode} // Pass SIMD mode
          userLocation={userLocation} // Pass location to Map
          filterPolygon={filterPolygon}
          setFilterPolygon={setFilterPolygon}
        />
      </div>

      {/* 2. Overlay Badges (Top Right) */}
      <div className="absolute top-4 right-4 z-[400] flex flex-col gap-2 items-end pointer-events-none">
        {colorMode === 'risk' ? (
          <>
            <div className="glass-panel px-3 py-1 flex items-center gap-2 pointer-events-auto">
              <div className="w-2 h-2 rounded-full bg-red-500"></div>
              <span className="text-xs font-semibold">High Risk</span>
            </div>
            <div className="glass-panel px-3 py-1 flex items-center gap-2 pointer-events-auto">
              <div className="w-2 h-2 rounded-full bg-orange-500"></div>
              <span className="text-xs font-semibold">Medium Risk</span>
            </div>
            <div className="glass-panel px-3 py-1 flex items-center gap-2 pointer-events-auto">
              <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
              <span className="text-xs font-semibold">Low Risk</span>
            </div>
            <div className="glass-panel px-3 py-1 flex items-center gap-2 pointer-events-auto">
              <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
              <span className="text-xs font-semibold">Safe / Mitigated</span>
            </div>
          </>
        ) : (
          <>
            <div className="glass-panel px-3 py-1 flex items-center gap-2 pointer-events-auto">
              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
              <span className="text-xs font-semibold">Residential</span>
            </div>
            <div className="glass-panel px-3 py-1 flex items-center gap-2 pointer-events-auto">
              <div className="w-2 h-2 rounded-full bg-purple-500"></div>
              <span className="text-xs font-semibold">Commercial</span>
            </div>
            <div className="glass-panel px-3 py-1 flex items-center gap-2 pointer-events-auto">
              <div className="w-2 h-2 rounded-full bg-orange-400"></div>
              <span className="text-xs font-semibold">Mixed Use</span>
            </div>
            <div className="glass-panel px-3 py-1 flex items-center gap-2 pointer-events-auto">
              <div className="w-2 h-2 rounded-full bg-slate-500"></div>
              <span className="text-xs font-semibold">Other</span>
            </div>
          </>
        )}
      </div>

      {/* 3. Sidebar Dashboard (Overlay) */}
      <div className="absolute top-0 left-0 h-full z-[1000] pointer-events-none">
        {/* Dashboard internal component handles pointer-events-auto for its content */}
        <Dashboard
          buildings={buildings}
          filteredBuildings={filteredBuildings}
          scenario={scenario}
          setScenario={setScenario}
          depthReduction={depthReduction}
          setDepthReduction={setDepthReduction}
          showExtents={showExtents}
          setShowExtents={setShowExtents}
          showSimdLayer={showSimdLayer}
          setShowSimdLayer={setShowSimdLayer}
          selectedQuintiles={selectedQuintiles}
          setSelectedQuintiles={setSelectedQuintiles}
          selectedUsages={selectedUsages}
          setSelectedUsages={setSelectedUsages}
          colorMode={colorMode}
          setColorMode={setColorMode}
          simdColorMode={simdColorMode}
          setSimdColorMode={setSimdColorMode}
          setUserLocation={setUserLocation}
        />
      </div>

    </div>
  );
}

export default App;
