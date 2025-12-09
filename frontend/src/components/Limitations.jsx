
import { X, AlertTriangle, Scale, Building, TrendingDown, BookOpen } from 'lucide-react';

export default function Limitations({ isOpen, onClose }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-slate-900/95 backdrop-blur-sm font-sans">
            <div className="bg-slate-950 border border-slate-700 w-full max-w-4xl max-h-[90vh] rounded-lg shadow-2xl flex flex-col relative overflow-hidden">

                {/* Header */}
                <div className="flex-none p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900">
                    <div className="flex items-center gap-3">
                        <AlertTriangle className="text-amber-500" size={24} />
                        <div>
                            <h2 className="text-xl font-bold text-slate-200">Model Limitations & Methodological Challenges</h2>
                            <p className="text-slate-400 text-sm">Why these numbers are strategic estimates.</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-800 rounded-lg text-slate-500 hover:text-white transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-8 space-y-8 text-slate-300">

                    {/* Intro */}
                    <div className="bg-amber-500/10 border-l-4 border-amber-500 p-4 text-amber-200 text-sm leading-relaxed">
                        <strong>Critical Context:</strong> This application leverages <strong>National Strategic Flood Models (SEPA)</strong>.
                        These models are designed for community-level risk assessment, not property-level valuation.
                        Below are the three primary "Blunders" or simplifications in the current V1 model that users must understand.
                    </div>

                    {/* Challenge 1: The Penthouse Problem */}
                    <section className="space-y-4">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-800 text-slate-400 font-mono text-sm">1</span>
                            The "Penthouse Problem" (Verticality)
                        </h3>
                        <div className="ml-10 space-y-2">
                            <p className="text-slate-400">
                                Edinburgh is a city of tenements (3-5 stories). Our current model assumes that if a building footprint is flooded,
                                <strong> every unit inside is equally damaged</strong>.
                            </p>
                            <div className="grid md:grid-cols-2 gap-4 mt-4">
                                <div className="bg-slate-900/50 p-4 rounded border border-slate-800">
                                    <div className="text-xs font-bold text-red-400 uppercase tracking-wide mb-1">Current Model (Naive)</div>
                                    <div className="text-sm">Building with 8 Flats + Flood = <span className="text-white font-bold">8 Damaged Units</span>.</div>
                                    <div className="text-xs text-slate-500 mt-1">Massively overestimates risk in EH1/EH2.</div>
                                </div>
                                <div className="bg-slate-900/50 p-4 rounded border border-slate-800">
                                    <div className="text-xs font-bold text-emerald-400 uppercase tracking-wide mb-1">Reality</div>
                                    <div className="text-sm">Flood hits Ground Floor only. <span className="text-white font-bold">1-2 Damaged Units</span>.</div>
                                    <div className="text-xs text-slate-500 mt-1">Upper floors lose access, but not assets.</div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Challenge 2: Asset Value */}
                    <section className="space-y-4">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-800 text-slate-400 font-mono text-sm">2</span>
                            Market Value vs. Reinstatement Cost
                        </h3>
                        <div className="ml-10 flex gap-4">
                            <Scale className="flex-none text-slate-600 mt-1" />
                            <div className="space-y-2">
                                <p className="text-slate-400">
                                    We rely on "Average Selling Prices" by Postcode. This price includes the <strong>Land Value</strong> (location premium), which is indestructible.
                                    A flood does not destroy the land.
                                </p>
                                <p className="text-sm text-slate-500 bg-slate-900 p-3 rounded">
                                    <strong>Impact:</strong> The "Total Damage" figures effectively assume the entire property value is lost, rather than just the
                                    construction cost (bricks & mortar). A robust model would apply a <strong>0.6x factor</strong> to strip out land value.
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* Challenge 3: Strategic Data */}
                    <section className="space-y-4">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-800 text-slate-400 font-mono text-sm">3</span>
                            Aggressive Damage Curves
                        </h3>
                        <div className="ml-10 flex gap-4">
                            <TrendingDown className="flex-none text-slate-600 mt-1" />
                            <div className="space-y-2">
                                <p className="text-slate-400">
                                    Current logic applies a <strong>75% damage ratio</strong> for high-depth floods (&gt;1m). In reality, modern masonry buildings
                                    rarely suffer &gt;40% total asset loss unless structurally compromised.
                                </p>
                                <p className="text-sm text-slate-500">
                                    This "Apocalypse Curve" is useful for stress-testing worst-case scenarios but is too pessimistic for average insurance modeling.
                                </p>
                            </div>
                        </div>
                    </section>

                    <div className="border-t border-slate-800 pt-6 mt-8">
                        <h4 className="text-sm font-bold text-slate-300 mb-2">Planned Improvements (V2 Roadmap)</h4>
                        <ul className="grid md:grid-cols-2 gap-2 text-xs text-slate-500 font-mono">
                            <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div> Implement "Ground Floor Only" logic for Flats</li>
                            <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div> Integrate Reinstatement Cost data</li>
                            <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div> Calibrate Damage Curves with 2024 UK Data</li>
                        </ul>
                    </div>

                </div>
            </div>
        </div>
    );
}
