import { X, BookOpen, FileText, Code, FolderTree, Layers, GitBranch, Terminal, User } from 'lucide-react';
import { useState } from 'react';

export default function Documentation({ isOpen, onClose }) {
    if (!isOpen) return null;

    const [activeSection, setActiveSection] = useState('intro');

    const scrollToSection = (id) => {
        setActiveSection(id);
        const element = document.getElementById(id);
        if (element) {
            // scroll the container, not the window
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    const NavItem = ({ id, icon: Icon, label, indent = false }) => (
        <button
            onClick={() => scrollToSection(id)}
            className={`w-full flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors border-l-2 ${activeSection === id
                ? 'bg-blue-500/10 border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                } ${indent ? 'pl-8' : ''}`}
        >
            <Icon size={16} />
            {label}
        </button>
    );

    return (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-slate-900/95 backdrop-blur-sm font-mono">
            <div className="bg-slate-950 border border-slate-700 w-full max-w-7xl h-[95vh] rounded-lg shadow-2xl flex flex-col relative overflow-hidden">

                {/* Header */}
                <div className="flex-none p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900">
                    <div className="flex items-center gap-3">
                        <BookOpen className="text-blue-500" size={20} />
                        <h2 className="text-lg font-bold text-slate-200">Flood Analytics Engine <span className="text-slate-500 text-sm font-normal">/ Documentation</span></h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-red-500/20 rounded text-slate-500 hover:text-red-400 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="flex flex-1 overflow-hidden">

                    {/* Sidebar (ReadTheDocs style) */}
                    <div className="hidden md:flex w-72 flex-col bg-slate-900 border-r border-slate-800 py-6 overflow-y-auto">
                        <nav className="space-y-0.5">
                            <NavItem id="intro" icon={FileText} label="Introduction" />
                            <NavItem id="methodology" icon={FileText} label="Methodology" />
                            <NavItem id="user-guide" icon={User} label="User Guide" />
                            <NavItem id="quickstart" icon={Terminal} label="Quick Start" />
                            <NavItem id="architecture" icon={Layers} label="Architecture" />
                            <NavItem id="frontend" icon={Code} label="Frontend Stack" indent />
                            <NavItem id="backend" icon={Code} label="Backend API" indent />
                            <NavItem id="pipeline" icon={GitBranch} label="Data Pipeline" />
                            <NavItem id="directory" icon={FolderTree} label="Project Structure" />
                        </nav>
                    </div>

                    {/* Main Content Area */}
                    <div className="flex-1 overflow-y-auto scroll-smooth p-8 lg:p-12 space-y-12 bg-slate-950 text-slate-300 font-sans">

                        {/* Introduction */}
                        <section id="intro" className="scroll-mt-6 border-b border-slate-800 pb-8">
                            <h1 className="text-4xl font-bold text-white mb-4">Introduction</h1>
                            <p className="text-lg text-slate-400 leading-relaxed mb-4">
                                The <strong>Edinburgh Flood Impact Analytics (EFIA)</strong> platform is a specialized geospatial decision support system.
                                Unlike generic flood viewers, EFIA performs deterministic financial modeling by intersecting granular building topology with
                                hydraulic flood models (SEPA) and socio-economic indicators (SIMD).
                            </p>
                            <div className="bg-blue-500/10 border-l-4 border-blue-500 p-4 text-blue-200 text-sm">
                                <strong>Engineering Goal:</strong> Deliver sub-50ms interaction latency for a dataset of >70,000 entities by decoupling the vector processing logic (Python/Pandas) from the rendering layer (Leaflet/Canvas).
                            </div>
                        </section>

                        {/* Methodology */}
                        <section id="methodology" className="scroll-mt-6 border-b border-slate-800 pb-8">
                            <h2 className="text-2xl font-bold text-white mb-4">Methodology & Uncertainty</h2>
                            <p className="mb-4 text-slate-400">
                                This section outlines the scientific approach and known limitations of the model.
                            </p>

                            <h3 className="text-lg font-bold text-white mt-6 mb-2">2.1 Core Algorithm: Depth-Damage Function</h3>
                            <p className="mb-4 text-slate-400">
                                Financial risk is calculated using a <strong>Depth-Damage Curve</strong>, a standard actuarial method that correlates flood depth with repair costs.
                            </p>
                            <div className="bg-slate-900 p-4 rounded border border-slate-800 mb-6 font-mono text-sm text-blue-300">
                                Risk_£ = PropertyValue * Function(Depth, ResidentialUnits)
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm text-slate-400">
                                    <thead className="text-xs uppercase bg-slate-900 text-slate-300">
                                        <tr>
                                            <th className="px-4 py-2">Flood Depth</th>
                                            <th className="px-4 py-2">Damage Factor</th>
                                            <th className="px-4 py-2">Rationale</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800">
                                        <tr>
                                            <td className="px-4 py-2">0.0 - 0.5m</td>
                                            <td className="px-4 py-2 text-red-400">25%</td>
                                            <td className="px-4 py-2">Flooring, plaster, electrical sockets replacement.</td>
                                        </tr>
                                        <tr>
                                            <td className="px-4 py-2">0.5 - 1.0m</td>
                                            <td className="px-4 py-2 text-red-500">40%</td>
                                            <td className="px-4 py-2">Kitchen units, appliances, dry-lining replacement.</td>
                                        </tr>
                                        <tr>
                                            <td className="px-4 py-2">&gt; 1.0m</td>
                                            <td className="px-4 py-2 text-red-600 font-bold">75%</td>
                                            <td className="px-4 py-2">Structural drying, full refit, potential contamination.</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            <h3 className="text-lg font-bold text-white mt-8 mb-2">2.2 Uncertainty Matrix</h3>
                            <p className="mb-4 text-slate-400">
                                All geospatial models contain uncertainty. Users must be aware of the following limitations:
                            </p>
                            <div className="grid gap-4">
                                <div className="border border-slate-800 rounded p-4">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="font-bold text-white">SEPA Flood Data</span>
                                        <span className="text-xs bg-yellow-500/20 text-yellow-300 px-2 py-0.5 rounded">Medium Uncertainty</span>
                                    </div>
                                    <p className="text-sm text-slate-400">The flood extents are based on a 5m resolution raster. Localized terrain features smaller than 5m (e.g., garden walls) are not modeled.</p>
                                </div>
                                <div className="border border-slate-800 rounded p-4">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="font-bold text-white">Building Topology</span>
                                        <span className="text-xs bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded">Low Uncertainty</span>
                                    </div>
                                    <p className="text-sm text-slate-400">Uses OS MasterMap (High fidelity). However, we model buildings as "Centroids" (Points) for performance. Large warehouses may be partially inundated but are treated as a single binary point.</p>
                                </div>
                                <div className="border border-slate-800 rounded p-4">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="font-bold text-white">Valuation Model</span>
                                        <span className="text-xs bg-red-500/20 text-red-300 px-2 py-0.5 rounded">High Uncertainty</span>
                                    </div>
                                    <p className="text-sm text-slate-400">Property values are estimated proxies based on Postcode Sector averages, not individual surveyor valuations.</p>
                                </div>
                            </div>
                        </section>

                        {/* User Guide */}
                        <section id="user-guide" className="scroll-mt-6 border-b border-slate-800 pb-8">
                            <h2 className="text-2xl font-bold text-white mb-4">User Guide</h2>
                            <p className="mb-6 text-slate-400">
                                This section explains how to use the Flood Analytics Dashboard to assess risk.
                            </p>

                            <h3 className="text-lg font-bold text-white mb-4">4.1 Navigation</h3>
                            <ul className="list-disc list-inside text-sm text-slate-400 mb-6 space-y-2">
                                <li><strong>Pan/Zoom</strong>: Use mouse wheel or touch pincers. The map reveals more detail as you zoom in (building footprints appear at zoom level 14+).</li>
                                <li><strong>Search</strong>: Enter any Edinburgh address (e.g., "1 Princes St") in the top-left bar to fly directly to that location.</li>
                                <li><strong>GPS</strong>: Click "Use My Current Location" to assessing flood risk at your precise standing position (Mobile only).</li>
                            </ul>

                            <h3 className="text-lg font-bold text-white mb-4">4.2 Controls & Tools</h3>
                            <div className="grid md:grid-cols-2 gap-8">
                                <div>
                                    <h4 className="text-base font-bold text-white mb-2">Risk Scenarios</h4>
                                    <ul className="text-sm text-slate-400 space-y-2">
                                        <li><span className="text-red-400 font-bold">High (10yr)</span>: Frequent events. Used for operational planning.</li>
                                        <li><span className="text-yellow-400 font-bold">Low (1000yr)</span>: Catastrophic events. Used for stress testing critical infrastructure.</li>
                                    </ul>
                                </div>
                                <div>
                                    <h4 className="text-base font-bold text-white mb-2">Layers</h4>
                                    <ul className="text-sm text-slate-400 space-y-2">
                                        <li><strong>Flood Extent</strong>: Visualizes the raw water polygons.</li>
                                        <li><strong>SIMD Zones</strong>: Overlays socio-economic deprivation data. <span className="text-blue-300">Click a zone</span> to see aggregated neighborhood stats.</li>
                                    </ul>
                                </div>
                            </div>

                            <h3 className="text-lg font-bold text-white mt-6 mb-2">3. Damage Simulation</h3>
                            <div className="bg-slate-900 p-4 rounded border border-slate-800">
                                <p className="text-sm text-slate-300 mb-2">
                                    <strong>Mitigation Slider</strong>: Drag this to simulate "Defense Level".
                                </p>
                                <p className="text-xs text-slate-500">
                                    <em>Example:</em> Setting mitigation to "1 Meter" recalculates the entire city's damage model instantly, showing you the potential ROI of flood defenses.
                                </p>
                            </div>
                        </section>

                        {/* Quick Start */}
                        <section id="quickstart" className="scroll-mt-6 border-b border-slate-800 pb-8">
                            <h2 className="text-2xl font-bold text-white mb-4">Quick Start</h2>
                            <p className="mb-4">Prerequisites: <code>Docker</code>, <code>Python 3.11+</code>, <code>Node 18+</code>.</p>

                            <div className="space-y-4">
                                <div>
                                    <div className="text-sm font-bold text-slate-500 mb-2">1. Clone & Setup</div>
                                    <pre className="bg-slate-900 p-4 rounded border border-slate-800 text-sm text-green-400 overflow-x-auto">
                                        {`git clone https://github.com/monish/flood.git
cd flood
python -m venv .venv && source .venv/bin/activate
pip install -r backend/requirements.txt
cd frontend && npm install`}
                                    </pre>
                                </div>
                                <div>
                                    <div className="text-sm font-bold text-slate-500 mb-2">2. Data Processing (ETL)</div>
                                    <pre className="bg-slate-900 p-4 rounded border border-slate-800 text-sm text-green-400 overflow-x-auto">
                                        {`# Process raw GDB/SHP files into optimized web assets
python scripts/preprocess_data.py
# Output: /web_data/extent_{h,m,l}.geojson, buildings.geojson`}
                                    </pre>
                                </div>
                                <div>
                                    <div className="text-sm font-bold text-slate-500 mb-2">3. Run Local Dev</div>
                                    <pre className="bg-slate-900 p-4 rounded border border-slate-800 text-sm text-green-400 overflow-x-auto">
                                        {`./start_app.sh
# Frontend: http://localhost:5173
# Backend: http://localhost:8000`}
                                    </pre>
                                </div>
                            </div>
                        </section>

                        {/* Directory Structure */}
                        <section id="directory" className="scroll-mt-6 border-b border-slate-800 pb-8">
                            <h2 className="text-2xl font-bold text-white mb-4">Project Structure</h2>
                            <pre className="font-mono text-xs text-slate-400 bg-slate-900 p-6 rounded-lg border border-slate-800 leading-relaxed">
                                {`flood/
├── backend/                 # FastAPI Service
│   └── main.py              # Entry point, serves static files & API
├── frontend/                # React Application
│   ├── src/
│   │   ├── components/      # Map.jsx, Dashboard.jsx, TourGuide.jsx
│   │   └── App.jsx          # Route Layout
│   └── vite.config.js       # Build configuration
├── scripts/                 # Data Engineering (Offline)
│   ├── preprocess_data.py   # Core ETL logic (Spatial Join)
│   └── export_extents.py    # GDB Extraction Utility
├── web_data/                # HOSTED ASSETS (Generated)
│   ├── buildings.geojson    # 70k points (Centroids)
│   ├── extent_*.geojson     # Flood polygons (Simpl: 0.00005)
│   └── stats.json           # Pre-computed aggregates
├── Dockerfile               # Multi-stage build (Node -> Python)
└── fly.toml                 # Deployment Config`}
                            </pre>
                        </section>

                        {/* Pipeline */}
                        <section id="pipeline" className="scroll-mt-6 border-b border-slate-800 pb-8">
                            <h2 className="text-2xl font-bold text-white mb-4">Data Pipeline (ETL)</h2>
                            <p className="mb-4">
                                The <code>scripts/preprocess_data.py</code> script is the heart of the analytical engine. It transforms disjointed government datasets into a coherent, queryable web format.
                            </p>

                            <h3 className="text-lg font-bold text-white mt-6 mb-2">Core Logic: Depth Intersection</h3>
                            <div className="bg-slate-900 p-4 rounded border border-slate-800 mb-4">
                                <code className="text-sm font-mono text-blue-300">
                                    Building_Risk = max(Intersection(Building_i, Flood_Depth_Raster_High/Med/Low))
                                </code>
                            </div>
                            <ul className="list-disc list-outside ml-5 space-y-2 text-slate-400">
                                <li><strong>Input</strong>: OS MasterMap (Polygons), SEPA River (GDB), SEPA Surface (GDB).</li>
                                <li><strong>Spatial Index</strong>: Uses <code>rtree</code> for O(log n) spatial queries.</li>
                                <li><strong>Optimization</strong>: Building polygons converted to <code>Point</code> geometries (Centroids) to reduce payload size by ~60% (critical for mobile web).</li>
                            </ul>
                        </section>

                        {/* Architecture */}
                        <section id="architecture" className="scroll-mt-6 border-b border-slate-800 pb-8">
                            <h2 className="text-2xl font-bold text-white mb-4">System Architecture</h2>
                            <p className="mb-4 text-slate-400">
                                The platform uses a <strong>Hybrid Static-Dynamic Architecture</strong> to balance performance with interactivity.
                            </p>

                            <h3 className="text-lg font-bold text-white mt-6 mb-2">3.1 Tech Stack</h3>
                            <ul className="list-disc list-inside text-slate-400 space-y-2 mb-6">
                                <li><strong>Frontend</strong>: <code>React 19</code>, <code>Vite</code>, <code>TailwindCSS</code> (Performance handling 70k+ rendered points).</li>
                                <li><strong>Mapping Engine</strong>: <code>React-Leaflet</code> with Canvas rendering for high-performance vector display.</li>
                                <li><strong>Backend</strong>: <code>Python 3.11</code>, <code>FastAPI</code> (serving optimized GeoJSON).</li>
                                <li><strong>Data Pipeline</strong>: <code>Geopandas</code>, <code>Rtree</code>, <code>Shapely</code> (Spatial Joins & indexing).</li>
                            </ul>
                        </section>

                        {/* Frontend */}
                        <section id="frontend" className="scroll-mt-6 border-b border-slate-800 pb-8">
                            <h2 className="text-2xl font-bold text-white mb-4">Frontend Architecture</h2>
                            <p className="mb-4">
                                Built with <strong>React 19</strong> (Concurrent Mode) and <strong>Vite</strong>. State is managed locally within the dashboard context to avoid global reducer complexity.
                            </p>

                            <h3 className="text-lg font-bold text-white mt-6 mb-2">Key Components</h3>
                            <div className="space-y-4">
                                <div className="flex gap-4">
                                    <div className="w-32 font-mono text-yellow-400 text-sm">Map.jsx</div>
                                    <div className="flex-1 text-sm text-slate-400">Wraps <code>react-leaflet</code>. Handles layer toggling, caching (clears data on scenario switch), and rendering of 50k+ circles using Canvas renderer.</div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="w-32 font-mono text-yellow-400 text-sm">Dashboard.jsx</div>
                                    <div className="flex-1 text-sm text-slate-400">Control center. Computes "Live Stats" (e.g., Total Damage) by filtering the visible dataset in real-time based on slider inputs.</div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="w-32 font-mono text-yellow-400 text-sm">TourGuide.jsx</div>
                                    <div className="flex-1 text-sm text-slate-400"><code>driver.js</code> integration. Uses <code>localStorage</code> to ensure the tour runs exactly once per device.</div>
                                </div>
                            </div>
                        </section>

                    </div>
                </div>
            </div>
        </div>
    );
}
