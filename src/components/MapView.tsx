import React, { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import {
  CHANGE_TYPE_CONFIG,
  PERIOD_OPTIONS,
  CitizenIncident,
  getTierBadgeStyle,
  getUrgencyTier,
} from '../config/constants';
import {
  ChangeType,
  ChangesGeoJSON,
  PeriodType,
  ScoreRow,
  SitesGeoJSON,
  TimeseriesRow,
} from '../types';
import {
  Sliders,
  Layers,
  Calendar,
  Eye,
  Info,
  Maximize2,
  ExternalLink,
  Play,
  Pause,
  Shield,
  Droplets,
  Scale,
} from 'lucide-react';

interface MapViewProps {
  sites: SitesGeoJSON;
  scores: ScoreRow[];
  changes: ChangesGeoJSON;
  timeseries: TimeseriesRow[];
  selectedSiteId: string;
  onSelectSite: (id: string) => void;
  selectedPeriod: PeriodType;
  onChangePeriod: (p: PeriodType) => void;
  onOpenSitePanel: () => void;
  onOpenCitizenModal?: () => void;
  onOpenFloodModal?: () => void;
  onOpenLegalModal?: () => void;
  incidents?: CitizenIncident[];
}

export const MapView: React.FC<MapViewProps> = ({
  sites,
  scores,
  changes,
  timeseries,
  selectedSiteId,
  onSelectSite,
  selectedPeriod,
  onChangePeriod,
  onOpenSitePanel,
  onOpenCitizenModal,
  onOpenFloodModal,
  onOpenLegalModal,
  incidents = [],
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const sitesLayerRef = useRef<L.GeoJSON | null>(null);
  const changesLayerRef = useRef<L.GeoJSON | null>(null);
  const incidentsLayerRef = useRef<L.LayerGroup | null>(null);
  const baseTileLayerRef = useRef<L.TileLayer | null>(null);

  // Filter states
  const [showEncroachment, setShowEncroachment] = useState(true);
  const [showSeasonal, setShowSeasonal] = useState(true);
  const [showUncertain, setShowUncertain] = useState(true);
  const [showCitizenIncidents, setShowCitizenIncidents] = useState(true);
  const [minConfidence, setMinConfidence] = useState<number>(0.0);

  // Basemap style: 'satellite' | 'dark'
  const [basemapStyle, setBasemapStyle] = useState<'satellite' | 'dark'>('satellite');

  // Interactive Timeline Playback State (2017 to 2025)
  const years = [2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025];
  const [timelineYear, setTimelineYear] = useState<number>(2025);
  const [isPlayingTimeline, setIsPlayingTimeline] = useState<boolean>(false);
  const timelineIntervalRef = useRef<any>(null);

  // Scores indexed by site_id
  const scoresBySiteId = useMemo(() => {
    const map = new Map<string, ScoreRow>();
    scores.forEach((s) => map.set(s.site_id, s));
    return map;
  }, [scores]);

  // Selected site data
  const selectedSite = useMemo(() => {
    return sites.features.find((f) => f.properties.id === selectedSiteId);
  }, [sites, selectedSiteId]);

  const selectedScore = useMemo(() => {
    return scoresBySiteId.get(selectedSiteId);
  }, [scoresBySiteId, selectedSiteId]);

  // Selected site timeseries row for the active timeline year
  const currentTimelineData = useMemo(() => {
    return timeseries.find(
      (t) => t.site_id === selectedSiteId && t.year === timelineYear
    );
  }, [timeseries, selectedSiteId, timelineYear]);

  // Filtered change features
  const filteredChanges = useMemo(() => {
    if (!changes || !changes.features) return [];
    return changes.features.filter((f) => {
      const p = f.properties;
      if (p.period !== selectedPeriod) return false;
      if (p.confidence < minConfidence) return false;
      if (p.change_type === 'encroachment' && !showEncroachment) return false;
      if (p.change_type === 'seasonal' && !showSeasonal) return false;
      if (p.change_type === 'uncertain' && !showUncertain) return false;
      return true;
    });
  }, [
    changes,
    selectedPeriod,
    minConfidence,
    showEncroachment,
    showSeasonal,
    showUncertain,
  ]);

  // Stats for the current view
  const currentViewStats = useMemo(() => {
    let encArea = 0;
    let seaArea = 0;
    let uncArea = 0;
    let encCount = 0;

    filteredChanges.forEach((f) => {
      const p = f.properties;
      const area = Number(p.area_ha) || 0;
      if (p.change_type === 'encroachment') {
        encArea += area;
        encCount++;
      } else if (p.change_type === 'seasonal') {
        seaArea += area;
      } else if (p.change_type === 'uncertain') {
        uncArea += area;
      }
    });

    return {
      encArea: Math.round(encArea * 100) / 100,
      seaArea: Math.round(seaArea * 100) / 100,
      uncArea: Math.round(uncArea * 100) / 100,
      encCount,
      totalCount: filteredChanges.length,
    };
  }, [filteredChanges]);

  // 1. Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [13.03, 80.14],
      zoom: 11,
      zoomControl: false,
    });

    L.control.zoom({ position: 'topright' }).addTo(map);

    const baseLayer = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      {
        attribution: 'Tiles &copy; Esri, Maxar',
        maxZoom: 18,
      }
    ).addTo(map);
    baseTileLayerRef.current = baseLayer;

    L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
      {
        maxZoom: 18,
        opacity: 0.65,
      }
    ).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Basemap tile layer when style toggles
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (baseTileLayerRef.current) {
      map.removeLayer(baseTileLayerRef.current);
    }

    if (basemapStyle === 'dark') {
      baseTileLayerRef.current = L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
        {
          attribution: '&copy; CartoDB',
          maxZoom: 18,
          subdomains: 'abcd',
        }
      ).addTo(map);
    } else {
      baseTileLayerRef.current = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        {
          attribution: 'Tiles &copy; Esri',
          maxZoom: 18,
        }
      ).addTo(map);
    }
  }, [basemapStyle]);

  // 2. Render site boundaries
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !sites || !sites.features) return;

    if (sitesLayerRef.current) {
      map.removeLayer(sitesLayerRef.current);
    }

    const sitesLayer = L.geoJSON(sites as any, {
      style: (feature) => {
        const id = feature?.properties?.id;
        const scoreRow = scoresBySiteId.get(id);
        const score = scoreRow?.urgency_score ?? 0;
        const tier = getUrgencyTier(score);
        const styleConfig = getTierBadgeStyle(tier);
        const isSelected = id === selectedSiteId;

        return {
          color: isSelected ? '#eed3ba' : styleConfig.mapColor,
          weight: isSelected ? 4 : 2.5,
          opacity: 0.95,
          fillColor: isSelected ? '#4b263f' : styleConfig.mapColor,
          fillOpacity: isSelected ? 0.4 : 0.2,
          dashArray: isSelected ? undefined : '5, 5',
        };
      },
      onEachFeature: (feature, layer) => {
        const props = feature.properties;
        const scoreRow = scoresBySiteId.get(props.id);
        const urgency = scoreRow?.urgency_score ?? 0;
        const tier = getUrgencyTier(urgency);
        const tierStyle = getTierBadgeStyle(tier);

        layer.bindTooltip(
          `<div class="text-xs">
            <div class="font-bold text-[#eed3ba] flex items-center gap-1.5 font-display text-sm">
              <span class="w-2.5 h-2.5 rounded-full inline-block" style="background:${tierStyle.mapColor}"></span>
              ${props.name}
            </div>
            <div class="mt-1 text-[#f7e8db]">Tier: <strong style="color:${tierStyle.mapColor}">${tier}</strong> (${urgency}/100)</div>
            <div class="text-[10px] text-[#eed3ba] font-mono mt-0.5">Click to inspect dossier</div>
          </div>`,
          { sticky: true, opacity: 0.98 }
        );

        layer.on('click', () => {
          onSelectSite(props.id);
        });
      },
    }).addTo(map);

    sitesLayerRef.current = sitesLayer;
  }, [sites, scoresBySiteId, selectedSiteId, onSelectSite]);

  // 3. Render change polygons layer
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (changesLayerRef.current) {
      map.removeLayer(changesLayerRef.current);
    }

    const changesGeoJson = {
      type: 'FeatureCollection',
      features: filteredChanges,
    };

    const changesLayer = L.geoJSON(changesGeoJson as any, {
      style: (feature) => {
        const type = (feature?.properties?.change_type as ChangeType) || 'uncertain';
        const color = CHANGE_TYPE_CONFIG[type]?.color || '#8b6982';

        return {
          color: color,
          weight: 1.5,
          opacity: 0.95,
          fillColor: color,
          fillOpacity: type === 'encroachment' ? 0.8 : 0.65,
        };
      },
      onEachFeature: (feature, layer) => {
        const p = feature.properties;
        const confPercent = Math.round((p.confidence || 0) * 100);
        const typeLabel =
          CHANGE_TYPE_CONFIG[p.change_type as ChangeType]?.label || p.change_type;
        const color = CHANGE_TYPE_CONFIG[p.change_type as ChangeType]?.color || '#8b6982';

        layer.bindPopup(
          `<div class="text-xs p-1">
            <div class="font-bold text-[#eed3ba] capitalize flex items-center gap-1.5 pb-1 border-b border-[#4b263f]">
              <span class="inline-block w-2.5 h-2.5 rounded-full" style="background:${color}"></span>
              ${typeLabel} Loss Polygon
            </div>
            <div class="mt-2 space-y-1 text-[#f7e8db] font-mono text-[11px]">
              <div><strong>Period:</strong> <span class="text-[#eed3ba] font-bold">${p.period}</span></div>
              <div><strong>Area:</strong> <span class="text-white font-bold">${p.area_ha} ha</span> (${(p.area_ha * 2.471).toFixed(2)} acres)</div>
              <div><strong>Confidence:</strong> ${confPercent}%</div>
              <div><strong>Waterbody:</strong> <span class="capitalize text-[#eed3ba]">${p.site_id}</span></div>
            </div>
          </div>`,
          { closeButton: false }
        );
      },
    }).addTo(map);

    changesLayerRef.current = changesLayer;
  }, [filteredChanges]);

  // 4. Render citizen incident markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (incidentsLayerRef.current) {
      map.removeLayer(incidentsLayerRef.current);
    }

    if (!showCitizenIncidents || !incidents || incidents.length === 0) return;

    const layerGroup = L.layerGroup();

    incidents.forEach((inc) => {
      const pulseColor = inc.severity === 'Critical' ? '#e11d48' : '#eed3ba';
      const icon = L.divIcon({
        className: 'custom-incident-pin',
        html: `
          <div style="position:relative; width:24px; height:24px; display:flex; align-items:center; justify-content:center;">
            <div style="position:absolute; width:24px; height:24px; border-radius:50%; background:${pulseColor}; opacity:0.4; animation: ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
            <div style="width:13px; height:13px; border-radius:50%; background:${pulseColor}; border:2px solid #ffffff; box-shadow:0 0 10px ${pulseColor};"></div>
          </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      const marker = L.marker([inc.lat, inc.lng], { icon });

      marker.bindPopup(
        `<div class="text-xs p-1 max-w-[220px]">
          <div class="font-bold text-[#eed3ba] flex items-center gap-1.5 pb-1 border-b border-[#4b263f]">
            <span class="w-2 h-2 rounded-full" style="background:${pulseColor}"></span>
            ${inc.incident_type}
          </div>
          <div class="mt-1.5 text-[#f7e8db] text-[11px] leading-snug">
            ${inc.description}
          </div>
          <div class="mt-2 pt-1 border-t border-[#4b263f] flex justify-between items-center text-[10px] text-[#d6b8cc]">
            <span>By: <strong>${inc.reporter_name}</strong></span>
            <span class="text-[#eed3ba] font-bold">${inc.status}</span>
          </div>
        </div>`
      );

      layerGroup.addLayer(marker);
    });

    layerGroup.addTo(map);
    incidentsLayerRef.current = layerGroup;
  }, [incidents, showCitizenIncidents]);

  // Timeline playback loop
  useEffect(() => {
    if (isPlayingTimeline) {
      timelineIntervalRef.current = setInterval(() => {
        setTimelineYear((prev) => {
          const nextIndex = (years.indexOf(prev) + 1) % years.length;
          const nextYear = years[nextIndex];
          if (nextYear <= 2019) onChangePeriod('2017-2019');
          else if (nextYear <= 2021) onChangePeriod('2017-2021');
          else if (nextYear <= 2023) onChangePeriod('2017-2023');
          else onChangePeriod('2017-2025');
          return nextYear;
        });
      }, 1600);
    } else {
      if (timelineIntervalRef.current) {
        clearInterval(timelineIntervalRef.current);
      }
    }

    return () => {
      if (timelineIntervalRef.current) {
        clearInterval(timelineIntervalRef.current);
      }
    };
  }, [isPlayingTimeline, onChangePeriod]);

  // Zoom to selected site
  const handleZoomToSite = (siteId: string) => {
    const map = mapInstanceRef.current;
    if (!map || !sitesLayerRef.current) return;

    sitesLayerRef.current.eachLayer((layer: any) => {
      if (layer.feature?.properties?.id === siteId && layer.getBounds) {
        map.fitBounds(layer.getBounds(), {
          padding: [50, 50],
          maxZoom: 14,
          animate: true,
        });
      }
    });
  };

  // Zoom to entire Chennai coverage
  const handleFitAll = () => {
    const map = mapInstanceRef.current;
    if (!map || !sitesLayerRef.current) return;
    map.fitBounds(sitesLayerRef.current.getBounds(), {
      padding: [40, 40],
      animate: true,
    });
  };

  return (
    <div className="relative w-full h-[calc(100vh-130px)] min-h-[620px] bg-[#120e14] flex flex-col overflow-hidden text-[#f7e8db]">
      {/* Map Container */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Control Overlay Top Left: Period, Basemap, & Filter */}
      <div className="absolute top-4 left-4 z-20 flex flex-col gap-2.5 max-w-xs sm:max-w-sm pointer-events-auto">
        {/* Period & Basemap Card */}
        <div className="bg-[#18111a]/95 backdrop-blur-md p-3.5 rounded-2xl shadow-2xl border border-[#4b263f] text-[#f7e8db]">
          <div className="flex items-center justify-between gap-2 mb-2.5">
            <span className="text-[11px] font-bold text-[#eed3ba] uppercase tracking-wider flex items-center gap-1.5 font-mono">
              <Calendar className="w-3.5 h-3.5 text-[#eed3ba]" />
              Analysis Period
            </span>
            {/* Basemap toggle */}
            <div className="flex items-center gap-1 bg-[#120e14] p-0.5 rounded-lg border border-[#3b1d32] text-[10px]">
              <button
                type="button"
                onClick={() => setBasemapStyle('satellite')}
                className={`px-2 py-0.5 rounded-md font-medium transition-all ${
                  basemapStyle === 'satellite'
                    ? 'bg-[#4b263f] text-[#eed3ba] font-bold'
                    : 'text-[#d6b8cc] hover:text-white'
                }`}
              >
                Sat
              </button>
              <button
                type="button"
                onClick={() => setBasemapStyle('dark')}
                className={`px-2 py-0.5 rounded-md font-medium transition-all ${
                  basemapStyle === 'dark'
                    ? 'bg-[#4b263f] text-[#eed3ba] font-bold'
                    : 'text-[#d6b8cc] hover:text-white'
                }`}
              >
                Dark
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            {PERIOD_OPTIONS.map((period) => (
              <button
                key={period}
                type="button"
                onClick={() => onChangePeriod(period)}
                className={`text-xs px-2.5 py-1.5 rounded-lg font-mono transition-all ${
                  selectedPeriod === period
                    ? 'bg-gradient-to-r from-[#4b263f] to-[#7a3765] text-[#eed3ba] font-bold shadow-md shadow-[#4b263f]/60 border border-[#eed3ba]/50'
                    : 'bg-[#1e1421] text-[#d6b8cc] hover:bg-[#28192c] border border-[#381e30]'
                }`}
              >
                {period}
              </button>
            ))}
          </div>
        </div>

        {/* Change Types & Confidence Filters */}
        <div className="bg-[#18111a]/95 backdrop-blur-md p-3.5 rounded-2xl shadow-2xl border border-[#4b263f] text-[#f7e8db]">
          <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-[#3b1d32]">
            <span className="text-[11px] font-bold text-[#eed3ba] uppercase tracking-wider flex items-center gap-1.5 font-mono">
              <Layers className="w-3.5 h-3.5 text-[#eed3ba]" />
              Loss Layer Telemetry
            </span>
            <span className="text-[11px] text-[#d6b8cc] font-mono">
              {currentViewStats.totalCount} patches
            </span>
          </div>

          {/* Toggle buttons */}
          <div className="space-y-1.5 text-xs">
            <label className="flex items-center justify-between p-1.5 rounded-lg hover:bg-[#221626] cursor-pointer transition-colors">
              <span className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={showEncroachment}
                  onChange={(e) => setShowEncroachment(e.target.checked)}
                  className="rounded text-rose-600 focus:ring-rose-500 w-3.5 h-3.5 bg-[#120e14] border-[#4b263f]"
                />
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-rose-600 shadow-[0_0_8px_rgba(225,29,72,0.6)]"></span>
                <span className="font-medium text-[#f7e8db]">Encroachment</span>
              </span>
              <span className="text-rose-300 font-mono text-[11px] font-bold">
                {currentViewStats.encArea} ha
              </span>
            </label>

            <label className="flex items-center justify-between p-1.5 rounded-lg hover:bg-[#221626] cursor-pointer transition-colors">
              <span className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={showSeasonal}
                  onChange={(e) => setShowSeasonal(e.target.checked)}
                  className="rounded text-[#eed3ba] focus:ring-[#eed3ba] w-3.5 h-3.5 bg-[#120e14] border-[#4b263f]"
                />
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#eed3ba] shadow-[0_0_8px_rgba(238,211,186,0.6)]"></span>
                <span className="font-medium text-[#f7e8db]">Seasonal Loss</span>
              </span>
              <span className="text-[#eed3ba] font-mono text-[11px] font-bold">
                {currentViewStats.seaArea} ha
              </span>
            </label>

            <label className="flex items-center justify-between p-1.5 rounded-lg hover:bg-[#221626] cursor-pointer transition-colors">
              <span className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={showUncertain}
                  onChange={(e) => setShowUncertain(e.target.checked)}
                  className="rounded text-[#8b6982] focus:ring-[#8b6982] w-3.5 h-3.5 bg-[#120e14] border-[#4b263f]"
                />
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#8b6982]"></span>
                <span className="font-medium text-[#d6b8cc]">Uncertain</span>
              </span>
              <span className="text-[#d6b8cc] font-mono text-[11px]">
                {currentViewStats.uncArea} ha
              </span>
            </label>

            <label className="flex items-center justify-between p-1.5 rounded-lg hover:bg-[#221626] cursor-pointer transition-colors pt-2 border-t border-[#3b1d32]">
              <span className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={showCitizenIncidents}
                  onChange={(e) => setShowCitizenIncidents(e.target.checked)}
                  className="rounded text-rose-500 focus:ring-rose-500 w-3.5 h-3.5 bg-[#120e14] border-[#4b263f]"
                />
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></span>
                <span className="font-medium text-rose-300">Citizen Incidents</span>
              </span>
              <span className="text-rose-300 font-mono text-[11px]">
                {incidents.length} active
              </span>
            </label>
          </div>

          {/* Confidence Slider */}
          <div className="mt-3 pt-2.5 border-t border-[#3b1d32]">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-[#d6b8cc] flex items-center gap-1 font-medium text-[11px]">
                <Sliders className="w-3 h-3 text-[#eed3ba]" />
                Min Confidence:
              </span>
              <span className="font-mono font-bold text-[#eed3ba]">
                {Math.round(minConfidence * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="0.95"
              step="0.05"
              value={minConfidence}
              onChange={(e) => setMinConfidence(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-[#1e1421] rounded-lg appearance-none cursor-pointer accent-[#eed3ba]"
            />
            <div className="flex justify-between text-[10px] text-[#8b6982] mt-1 font-mono">
              <span>0% (All)</span>
              <span>50%</span>
              <span>95% (High)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Control Overlay Top Right: Action Tools & Active Site Dossier Card */}
      <div className="absolute top-4 right-4 z-20 flex flex-col gap-2.5 max-w-xs sm:max-w-sm pointer-events-auto">
        {/* Quick Toolbar */}
        <div className="flex items-center justify-end gap-1.5">
          {onOpenCitizenModal && (
            <button
              type="button"
              onClick={onOpenCitizenModal}
              className="bg-[#18111a]/95 hover:bg-[#251829] text-rose-300 text-xs font-semibold px-2.5 py-1.5 rounded-xl shadow-lg border border-rose-500/30 flex items-center gap-1.5 transition-all"
              title="Open Citizen Watchdog Hub"
            >
              <Shield className="w-3.5 h-3.5 text-rose-400" />
              <span>Citizen Watch</span>
            </button>
          )}

          {onOpenFloodModal && (
            <button
              type="button"
              onClick={onOpenFloodModal}
              className="bg-[#18111a]/95 hover:bg-[#251829] text-[#eed3ba] text-xs font-semibold px-2.5 py-1.5 rounded-xl shadow-lg border border-[#4b263f] flex items-center gap-1.5 transition-all"
              title="Calculate Lost Stormwater Retention Volume"
            >
              <Droplets className="w-3.5 h-3.5 text-[#eed3ba]" />
              <span>Flood Risk</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleFitAll}
            className="bg-[#18111a]/95 hover:bg-[#251829] text-[#f7e8db] text-xs font-medium px-2.5 py-1.5 rounded-xl shadow-lg border border-[#3b1d32] flex items-center gap-1.5 transition-all"
            title="Zoom to fit all 5 Chennai lakes"
          >
            <Maximize2 className="w-3.5 h-3.5 text-[#d6b8cc]" />
            <span>Fit All</span>
          </button>
        </div>

        {/* Selected Site Quick Card */}
        {selectedSite && selectedScore && (
          <div className="bg-[#18111a]/95 backdrop-blur-md p-4 rounded-2xl shadow-2xl border border-[#4b263f] text-[#f7e8db]">
            <div className="flex items-start justify-between gap-2 mb-2.5">
              <div>
                <span className="text-[10px] font-bold text-[#eed3ba] uppercase tracking-wider font-mono">
                  Active Focus
                </span>
                <h3 className="font-display font-extrabold text-white text-base tracking-tight">
                  {selectedSite.properties.name}
                </h3>
              </div>
              {(() => {
                const tier = getUrgencyTier(selectedScore.urgency_score);
                const style = getTierBadgeStyle(tier);
                return (
                  <span
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border ${style.bg} ${style.text} ${style.border} ${style.glow}`}
                  >
                    {tier} Tier ({selectedScore.urgency_score})
                  </span>
                );
              })()}
            </div>

            <div className="grid grid-cols-2 gap-2.5 py-2.5 border-y border-[#3b1d32] text-xs font-mono">
              <div className="bg-[#120e14] p-2 rounded-lg border border-[#3b1d32]">
                <span className="text-[10px] text-[#d6b8cc] block font-sans">
                  Encroachment Loss
                </span>
                <span className="font-bold text-rose-400 text-sm">
                  {selectedScore.loss_pct_since_2017}%
                </span>
              </div>
              <div className="bg-[#120e14] p-2 rounded-lg border border-[#3b1d32]">
                <span className="text-[10px] text-[#d6b8cc] block font-sans">
                  3Y Loss Rate
                </span>
                <span className="font-bold text-white text-sm">
                  {selectedScore.loss_rate_last3y_ha_per_year} ha/yr
                </span>
              </div>
              <div className="bg-[#120e14] p-2 rounded-lg border border-[#3b1d32]">
                <span className="text-[10px] text-[#d6b8cc] block font-sans">
                  Built in 500m
                </span>
                <span className="font-bold text-white text-sm">
                  {selectedScore.built_pct_within_500m}%
                </span>
              </div>
              <div className="bg-[#120e14] p-2 rounded-lg border border-[#3b1d32]">
                <span className="text-[10px] text-[#d6b8cc] block font-sans">
                  Built Growth
                </span>
                <span className="font-bold text-[#eed3ba] text-sm">
                  +{selectedScore.built_growth_pp_500m} pp
                </span>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => handleZoomToSite(selectedSite.properties.id)}
                className="text-xs text-[#eed3ba] hover:underline font-medium flex items-center gap-1"
              >
                <Eye className="w-3.5 h-3.5" />
                Zoom into lake
              </button>

              <div className="flex items-center gap-1.5">
                {onOpenLegalModal && (
                  <button
                    type="button"
                    onClick={onOpenLegalModal}
                    className="bg-[#241525] hover:bg-[#341d36] text-rose-300 border border-rose-500/30 px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                    title="Generate WRD Eviction Draft"
                  >
                    <Scale className="w-3 h-3 text-rose-400" />
                    Notice
                  </button>
                )}
                <button
                  type="button"
                  onClick={onOpenSitePanel}
                  className="bg-gradient-to-r from-[#4b263f] to-[#73355f] hover:from-[#5b2f4d] hover:to-[#853c6c] text-[#eed3ba] font-bold px-3 py-1 rounded-lg text-xs flex items-center gap-1 shadow-md shadow-[#4b263f]/50 border border-[#eed3ba]/30 transition-colors"
                >
                  Dossier
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Center: Innovative Multi-Year Satellite Playback Scrubber */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 pointer-events-auto bg-[#18111a]/95 backdrop-blur-md px-4 py-3 rounded-2xl shadow-2xl border border-[#4b263f] text-xs flex flex-col sm:flex-row items-center gap-4 max-w-[95vw] sm:max-w-xl w-full text-[#f7e8db]">
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setIsPlayingTimeline(!isPlayingTimeline)}
            className={`w-9 h-9 rounded-xl flex items-center justify-center text-[#eed3ba] transition-all shadow-md ${
              isPlayingTimeline
                ? 'bg-[#eed3ba] text-[#120e14]'
                : 'bg-[#4b263f] hover:bg-[#632f53] text-[#eed3ba] border border-[#eed3ba]/30'
            }`}
            title={isPlayingTimeline ? 'Pause multi-year animation' : 'Play multi-year satellite timelapse (2017–2025)'}
          >
            {isPlayingTimeline ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 ml-0.5 fill-current" />}
          </button>
          <div>
            <span className="text-[10px] text-[#eed3ba] font-mono uppercase block font-semibold">
              Timelapse Year
            </span>
            <span className="text-base font-bold text-white font-mono leading-none">
              {timelineYear}
            </span>
          </div>
        </div>

        {/* Year Range Slider */}
        <div className="flex-1 w-full">
          <div className="flex justify-between text-[10px] text-[#d6b8cc] font-mono mb-1">
            <span>2017 (Baseline)</span>
            {currentTimelineData && (
              <span className="text-[#eed3ba] font-bold">
                Wet: {Math.round(currentTimelineData.water_ha_peak)} ha | Dry: {Math.round(currentTimelineData.water_ha_dry)} ha
              </span>
            )}
            <span>2025 (Latest)</span>
          </div>
          <input
            type="range"
            min="2017"
            max="2025"
            step="1"
            value={timelineYear}
            onChange={(e) => {
              const yr = parseInt(e.target.value);
              setTimelineYear(yr);
              if (yr <= 2019) onChangePeriod('2017-2019');
              else if (yr <= 2021) onChangePeriod('2017-2021');
              else if (yr <= 2023) onChangePeriod('2017-2023');
              else onChangePeriod('2017-2025');
            }}
            className="w-full h-2 bg-[#221626] rounded-lg appearance-none cursor-pointer accent-[#eed3ba]"
          />
        </div>

        {/* Urgency Legend Pills */}
        <div className="hidden lg:flex items-center gap-2 border-l border-[#3b1d32] pl-3 shrink-0 text-[10px] font-mono">
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-600"></span>
            <span className="text-[#d6b8cc]">&ge;35</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#a84386]"></span>
            <span className="text-[#d6b8cc]">15–34</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#eed3ba]"></span>
            <span className="text-[#d6b8cc]">&lt;15</span>
          </div>
        </div>
      </div>
    </div>
  );
};
