import React, { useState } from 'react';
import {
  X,
  Droplets,
  Info,
  ShieldAlert,
} from 'lucide-react';
import { ScoreRow, SitesGeoJSON } from '../types';
import { computeSiteChangeAreas } from '../services/dataService';
import { ChangesGeoJSON } from '../types';

interface FloodCapacityModalProps {
  isOpen: boolean;
  onClose: () => void;
  sites: SitesGeoJSON;
  scores: ScoreRow[];
  changes: ChangesGeoJSON;
  selectedSiteId: string;
}

export const FloodCapacityModal: React.FC<FloodCapacityModalProps> = ({
  isOpen,
  onClose,
  sites,
  scores,
  changes,
  selectedSiteId,
}) => {
  const [activeSiteId, setActiveSiteId] = useState<string>(selectedSiteId || 'pallikaranai');
  const [assumedDepthMeters, setAssumedDepthMeters] = useState<number>(2.0);
  const [rainfallMm, setRainfallMm] = useState<number>(150);

  if (!isOpen) return null;

  const site = sites.features.find((f) => f.properties.id === activeSiteId) || sites.features[0];
  const score = scores.find((s) => s.site_id === activeSiteId);

  const changeAreas = computeSiteChangeAreas(changes, activeSiteId, '2017-2025');
  const lostAreaHa = changeAreas.encroachment_ha || 0.1;

  const lostVolumeCubicMeters = lostAreaHa * 10000 * assumedDepthMeters;
  const lostMillionLitres = (lostVolumeCubicMeters * 1000) / 1000000;
  const lostMcft = lostVolumeCubicMeters / 28316.85;

  const displacedFloodFootprintHa = (lostVolumeCubicMeters / 0.4) / 10000;

  const vulnerableNeighborhoods: Record<string, string[]> = {
    porur: ['Ramapuram Colony', 'Mugalivakkam', 'DLF IT Park perimeter', 'Manapakkam lowlands'],
    chembarambakkam: ['Adyar River headwaters', 'Kundrathur floodplains', 'Thirumudivakkam industrial estate'],
    ambattur: ['Ambattur OT', 'Menambedu', 'Padi Canal junction', 'Korattur overflow basin'],
    puzhal: ['Red Hills lowlands', 'Surapet', 'Puzhal-Kosathalaiyar feeder basin', 'Madhavaram'],
    pallikaranai: ['Velachery (South)', 'Madipakkam Lake feeder', 'Perungudi IT Corridor', 'Kovilambakkam wetland link'],
  };

  const localVictimAreas = vulnerableNeighborhoods[activeSiteId] || ['Surrounding residential sectors'];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="flood-capacity-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md font-sans"
    >
      <div className="bg-[#18111a] border border-[#4b263f] rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-[#f7e8db]">
        {/* Header */}
        <div className="px-6 py-4 bg-[#120e14] border-b border-[#3b1d32] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#4b263f] text-[#eed3ba] border border-[#eed3ba]/30 flex items-center justify-center shadow-md shadow-[#4b263f]/50">
              <Droplets className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 id="flood-capacity-modal-title" className="text-lg font-display font-bold text-white tracking-tight">
                  Flood Buffering &amp; Storage Loss Simulator
                </h3>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-[#4b263f]/60 text-[#eed3ba] border border-[#eed3ba]/30 font-mono">
                  Civil Engineering Model
                </span>
              </div>
              <p className="text-xs text-[#d6b8cc]">
                Calculates lost stormwater retention volume and downstream urban street flood risk
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#d6b8cc] hover:text-white hover:bg-[#251527] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Lake Selector & Parameter Sliders */}
          <div className="bg-[#120e14] border border-[#3b1d32] rounded-2xl p-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block text-[#eed3ba] mb-1 font-semibold uppercase tracking-wider text-[10px] font-mono">
                  Select Waterbody
                </label>
                <select
                  value={activeSiteId}
                  onChange={(e) => setActiveSiteId(e.target.value)}
                  className="w-full bg-[#18111a] border border-[#4b263f] rounded-lg p-2 text-white font-bold focus:outline-hidden focus:border-[#eed3ba]"
                >
                  {sites.features.map((f) => (
                    <option key={f.properties.id} value={f.properties.id}>
                      {f.properties.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between text-[#d6b8cc] mb-1">
                  <span className="font-semibold uppercase tracking-wider text-[10px] font-mono">Average Depth</span>
                  <span className="font-mono text-[#eed3ba] font-bold">{assumedDepthMeters} m</span>
                </div>
                <input
                  type="range"
                  min="1.0"
                  max="4.0"
                  step="0.5"
                  value={assumedDepthMeters}
                  onChange={(e) => setAssumedDepthMeters(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-[#251727] rounded-lg appearance-none cursor-pointer accent-[#eed3ba] mt-2"
                />
                <div className="flex justify-between text-[10px] text-[#8b6982] mt-1 font-mono">
                  <span>1.0m (Shallow)</span>
                  <span>2.0m (Normal)</span>
                  <span>4.0m (Deep)</span>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-[#d6b8cc] mb-1">
                  <span className="font-semibold uppercase tracking-wider text-[10px] font-mono">Rainfall (24h)</span>
                  <span className="font-mono text-[#eed3ba] font-bold">{rainfallMm} mm</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="350"
                  step="25"
                  value={rainfallMm}
                  onChange={(e) => setRainfallMm(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-[#251727] rounded-lg appearance-none cursor-pointer accent-[#eed3ba] mt-2"
                />
                <div className="flex justify-between text-[10px] text-[#8b6982] mt-1 font-mono">
                  <span>50mm (Normal)</span>
                  <span>150mm (Heavy)</span>
                  <span>350mm (Michaung)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Key Simulation Results */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-[#120e14] border border-rose-500/30 rounded-2xl p-4 shadow-sm">
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-300 block font-mono">
                Lost Storage Volume
              </span>
              <div className="mt-1 text-2xl font-extrabold text-white font-mono">
                {lostMillionLitres.toFixed(1)} <span className="text-xs text-[#d6b8cc] font-normal">Million Litres</span>
              </div>
              <div className="text-[11px] text-[#d6b8cc] mt-1 font-mono">
                &approx; {lostMcft.toFixed(2)} Mcft lost retention
              </div>
            </div>

            <div className="bg-[#120e14] border border-[#4b263f] rounded-2xl p-4 shadow-sm">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#eed3ba] block font-mono">
                Encroached Area
              </span>
              <div className="mt-1 text-2xl font-extrabold text-[#eed3ba] font-mono">
                {lostAreaHa} <span className="text-xs text-[#d6b8cc] font-normal">hectares</span>
              </div>
              <div className="text-[11px] text-[#d6b8cc] mt-1">
                {(lostAreaHa * 2.471).toFixed(1)} acres built upon
              </div>
            </div>

            <div className="bg-[#120e14] border border-[#eed3ba]/30 rounded-2xl p-4 shadow-sm">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#f7e8db] block font-mono">
                Displaced Street Water
              </span>
              <div className="mt-1 text-2xl font-extrabold text-white font-mono">
                {displacedFloodFootprintHa.toFixed(1)} <span className="text-xs text-[#d6b8cc] font-normal">ha equiv</span>
              </div>
              <div className="text-[11px] text-[#d6b8cc] mt-1">
                At 0.4 m road waterlogging depth
              </div>
            </div>
          </div>

          {/* Civil Risk Impact Breakdown */}
          <div className="bg-[#120e14] border border-[#3b1d32] rounded-2xl p-4 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#eed3ba] flex items-center gap-1.5 font-mono">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              Downstream Colony Vulnerability Summary
            </h4>
            <p className="text-xs text-[#f7e8db] leading-relaxed">
              When {lostAreaHa} ha of {site?.properties.name} is permanently converted into built structures or filled ground, the basin loses approximately <strong className="text-[#eed3ba] font-mono">{lostMillionLitres.toFixed(1)} million litres</strong> of peak monsoon surge buffering.
            </p>

            <div className="mt-2 bg-[#18111a] rounded-xl p-3 border border-[#3b1d32]">
              <span className="text-[11px] font-semibold text-[#eed3ba] block mb-1">
                High-Risk Lowland Sectors Subject to Direct Overflow:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {localVictimAreas.map((area, idx) => (
                  <span
                    key={idx}
                    className="text-xs bg-[#241525] text-[#eed3ba] px-2.5 py-1 rounded-md border border-[#4b263f]"
                  >
                    {area}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Engineering Disclaimer */}
          <div className="bg-[#120e14] rounded-xl p-3.5 border border-[#2c1729] text-[11px] text-[#d6b8cc] flex items-start gap-2.5">
            <Info className="w-4 h-4 text-[#eed3ba] shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              Hydrological retention is estimated using uniform slab approximation with GIS pixel area multiplication. For statutory DPR (Detailed Project Reports), hydrodynamic bathymetry surveys by Chennai River Restoration Trust (CRRT) / WRD are required.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
