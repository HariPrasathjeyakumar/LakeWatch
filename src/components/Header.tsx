import React from 'react';
import {
  Waves,
  MapPin,
  BarChart3,
  BookOpen,
  AlertTriangle,
  Shield,
  Droplets,
  Scale,
  Sparkles,
} from 'lucide-react';
import { MetaData, SitesGeoJSON } from '../types';

interface HeaderProps {
  activeTab: 'map' | 'ranked' | 'methods';
  setActiveTab: (tab: 'map' | 'ranked' | 'methods') => void;
  meta: MetaData | null;
  sites: SitesGeoJSON | null;
  selectedSiteId: string;
  onSelectSite: (id: string) => void;
  onOpenCitizenModal: () => void;
  onOpenFloodModal: () => void;
  onOpenLegalModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  meta,
  sites,
  selectedSiteId,
  onSelectSite,
  onOpenCitizenModal,
  onOpenFloodModal,
  onOpenLegalModal,
}) => {
  const isMock = meta?.mock === true;

  return (
    <header className="border-b border-[#3b1d32] bg-[#120e14]/95 backdrop-blur-md sticky top-0 z-30 shadow-xl text-[#f7e8db]">
      {/* Mock Data Banner - only visible when meta.json has mock: true */}
      {isMock && (
        <div className="bg-[#eed3ba] text-[#120e14] px-4 py-2 text-center text-xs font-bold tracking-wider uppercase flex items-center justify-center gap-2">
          <AlertTriangle className="w-4 h-4 text-[#120e14] shrink-0" />
          <span>MOCK DATA - not real findings</span>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between py-3 gap-3">
          {/* Logo, branding, and subtitle */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#120e14] via-[#4b263f] to-[#eed3ba] flex items-center justify-center text-[#eed3ba] shadow-lg shadow-[#4b263f]/50 border border-[#eed3ba]/40">
              <Waves className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-display font-extrabold tracking-tight text-white flex items-center gap-1.5">
                  Lake<span className="text-[#eed3ba]">Watch</span>
                </h1>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-[#4b263f]/60 text-[#eed3ba] font-mono font-semibold border border-[#eed3ba]/30">
                  Chennai Earth Observatory
                </span>
              </div>
              <p className="text-[11px] text-[#d6b8cc] font-sans">
                Satellite Encroachment Telemetry &bull; Sentinel-2 MSI (10m)
              </p>
            </div>
          </div>

          {/* Quick Tools & Navigation */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Site Picker */}
            {sites && sites.features.length > 0 && (
              <div className="flex items-center gap-1.5 text-xs bg-[#1a121c] rounded-xl px-3 py-1.5 border border-[#3b1d32]">
                <MapPin className="w-3.5 h-3.5 text-[#eed3ba] shrink-0" />
                <span className="text-[#d6b8cc] font-medium">Focus:</span>
                <select
                  aria-label="Select lake or wetland"
                  value={selectedSiteId}
                  onChange={(e) => onSelectSite(e.target.value)}
                  className="bg-transparent font-bold text-white focus:outline-hidden cursor-pointer"
                >
                  {sites.features.map((f) => (
                    <option key={f.properties.id} value={f.properties.id} className="bg-[#1a121c] text-white">
                      {f.properties.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Innovative Action Buttons */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={onOpenCitizenModal}
                className="bg-[#1e131f] hover:bg-[#2d1b2f] text-rose-300 border border-rose-500/30 text-xs font-semibold px-2.5 py-1.5 rounded-xl flex items-center gap-1.5 transition-all shadow-xs"
                title="Citizen incident reporting & ground watchdog hub"
              >
                <Shield className="w-3.5 h-3.5 text-rose-400" />
                <span className="hidden sm:inline">Citizen Watch</span>
              </button>

              <button
                type="button"
                onClick={onOpenFloodModal}
                className="bg-[#1e131f] hover:bg-[#2d1b2f] text-[#eed3ba] border border-[#4b263f] text-xs font-semibold px-2.5 py-1.5 rounded-xl flex items-center gap-1.5 transition-all shadow-xs"
                title="Hydrological flood storage loss calculator"
              >
                <Droplets className="w-3.5 h-3.5 text-[#eed3ba]" />
                <span className="hidden sm:inline">Flood Risk</span>
              </button>

              <button
                type="button"
                onClick={onOpenLegalModal}
                className="bg-[#1e131f] hover:bg-[#2d1b2f] text-[#f7e8db] border border-[#eed3ba]/30 text-xs font-semibold px-2.5 py-1.5 rounded-xl flex items-center gap-1.5 transition-all shadow-xs"
                title="Draft official WRD statutory eviction notice"
              >
                <Scale className="w-3.5 h-3.5 text-[#eed3ba]" />
                <span className="hidden sm:inline">WRD Notice</span>
              </button>
            </div>

            {/* Navigation Tabs */}
            <nav className="flex items-center rounded-xl bg-[#1a121c] p-1 border border-[#3b1d32] text-xs font-medium">
              <button
                type="button"
                onClick={() => setActiveTab('map')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                  activeTab === 'map'
                    ? 'bg-gradient-to-r from-[#4b263f] to-[#73355f] text-[#eed3ba] shadow-md shadow-[#4b263f]/50 font-bold border border-[#eed3ba]/30'
                    : 'text-[#d6b8cc] hover:text-white'
                }`}
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>Map</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('ranked')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                  activeTab === 'ranked'
                    ? 'bg-gradient-to-r from-[#4b263f] to-[#73355f] text-[#eed3ba] shadow-md shadow-[#4b263f]/50 font-bold border border-[#eed3ba]/30'
                    : 'text-[#d6b8cc] hover:text-white'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>Ranked Tiers</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('methods')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                  activeTab === 'methods'
                    ? 'bg-gradient-to-r from-[#4b263f] to-[#73355f] text-[#eed3ba] shadow-md shadow-[#4b263f]/50 font-bold border border-[#eed3ba]/30'
                    : 'text-[#d6b8cc] hover:text-white'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Methods &amp; Accuracy</span>
              </button>
            </nav>
          </div>
        </div>
      </div>
    </header>
  );
};
