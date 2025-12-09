import React, { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Menu, ChevronLeft, Droplets, Filter, Home, Layers, ShieldCheck, PoundSterling, Search, Crosshair, CircleHelp, BookOpen, Info, Trash2, AlertTriangle } from 'lucide-react';
import { runTour } from './TourGuide';
import Documentation from './Documentation';
import Limitations from './Limitations';

const InfoTooltip = ({ text }) => {
    return (
        <div className="group relative inline-block ml-2 align-middle z-50">
            <Info size={14} className="text-slate-500 hover:text-blue-400 cursor-help" />
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-slate-950 border border-slate-700 rounded shadow-xl text-[10px] text-slate-300 font-sans font-normal normal-case tracking-normal pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-[1002]">
                {text}
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-950"></div>
            </div>
        </div>
    );
};

const Dashboard = ({
    buildings,
    filteredBuildings,
    scenario, setScenario,
    depthReduction, setDepthReduction,
    showExtents, setShowExtents,
    showSimdLayer, setShowSimdLayer,
    simdColorMode, setSimdColorMode, // New Props
    selectedQuintiles, setSelectedQuintiles,
    selectedUsages, setSelectedUsages,
    colorMode, setColorMode,
    setUserLocation, // Added this!

    // Lasso Props
    filterPolygon,
    setFilterPolygon
}) => {
    // State for Sidebar Collapse
    const [isOpen, setIsOpen] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);

    const [isDocsOpen, setIsDocsOpen] = useState(false); // Documentation Modal State
    const [isLimitationsOpen, setIsLimitationsOpen] = useState(false); // Limitations Modal State

    // Debounced Search Effect
    React.useEffect(() => {
        const timer = setTimeout(async () => {
            if (searchQuery.length > 2 && searchQuery !== "My Location") {
                try {
                    const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery + ", Edinburgh, UK")}&format=json&limit=5`);
                    if (res.ok) {
                        const data = await res.json();
                        setSearchResults(data);
                    }
                } catch (e) {
                    console.error("Search error:", e);
                }
            } else {
                setSearchResults([]);
            }
        }, 500); // 500ms debounce

        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Calculate Stats (Existing Logic)
    const { currentStats, quintileStats, commStats, descStats } = useMemo(() => {
        let totalDamage = 0;
        let totalBuildings = 0;
        let totalResUnits = 0; // New Metric
        let originalDamage = 0;
        let commUnitsRisk = 0;
        let commBuildingsRisk = 0;

        const qStats = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        const typeStats = {}; // Aggregator

        if (!filteredBuildings || filteredBuildings.length === 0) return { currentStats: { damage: 0, buildings: 0, units: 0, saved: 0 }, quintileStats: [], commStats: { units: 0, count: 0 }, descStats: [] };

        const sceneKey = scenario.toLowerCase();
        const gridKey = `gridcode_${sceneKey}`;

        filteredBuildings.forEach(b => {
            const originalGrid = b.properties[gridKey];
            let origDmg = 0;
            if (originalGrid === 1) origDmg = b.properties.property_value * 0.25 * b.properties.residential_units;
            if (originalGrid === 2) origDmg = b.properties.property_value * 0.40 * b.properties.residential_units;
            if (originalGrid === 3) origDmg = b.properties.property_value * 0.75 * b.properties.residential_units;
            originalDamage += origDmg;

            let newGrid = Math.max(0, originalGrid - depthReduction);
            let newDmg = 0;
            if (newGrid === 1) newDmg = b.properties.property_value * 0.25 * b.properties.residential_units;
            if (newGrid === 2) newDmg = b.properties.property_value * 0.40 * b.properties.residential_units;
            if (newGrid === 3) newDmg = b.properties.property_value * 0.75 * b.properties.residential_units;

            if (newGrid > 0) {
                totalBuildings++;
                const units = (b.properties.residential_units || 0);
                totalResUnits += units;

                // Track Commercial Impact
                if (b.properties.use_class === 'Commercial' || b.properties.use_class === 'Mixed') {
                    commBuildingsRisk++;
                    commUnitsRisk += (b.properties.buildinguse_addresscount_commercial || 0);
                }

                // Aggregate by Description (Type)
                const desc = b.properties.description || "Other";
                if (!typeStats[desc]) typeStats[desc] = { name: desc, units: 0, damage: 0 };
                typeStats[desc].units += units;
                typeStats[desc].damage += newDmg;
            }
            totalDamage += newDmg;

            const q = b.properties.quintile || 0;
            if (q >= 1 && q <= 5) {
                qStats[q] += newDmg;
            }
        });

        const qChartData = Object.keys(qStats).map(k => ({
            name: `Q${k}`,
            value: qStats[k] / 1000000,
            fill: k === '1' ? '#dc2626' : '#3b82f6' // Highlight Q1 (Poorest)
        }));

        // Process Propery Types (Top 5 by Units)
        const sortedTypes = Object.values(typeStats).sort((a, b) => b.units - a.units);
        const top5 = sortedTypes.slice(0, 5);
        if (sortedTypes.length > 5) {
            const other = sortedTypes.slice(5).reduce((acc, curr) => ({
                name: 'Other',
                units: acc.units + curr.units,
                damage: acc.damage + curr.damage
            }), { name: 'Other', units: 0, damage: 0 });
            top5.push(other);
        }

        return {
            currentStats: { damage: totalDamage, buildings: totalBuildings, units: totalResUnits, saved: originalDamage - totalDamage },
            quintileStats: qChartData,
            commStats: { units: commUnitsRisk, count: commBuildingsRisk },
            descStats: top5
        };
    }, [filteredBuildings, scenario, depthReduction]);

    // Handle Quintile Toggle
    const toggleQuintile = (q) => {
        if (selectedQuintiles.includes(q)) {
            if (selectedQuintiles.length > 1) setSelectedQuintiles(selectedQuintiles.filter(item => item !== q));
        } else {
            setSelectedQuintiles([...selectedQuintiles, q].sort());
        }
    };

    // Handle Usage Toggle
    const toggleUsage = (u) => {
        if (selectedUsages.includes(u)) {
            if (selectedUsages.length > 1) setSelectedUsages(selectedUsages.filter(item => item !== u));
        } else {
            setSelectedUsages([...selectedUsages, u]);
        }
    };

    const chartData = [
        { name: 'Damage', value: currentStats.damage / 1000000, fill: '#ef4444' },
        { name: 'Saved', value: currentStats.saved / 1000000, fill: '#10b981' },
    ];

    return (
        <div className={`h-full flex transition-all duration-300 ease-in-out pointer-events-auto ${isOpen ? 'w-full md:w-96' : 'w-0'}`}>

            {/* Sidebar Content */}
            <div id="dashboard-sidebar" className={`flex flex-col h-full bg-slate-900/95 backdrop-blur-md border-r border-slate-700 w-full p-6 overflow-y-auto z-10 shadow-2xl transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>

                {/* Header / Title */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
                            Edinburgh Flood Impact
                        </h1>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 uppercase tracking-wider">
                                Beta v1.0
                            </span>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setIsLimitationsOpen(true)}
                            className="p-2 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 transition-colors border border-amber-500/30"
                            title="Model Limitations"
                        >
                            <AlertTriangle size={18} />
                        </button>
                        <button
                            onClick={() => setIsDocsOpen(true)}
                            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors border border-slate-700"
                            title="Documentation"
                        >
                            <BookOpen size={18} />
                        </button>
                    </div>
                </div>             {/* Help / Tour Button */}
                <button
                    onClick={() => runTour()}
                    className="text-slate-400 hover:text-blue-400 transition-colors p-1"
                    title="Start Tour"
                >
                    <CircleHelp size={20} />
                </button>

                {/* Mobile Close Button (Visible mainly on small screens inside content) */}
                <button
                    onClick={() => setIsOpen(false)}
                    className="md:hidden text-slate-400 hover:text-white"
                >
                    <ChevronLeft size={24} />
                </button>

                {/* Location Search (Autocomplete) & GPS */}
                <div id="search-container" className="mb-6 z-50 relative"> {/* z-50 for dropdown */}
                    <div className="relative mb-2">
                        <Search className="absolute left-3 top-2.5 text-slate-500" size={16} />
                        <input
                            type="text"
                            placeholder="Search address (e.g. 1 Princes St)"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-slate-800/50 border border-slate-600 rounded-lg py-2 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-blue-500 placeholder:text-slate-500"
                        />
                        {/* Autocomplete Dropdown */}
                        {searchResults.length > 0 && (
                            <ul className="absolute top-full left-0 w-full bg-slate-800 border border-slate-700 rounded-lg mt-1 shadow-xl max-h-60 overflow-y-auto z-[1001]">
                                {searchResults.map((result) => (
                                    <li
                                        key={result.place_id}
                                        onMouseDown={() => { // Use onMouseDown to trigger before blur
                                            if (typeof setUserLocation === 'function') {
                                                setUserLocation({ lat: parseFloat(result.lat), lng: parseFloat(result.lon) });
                                                setSearchResults([]); // Close dropdown
                                                setSearchQuery(result.display_name.split(',')[0]); // Set clear name
                                            } else {
                                                console.error("setUserLocation is not a function");
                                            }
                                        }}
                                        className="px-3 py-2 text-xs text-slate-300 hover:bg-slate-700 cursor-pointer border-b border-slate-700 last:border-0"
                                    >
                                        <div className="flex flex-col">
                                            <strong className="text-white">{result.display_name.split(',')[0]}</strong>
                                            <span className="opacity-70 truncate">{result.display_name.split(',').slice(1).join(',')}</span>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                    <button
                        onClick={() => {
                            if (navigator.geolocation) {
                                navigator.geolocation.getCurrentPosition(
                                    (pos) => {
                                        if (typeof setUserLocation === 'function') {
                                            setUserLocation({
                                                lat: pos.coords.latitude,
                                                lng: pos.coords.longitude
                                            });
                                            setSearchQuery("My Location");
                                        }
                                    },
                                    (err) => {
                                        console.error(err);
                                        alert("Could not get location. Check browser permissions.");
                                    },
                                    { enableHighAccuracy: true }
                                );
                            } else {
                                alert("Geolocation is not supported by this browser.");
                            }
                        }}
                        className="w-full glass-button flex items-center justify-center gap-2 py-2 text-sm text-blue-300 border-blue-500/30 hover:bg-blue-500/10"
                    >
                        <Crosshair size={16} /> Use My Current Location
                    </button>
                </div>
                {/* Polygon Filter Alert */}
                {
                    filterPolygon && (
                        <div className="mb-6 p-3 bg-purple-900/30 border border-purple-500 rounded-lg flex items-center justify-between animate-fade-in">
                            <div className="flex items-center gap-2">
                                <span className="text-purple-300 text-xs font-bold uppercase tracking-wide">Area Filter Active</span>
                            </div>
                            <button
                                onClick={() => setFilterPolygon(null)}
                                className="text-xs bg-purple-600 hover:bg-purple-500 text-white px-2 py-1 rounded flex items-center gap-1 transition-colors"
                            >
                                <Trash2 size={12} /> Clear
                            </button>
                        </div>
                    )
                }

                {/* Scenario Selector */}
                <div id="scenario-selector" className="mb-6 p-4 glass-panel">
                    <h3 className="text-slate-500 text-xs uppercase font-bold tracking-widest mb-3 flex items-center gap-2">
                        <Droplets size={12} /> Return Period (Risk)
                        <InfoTooltip text="Probability of a flood event occurring in any given year. High = 10% chance, Low = 0.5% chance." />
                    </h3>
                    <div className="flex gap-2">
                        {[
                            { label: 'High Prob', sub: '10yr', val: 'H', color: 'bg-red-500' },
                            { label: 'Med Prob', sub: '200yr', val: 'M', color: 'bg-orange-500' },
                            { label: 'Low Prob', sub: '1000yr', val: 'L', color: 'bg-yellow-500' }
                        ].map(opt => (
                            <button
                                key={opt.val}
                                onClick={() => setScenario(opt.val)}
                                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all border ${scenario === opt.val
                                    ? `${opt.color} text-white border-white/50 shadow-lg scale-105`
                                    : 'bg-slate-800/50 text-slate-400 border-transparent hover:bg-slate-700'
                                    }`}
                            >
                                <div className="text-[10px] opacity-70 mb-0.5">{opt.label}</div>
                                <div className="text-sm">{opt.sub}</div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Layer Controls */}
                <div id="layer-controls" className="mb-6">
                    <h3 className="text-slate-500 text-xs uppercase font-bold tracking-widest mb-3 flex items-center gap-2">
                        <Layers size={12} /> Map Layers
                        <InfoTooltip text="Toggle data visualizations. 'Flood Extent' shows the water; 'SIMD' shows neighborhood poverty levels." />
                    </h3>
                    <div className="space-y-2">
                        {/* Extents Toggle */}
                        <div className="glass-panel px-3 py-2 flex items-center justify-between">
                            <span className="text-sm font-medium text-slate-300">Flood Extents</span>
                            <button
                                onClick={() => setShowExtents(!showExtents)}
                                className={`w-10 h-5 rounded-full transition-colors relative ${showExtents ? 'bg-blue-500' : 'bg-slate-700'}`}
                            >
                                <div className={`absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform ${showExtents ? 'translate-x-5' : 'translate-x-0'}`} />
                            </button>
                        </div>

                        {/* SIMD Toggle */}
                        <div className="glass-panel px-3 py-2 flex flex-col gap-2">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-slate-300">SIMD Zones (Deprivation)</span>
                                <button
                                    onClick={() => setShowSimdLayer(!showSimdLayer)}
                                    className={`w-10 h-5 rounded-full transition-colors relative ${showSimdLayer ? 'bg-emerald-500' : 'bg-slate-700'}`}
                                >
                                    <div className={`absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform ${showSimdLayer ? 'translate-x-5' : 'translate-x-0'}`} />
                                </button>
                            </div>

                            {/* SIMD Color Toggle (Conditional) */}
                            {showSimdLayer && (
                                <div className="flex bg-slate-900 rounded p-1 mt-1">
                                    <button
                                        onClick={() => setSimdColorMode('damage')}
                                        className={`flex-1 text-[10px] py-1 rounded transition-colors ${simdColorMode === 'damage' ? 'bg-red-500/20 text-red-300 border border-red-500/50' : 'text-slate-400 hover:text-slate-200'}`}
                                    >
                                        £ Damage
                                    </button>
                                    <button
                                        onClick={() => setSimdColorMode('units')}
                                        className={`flex-1 text-[10px] py-1 rounded transition-colors ${simdColorMode === 'units' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/50' : 'text-slate-400 hover:text-slate-200'}`}
                                    >
                                        🏠 Units at Risk
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Color Mode Toggle */}
                        <div id="color-mode-toggle" className="glass-panel px-3 py-2 flex items-center justify-between mt-2">
                            <span className="text-xs text-slate-400 font-bold uppercase flex items-center gap-1">
                                Color By:
                                <InfoTooltip text="Switch building dot colors between 'Risk' (estimated damage cost) and 'Usage' (Residential vs Commercial)." />
                            </span>
                            <div className="flex bg-slate-800 rounded p-1">
                                <button
                                    onClick={() => setColorMode('risk')}
                                    className={`px-3 py-1 text-xs rounded transition-colors ${colorMode === 'risk' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
                                >
                                    Risk
                                </button>
                                <button
                                    onClick={() => setColorMode('usage')}
                                    className={`px-3 py-1 text-xs rounded transition-colors ${colorMode === 'usage' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'}`}
                                >
                                    Usage
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Analysis Filters */}
                <div className="mb-6">
                    <h3 className="text-slate-500 text-xs uppercase font-bold tracking-widest mb-3 flex items-center gap-2">
                        <Filter size={12} /> Filter by Deprivation (SIMD)
                        <InfoTooltip text="Filter the map to show only buildings in specific poverty quintiles. Q1 = Most Deprived (Poor), Q5 = Least Deprived (Rich)." />
                    </h3>
                    <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((q) => {
                            const isActive = selectedQuintiles.includes(q);
                            const colors = ['#ef4444', '#f97316', '#eab308', '#84cc16', '#10b981'];
                            const baseColor = colors[q - 1];

                            return (
                                <button
                                    key={q}
                                    onClick={() => toggleQuintile(q)}
                                    style={{
                                        backgroundColor: isActive ? `${baseColor}33` : 'transparent',
                                        borderColor: isActive ? baseColor : '#334155',
                                        color: isActive ? baseColor : '#64748b'
                                    }}
                                    className={`flex-1 h-9 rounded text-xs font-bold border transition-all flex items-center justify-center`}
                                    title={`Quintile ${q}`}
                                >
                                    {isActive ? `Q${q}` : q}
                                </button>
                            );
                        })}
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-500 mt-1 px-1">
                        <span>Most Deprived</span>
                        <span>Least Deprived</span>
                    </div>
                </div>

                {/* Usage Filters */}
                <div className="mb-8">
                    <h3 className="text-slate-500 text-xs uppercase font-bold tracking-widest mb-3 flex items-center gap-2">
                        <Home size={12} /> Filter by Building Use
                        <InfoTooltip text="Isolate Residential homes, Commercial businesses, or Mixed-use properties." />
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                        {['Residential', 'Commercial', 'Mixed', 'Other'].map((u) => {
                            const isActive = selectedUsages.includes(u);
                            // Colors corresponding to Map Logic (to be added)
                            let baseColor = '#94a3b8';
                            if (u === 'Residential') baseColor = '#3b82f6';
                            if (u === 'Commercial') baseColor = '#a855f7';
                            if (u === 'Mixed') baseColor = '#fb923c';

                            return (
                                <button
                                    key={u}
                                    onClick={() => toggleUsage(u)}
                                    style={{
                                        borderColor: isActive ? baseColor : '#334155',
                                        backgroundColor: isActive ? `${baseColor}22` : 'transparent',
                                        color: isActive ? baseColor : '#64748b'
                                    }}
                                    className={`h-8 rounded text-xs font-bold border transition-all flex items-center justify-center`}
                                >
                                    {u}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Mitigation Simulator */}
                <div id="mitigation-simulator" className="mb-8 p-4 glass-panel border-l-4 border-l-emerald-500">
                    <h3 className="text-slate-500 text-xs uppercase font-bold tracking-widest mb-3 flex items-center gap-2">
                        <ShieldCheck size={12} /> Mitigation Simulator
                        <InfoTooltip text="Simulates the effect of building flood defenses (e.g. greenspaces) that lower water levels by 50cm (-1) or 100cm (-2). ROI shows money saved." />
                    </h3>
                    <input
                        type="range"
                        min="0"
                        max="2"
                        step="1"
                        value={depthReduction}
                        onChange={(e) => setDepthReduction(parseInt(e.target.value))}
                        className="w-full accent-emerald-500 cursor-pointer mb-2"
                    />
                    <div className="flex justify-between text-xs text-slate-500 font-mono">
                        <span>None</span>
                        <span>-1 Level</span>
                        <span>-2 Levels</span>
                    </div>
                    {depthReduction > 0 && (
                        <div className="mt-4 pt-3 border-t border-slate-700 animate-pulse">
                            <span className="text-xs text-emerald-400">Projected Savings:</span>
                            <div className="text-xl font-bold text-emerald-400">
                                £{(currentStats.saved / 1000000).toFixed(1)}M
                            </div>
                        </div>
                    )}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="glass-panel p-4 flex flex-col items-center relative">
                        <div className="absolute top-2 right-2"><InfoTooltip text="Total estimated financial damage for the selected scenario." /></div>
                        <PoundSterling className="text-red-400 mb-2" size={20} />
                        <span className="text-xs text-slate-400">Est. Damage</span>
                        <span className="text-lg font-bold text-white">£{(currentStats.damage / 1000000).toFixed(1)}M</span>
                    </div>
                    <div className="glass-panel p-4 flex items-center justify-between relative">
                        <div className="absolute top-2 right-1"><InfoTooltip text="Count of properties currently flooded." /></div>
                        <div>
                            <span className="text-xs text-blue-300 font-semibold uppercase tracking-wide">Buildings</span>
                            <div className="text-lg font-bold text-white">{currentStats.buildings.toLocaleString()}</div>
                        </div>
                        <div className="text-right">
                            <Home className="text-blue-400 mb-1 ml-auto" size={16} />
                            <div className="text-xs text-slate-400">Res. Units</div>
                            <div className="text-sm font-mono text-blue-200">{Math.round(currentStats.units).toLocaleString()}</div>
                        </div>
                    </div>
                </div>

                {/* Commercial Stats Card */}
                <div className="glass-panel p-4 flex items-center justify-between mb-8 border-l-4 border-l-purple-500 relative">
                    <div className="absolute top-2 right-2"><InfoTooltip text="Commercial businesses at risk." /></div>
                    <div>
                        <span className="text-xs text-purple-300 font-semibold uppercase tracking-wide">Bis. at Risk</span>
                        <div className="text-xl font-bold text-white">{commStats.count}</div>
                    </div>
                    <div className="text-right">
                        <span className="text-xs text-slate-400">Comm. Units</span>
                        <div className="text-lg font-mono text-purple-200">{Math.round(commStats.units)}</div>
                    </div>
                </div>

                <div className="space-y-4 pb-12">
                    {/* Charts */}
                    {/* Charts */}
                    <div className="flex-1 glass-panel p-4 min-h-[180px]">
                        <h3 className="text-slate-500 text-xs uppercase font-bold tracking-widest mb-4 flex items-center gap-2">
                            Financial Impact (Millions £)
                            <InfoTooltip text="Total damage cost breakdown by selected building filters." />
                        </h3>
                        <ResponsiveContainer width="100%" height={120}>
                            <BarChart data={chartData} layout="vertical">
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" width={50} tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
                                <Tooltip
                                    cursor={{ fill: 'transparent' }}
                                    contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                                    formatter={(value) => [`£${value.toFixed(2)}M`, 'Amount']}
                                />
                                <Bar dataKey="value" barSize={20} radius={[0, 4, 4, 0]}>
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="flex-1 glass-panel p-4 min-h-[180px]">
                        <h3 className="text-slate-500 text-xs uppercase font-bold tracking-widest mb-4 flex items-center gap-2">
                            Damage by SIMD (Millions £)
                            <InfoTooltip text="Distribution of flood damage across deprivation quintiles. Q1 = Poorest, Q5 = Richest." />
                        </h3>
                        <ResponsiveContainer width="100%" height={120}>
                            <BarChart data={quintileStats}>
                                <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 9 }} axisLine={false} tickLine={false} interval={0} />
                                <Tooltip
                                    cursor={{ fill: 'transparent' }}
                                    contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                                    formatter={(value) => [`£${value.toFixed(2)}M`, 'Damage']}
                                />
                                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                    {quintileStats.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="flex-1 glass-panel p-4 min-h-[180px]">
                        <h3 className="text-slate-500 text-xs uppercase font-bold tracking-widest mb-4 flex items-center gap-2">
                            Units at Risk by Type
                            <InfoTooltip text="Breakdown of affected residential units by building description (Top 5)." />
                        </h3>
                        <ResponsiveContainer width="100%" height={150}>
                            <BarChart data={descStats} layout="vertical">
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" width={90} tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
                                <Tooltip
                                    cursor={{ fill: 'transparent' }}
                                    contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                                    formatter={(value, name) => [value.toLocaleString(), name === 'units' ? 'Units' : '£' + (value / 1000000).toFixed(1) + 'M']}
                                />
                                <Bar dataKey="units" barSize={15} radius={[0, 4, 4, 0]} fill="#3b82f6" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div >

            {/* Toggle Button Container (Hanging outside the drawer) */}
            < div className="absolute top-4 left-full ml-4 z-50" >
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className={`glass-button w-10 h-10 flex items-center justify-center rounded-full shadow-lg ${isOpen ? 'hidden md:flex' : 'flex'}`}
                    title={isOpen ? "Minimize Dashboard" : "Open Dashboard"}
                >
                    {isOpen ? <ChevronLeft size={20} /> : <Menu size={20} />}
                </button>
            </div >

            {/* Documentation Modal */}
            < Documentation isOpen={isDocsOpen} onClose={() => setIsDocsOpen(false)} />
            < Limitations isOpen={isLimitationsOpen} onClose={() => setIsLimitationsOpen(false)} />
        </div >
    );
};

export default Dashboard;
