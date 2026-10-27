import React, { useState, useMemo } from 'react';
import {
  X,
  Calendar,
  AlertTriangle,
  Building2,
  Sparkles,
  FileText,
  Droplets,
  Scale,
  Info,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import {
  ChangeType,
  ChangesGeoJSON,
  PeriodType,
  ScoreRow,
  SiteFeature,
  SiteNotes,
  TimeseriesRow,
  ValidationData,
} from '../types';
import {
  CHANGE_TYPE_CONFIG,
  PERIOD_OPTIONS,
  getTierBadgeStyle,
  getUrgencyTier,
} from '../config/constants';
import { computeSiteChangeAreas } from '../services/dataService';

interface SiteDetailPanelProps {
  isOpen: boolean;
  onClose: () => void;
  site: SiteFeature;
  score: ScoreRow | undefined;
  timeseries: TimeseriesRow[];
  changes: ChangesGeoJSON;
  siteNotes: SiteNotes;
  validation: ValidationData;
  selectedPeriod: PeriodType;
  onChangePeriod: (period: PeriodType) => void;
  onOpenFloodModal?: () => void;
  onOpenLegalModal?: () => void;
}

export const SiteDetailPanel: React.FC<SiteDetailPanelProps> = ({
  isOpen,
  onClose,
  site,
  score,
  timeseries,
  changes,
  siteNotes,
  validation,
  selectedPeriod,
  onChangePeriod,
  onOpenFloodModal,
  onOpenLegalModal,
}) => {
  const [activeChartTab, setActiveChartTab] = useState<'extent' | 'openWater'>('extent');
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const siteId = site.properties.id;
  const siteName = site.properties.name;
  const siteNote = siteNotes[siteId] || '';

  // Filter timeseries for this site and sort by year
  const siteTimeseries = useMemo(() => {
    return timeseries
      .filter((r) => r.site_id === siteId)
      .sort((a, b) => a.year - b.year);
  }, [timeseries, siteId]);

  // Compute change areas for current site and selected period
  const changeAreas = useMemo(() => {
    return computeSiteChangeAreas(changes, siteId, selectedPeriod);
  }, [changes, siteId, selectedPeriod]);

  // Urgency tier
  const urgency = score?.urgency_score ?? 0;
  const tier = getUrgencyTier(urgency);
  const tierStyle = getTierBadgeStyle(tier);

  const uncertainRatio =
    changeAreas.total_loss_ha > 0
      ? changeAreas.uncertain_ha / changeAreas.total_loss_ha
      : 0;
  const hasHighUncertainty = uncertainRatio > 0.2;
  const hasReliabilityWarning = siteId === 'pallikaranai' || siteNote.toLowerCase().includes('less reliable');

  // Handle AI Report Generation
  const handleGenerateAiSummary = async () => {
    setIsGeneratingAi(true);
    setAiError(null);

    try {
      const response = await fetch('/api/generate-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          site_id: siteId,
          site_name: siteName,
          timeseries: siteTimeseries,
          scores: score,
          change_areas: changeAreas,
          site_note: siteNote,
          validation: validation,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate summary');
      }

      setAiSummary(data.summary);
    } catch (err: any) {
      setAiError(err.message || 'Error contacting Gemini summary service.');
    } finally {
      setIsGeneratingAi(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Detailed analysis for ${siteName}`}
      className="fixed inset-y-0 right-0 z-50 w-full sm:max-w-2xl bg-[#120e14] shadow-2xl flex flex-col overflow-hidden border-l border-[#4b263f] transition-transform duration-300 text-[#f7e8db]"
    >
      {/* Panel Header */}
      <div className="px-6 py-4 bg-[#18111a] text-white flex items-center justify-between border-b border-[#3b1d32]">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-wider text-[#eed3ba] font-mono font-bold">
              Site Dossier
            </span>
            <span
              className={`text-xs px-2.5 py-0.5 rounded-full border font-bold ${tierStyle.bg} ${tierStyle.text} ${tierStyle.border} ${tierStyle.glow}`}
            >
              {tier} Urgency Tier ({urgency}/100)
            </span>
          </div>
          <h2 className="text-xl font-display font-extrabold tracking-tight text-white mt-1">
            {siteName}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          {onOpenFloodModal && (
            <button
              type="button"
              onClick={onOpenFloodModal}
              className="p-2 rounded-xl bg-[#201321] hover:bg-[#301b33] text-[#eed3ba] border border-[#4b263f] transition-colors"
              title="Calculate Lost Stormwater Retention Volume"
            >
              <Droplets className="w-4 h-4" />
            </button>
          )}

          {onOpenLegalModal && (
            <button
              type="button"
              onClick={onOpenLegalModal}
              className="p-2 rounded-xl bg-[#201321] hover:bg-[#301b33] text-rose-300 border border-rose-500/30 transition-colors"
              title="Draft Official WRD Eviction Notice"
            >
              <Scale className="w-4 h-4" />
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#d6b8cc] hover:text-white hover:bg-[#201321] transition-colors"
            title="Close panel"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Site Specific Note / Caution Alert */}
        {siteNote && (
          <div className="bg-[#1f1422] border-l-4 border-[#eed3ba] p-4 rounded-r-xl border border-[#3b1d32]">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 text-[#eed3ba] shrink-0 mt-0.5" />
              <div>
                <h4 className="text-[10px] font-bold text-[#eed3ba] uppercase tracking-wider font-mono">
                  Site-Specific Sensor Telemetry Note
                </h4>
                <p className="text-xs text-[#f7e8db] mt-1 leading-relaxed font-sans">
                  {siteNote}
                </p>
                {hasReliabilityWarning && (
                  <p className="text-[11px] font-semibold text-rose-300 mt-1 font-sans">
                    Notice: 10m spatial pixel resolution limits detection in narrow wetland strips. Interpret estimates with caution.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Period Selector & Loss Breakdown */}
        <div className="bg-[#18111a] border border-[#4b263f] rounded-2xl p-4 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
            <div>
              <span className="text-xs font-bold uppercase text-[#eed3ba] flex items-center gap-1.5 font-mono">
                <Calendar className="w-3.5 h-3.5 text-[#eed3ba]" />
                Classified Loss Window
              </span>
              <p className="text-[11px] text-[#d6b8cc] font-sans">
                Baseline wet extent held absent across consecutive seasons
              </p>
            </div>
            {/* Period Pills */}
            <div className="flex items-center gap-1 bg-[#120e14] p-1 rounded-xl border border-[#3b1d32]">
              {PERIOD_OPTIONS.map((period) => (
                <button
                  key={period}
                  type="button"
                  onClick={() => onChangePeriod(period)}
                  className={`text-xs px-2.5 py-1 rounded-lg transition-all font-mono font-medium ${
                    selectedPeriod === period
                      ? 'bg-gradient-to-r from-[#4b263f] to-[#73355f] text-[#eed3ba] font-bold shadow-xs border border-[#eed3ba]/30'
                      : 'text-[#d6b8cc] hover:text-white'
                  }`}
                >
                  {period}
                </button>
              ))}
            </div>
          </div>

          {/* Breakdown cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
            {/* Encroachment */}
            <div className="bg-[#120e14] p-3 rounded-xl border border-rose-500/30 shadow-xs">
              <span className="text-[10px] font-bold text-rose-400 block uppercase font-mono">
                Encroachment
              </span>
              <div className="text-lg font-bold text-white mt-0.5 font-mono">
                {changeAreas.encroachment_ha} <span className="text-xs text-[#d6b8cc] font-normal">ha</span>
              </div>
              <span className="text-[10px] text-[#d6b8cc] block mt-0.5 font-sans">
                Built-up converted
              </span>
            </div>

            {/* Seasonal */}
            <div className="bg-[#120e14] p-3 rounded-xl border border-[#eed3ba]/40 shadow-xs">
              <span className="text-[10px] font-bold text-[#eed3ba] block uppercase font-mono">
                Seasonal Loss
              </span>
              <div className="text-lg font-bold text-white mt-0.5 font-mono">
                {changeAreas.seasonal_ha} <span className="text-xs text-[#d6b8cc] font-normal">ha</span>
              </div>
              <span className="text-[10px] text-[#d6b8cc] block mt-0.5 font-sans">
                Vegetation / dry shifts
              </span>
            </div>

            {/* Uncertain */}
            <div className="bg-[#120e14] p-3 rounded-xl border border-[#4b263f] shadow-xs">
              <span className="text-[10px] font-bold text-[#8b6982] block uppercase font-mono">
                Uncertain
              </span>
              <div className="text-lg font-bold text-white mt-0.5 font-mono">
                {changeAreas.uncertain_ha} <span className="text-xs text-[#d6b8cc] font-normal">ha</span>
              </div>
              <span className="text-[10px] text-[#d6b8cc] block mt-0.5 font-sans">
                &lt;30m boundary strip
              </span>
            </div>

            {/* Total */}
            <div className="bg-[#120e14] p-3 rounded-xl border border-[#3b1d32] shadow-xs">
              <span className="text-[10px] font-bold text-[#f7e8db] block uppercase font-mono">
                Total Loss
              </span>
              <div className="text-lg font-bold text-white mt-0.5 font-mono">
                {changeAreas.total_loss_ha} <span className="text-xs text-[#d6b8cc] font-normal">ha</span>
              </div>
              <span className="text-[10px] text-[#d6b8cc] block mt-0.5 font-sans">
                Absent &ge; 2 years
              </span>
            </div>
          </div>

          {hasHighUncertainty && (
            <p className="text-[11px] text-[#d6b8cc] mt-2.5 italic flex items-center gap-1.5 font-sans">
              <Info className="w-3.5 h-3.5 text-[#eed3ba] shrink-0" />
              Uncertain area accounts for {(uncertainRatio * 100).toFixed(0)}% of total loss at this site due to pixel edge ambiguity.
            </p>
          )}
        </div>

        {/* 500-Meter Urban Buffer Pressure Metrics */}
        {score && (
          <div className="bg-[#18111a] border border-[#4b263f] rounded-2xl p-4 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#eed3ba] mb-3 flex items-center gap-1.5 font-mono">
              <Building2 className="w-4 h-4 text-[#eed3ba]" />
              500-Meter Surrounding Urbanization Buffer
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-sans">
              <div className="bg-[#120e14] p-3 rounded-xl border border-[#3b1d32]">
                <span className="text-[11px] text-[#d6b8cc] block">
                  Built-up Fraction (2025)
                </span>
                <span className="text-xl font-bold text-white font-mono">
                  {score.built_pct_within_500m}%
                </span>
                <span className="text-[10px] text-[#8b6982] block mt-0.5">
                  of 500m perimeter ring
                </span>
              </div>

              <div className="bg-[#120e14] p-3 rounded-xl border border-[#3b1d32]">
                <span className="text-[11px] text-[#d6b8cc] block">
                  Built Growth (2017–25)
                </span>
                <span className="text-xl font-bold text-[#eed3ba] font-mono">
                  +{score.built_growth_pp_500m} <span className="text-xs font-normal">pp</span>
                </span>
                <span className="text-[10px] text-[#8b6982] block mt-0.5">
                  percentage point increase
                </span>
              </div>

              <div className="bg-[#120e14] p-3 rounded-xl border border-[#3b1d32]">
                <span className="text-[11px] text-[#d6b8cc] block">
                  3Y Loss Velocity
                </span>
                <span className="text-xl font-bold text-rose-400 font-mono">
                  {score.loss_rate_last3y_ha_per_year} <span className="text-xs font-normal">ha/yr</span>
                </span>
                <span className="text-[10px] text-[#8b6982] block mt-0.5">
                  annualized encroached
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Multi-Year Timeseries Area Chart (2017–2025) */}
        <div className="bg-[#18111a] border border-[#4b263f] rounded-2xl p-4 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#eed3ba] flex items-center gap-1.5 font-mono">
                <Droplets className="w-4 h-4 text-[#eed3ba]" />
                Multi-Year Telemetry (2017–2025)
              </h3>
              <p className="text-[11px] text-[#d6b8cc] font-sans">
                Peak monsoon vs Dry season Sentinel-2 composites
              </p>
            </div>

            <div className="flex items-center gap-1 bg-[#120e14] p-0.5 rounded-lg text-xs border border-[#3b1d32]">
              <button
                type="button"
                onClick={() => setActiveChartTab('extent')}
                className={`px-2.5 py-1 rounded-md transition-all font-medium ${
                  activeChartTab === 'extent'
                    ? 'bg-[#4b263f] text-[#eed3ba] font-bold shadow-xs'
                    : 'text-[#d6b8cc] hover:text-white'
                }`}
              >
                Wet Extent
              </button>
              <button
                type="button"
                onClick={() => setActiveChartTab('openWater')}
                className={`px-2.5 py-1 rounded-md transition-all font-medium ${
                  activeChartTab === 'openWater'
                    ? 'bg-[#4b263f] text-[#eed3ba] font-bold shadow-xs'
                    : 'text-[#d6b8cc] hover:text-white'
                }`}
              >
                Open Water Only
              </button>
            </div>
          </div>

          {/* Chart Display */}
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              {activeChartTab === 'extent' ? (
                <AreaChart
                  data={siteTimeseries}
                  margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorCurfewPeak" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#eed3ba" stopOpacity={0.6} />
                      <stop offset="95%" stopColor="#4b263f" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorCurfewDry" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#c05c8f" stopOpacity={0.6} />
                      <stop offset="95%" stopColor="#4b263f" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a1727" />
                  <XAxis dataKey="year" tick={{ fontSize: 11, fill: '#d6b8cc' }} />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#d6b8cc' }}
                    unit=" ha"
                    width={55}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(24, 17, 26, 0.96)',
                      borderRadius: '12px',
                      fontSize: '12px',
                      boxShadow: '0 10px 25px -5px rgba(0,0,0,0.8)',
                      borderColor: '#4b263f',
                      color: '#f7e8db',
                    }}
                    formatter={(val: any) => [`${val} ha`, '']}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }} />
                  <Area
                    type="monotone"
                    dataKey="water_ha_peak"
                    name="Peak Monsoon Wet Extent"
                    stroke="#eed3ba"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorCurfewPeak)"
                  />
                  <Area
                    type="monotone"
                    dataKey="water_ha_dry"
                    name="Dry Season Wet Extent"
                    stroke="#c05c8f"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorCurfewDry)"
                  />
                </AreaChart>
              ) : (
                <AreaChart
                  data={siteTimeseries}
                  margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorOpenPeak" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#eed3ba" stopOpacity={0.5} />
                      <stop offset="95%" stopColor="#eed3ba" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorOpenDry" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.5} />
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a1727" />
                  <XAxis dataKey="year" tick={{ fontSize: 11, fill: '#d6b8cc' }} />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#d6b8cc' }}
                    unit=" ha"
                    width={55}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(24, 17, 26, 0.96)',
                      borderRadius: '12px',
                      fontSize: '12px',
                      boxShadow: '0 10px 25px -5px rgba(0,0,0,0.8)',
                      borderColor: '#4b263f',
                      color: '#f7e8db',
                    }}
                    formatter={(val: any) => [`${val} ha`, '']}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }} />
                  <Area
                    type="monotone"
                    dataKey="open_water_ha_peak"
                    name="Peak Open Water (MNDWI)"
                    stroke="#eed3ba"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorOpenPeak)"
                  />
                  <Area
                    type="monotone"
                    dataKey="open_water_ha_dry"
                    name="Dry Open Water (MNDWI)"
                    stroke="#f43f5e"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorOpenDry)"
                  />
                </AreaChart>
              )}
            </ResponsiveContainer>
          </div>

          <div className="mt-2 text-[10px] text-[#d6b8cc] flex items-center justify-between font-mono">
            <span>Wet extent includes open water + flooded marsh vegetation</span>
            <span>Sentinel-2 MSI (10m)</span>
          </div>
        </div>

        {/* Gemini AI Official Summary Panel */}
        <div className="bg-[#18111a] border border-[#4b263f] rounded-2xl p-5 shadow-xl text-white">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#4b263f] text-[#eed3ba] border border-[#eed3ba]/30 flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-display font-bold text-white">
                  Official Briefing Generator
                </h4>
                <p className="text-[11px] text-[#d6b8cc] font-sans">
                  Powered by Gemini 3.8 Flash &bull; Strictly grounded in telemetry figures
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleGenerateAiSummary}
              disabled={isGeneratingAi}
              className="bg-gradient-to-r from-[#4b263f] to-[#73355f] hover:from-[#5b2f4d] hover:to-[#853c6c] disabled:opacity-50 text-[#eed3ba] text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all shadow-md shadow-[#4b263f]/60 border border-[#eed3ba]/30 shrink-0"
            >
              {isGeneratingAi ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <FileText className="w-3.5 h-3.5" />
                  Generate Briefing
                </>
              )}
            </button>
          </div>

          {/* AI Output Area */}
          {aiSummary ? (
            <div className="mt-4 bg-[#120e14] border border-[#4b263f] rounded-xl p-4 text-xs text-[#f7e8db] leading-relaxed">
              <div className="flex items-center gap-1.5 text-[#eed3ba] font-mono text-[10px] uppercase tracking-wider mb-2 font-bold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                AI-generated summary of the figures shown
              </div>
              <p className="whitespace-pre-line font-sans leading-relaxed">{aiSummary}</p>
            </div>
          ) : aiError ? (
            <div className="mt-3 bg-red-950/40 border border-red-800/60 text-red-300 text-xs p-3.5 rounded-xl">
              <p className="font-semibold">Notice:</p>
              <p>{aiError}</p>
            </div>
          ) : (
            <p className="text-xs text-[#d6b8cc] mt-2 font-sans">
              Generates a concise 100-word plain-language summary for water resource officials, incorporating satellite numbers, relative urgency caveats, and pixel uncertainty notes.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
