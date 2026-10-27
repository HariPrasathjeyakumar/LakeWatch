import React, { useMemo } from 'react';
import { ScoreRow, SitesGeoJSON, TimeseriesRow } from '../types';
import { getTierBadgeStyle, getUrgencyTier } from '../config/constants';
import {
  AlertCircle,
  ChevronRight,
  Droplets,
  Scale,
} from 'lucide-react';

interface RankedListProps {
  sites: SitesGeoJSON;
  scores: ScoreRow[];
  timeseries: TimeseriesRow[];
  selectedSiteId: string;
  onSelectSite: (siteId: string) => void;
  onOpenSitePanel: () => void;
  onOpenFloodModal?: () => void;
  onOpenLegalModal?: () => void;
}

export const RankedList: React.FC<RankedListProps> = ({
  sites,
  scores,
  timeseries,
  selectedSiteId,
  onSelectSite,
  onOpenSitePanel,
  onOpenFloodModal,
  onOpenLegalModal,
}) => {
  // Sort sites descending by urgency_score
  const rankedSites = useMemo(() => {
    return [...scores].sort((a, b) => b.urgency_score - a.urgency_score);
  }, [scores]);

  // Map site_id to site name
  const siteNames = useMemo(() => {
    const map = new Map<string, string>();
    sites.features.forEach((f) => {
      map.set(f.properties.id, f.properties.name);
    });
    return map;
  }, [sites]);

  // Timeseries by site for sparkline
  const timeseriesBySite = useMemo(() => {
    const map = new Map<string, TimeseriesRow[]>();
    timeseries.forEach((row) => {
      if (!map.has(row.site_id)) {
        map.set(row.site_id, []);
      }
      map.get(row.site_id)!.push(row);
    });
    map.forEach((rows) => rows.sort((a, b) => a.year - b.year));
    return map;
  }, [timeseries]);

  // SVG Sparkline generator for water_ha_peak
  const renderSparkline = (rows: TimeseriesRow[] | undefined) => {
    if (!rows || rows.length < 2) {
      return <span className="text-xs text-[#8b6982]">No trend data</span>;
    }

    const values = rows.map((r) => r.water_ha_peak);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;
    const width = 120;
    const height = 34;
    const padding = 4;

    const points = values.map((val, idx) => {
      const x = padding + (idx / (values.length - 1)) * (width - 2 * padding);
      const y =
        height -
        padding -
        ((val - min) / range) * (height - 2 * padding);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });

    const isDecreasing = values[values.length - 1] < values[0];
    const strokeColor = isDecreasing ? '#f43f5e' : '#eed3ba';

    return (
      <div className="flex items-center gap-2">
        <svg
          width={width}
          height={height}
          className="overflow-visible"
          aria-label="Water extent peak sparkline"
        >
          {/* Subtle baseline */}
          <line
            x1={padding}
            y1={height - padding}
            x2={width - padding}
            y2={height - padding}
            stroke="#3b1d32"
            strokeWidth="1"
            strokeDasharray="2,2"
          />
          {/* Polyline */}
          <polyline
            fill="none"
            stroke={strokeColor}
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={points.join(' ')}
          />
          {/* Final point circle */}
          {points.length > 0 && (
            <circle
              cx={points[points.length - 1].split(',')[0]}
              cy={points[points.length - 1].split(',')[1]}
              r="3.5"
              fill={strokeColor}
            />
          )}
        </svg>
        <div className="text-[10px] text-[#d6b8cc] font-mono">
          <div>{rows[0].year}: {Math.round(rows[0].water_ha_peak)} ha</div>
          <div className="text-[#eed3ba] font-bold">{rows[rows.length - 1].year}: {Math.round(rows[rows.length - 1].water_ha_peak)} ha</div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 text-[#f7e8db]">
      {/* Page Title & Mandatory Caution Note */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#eed3ba] bg-[#4b263f]/60 border border-[#eed3ba]/30 px-2.5 py-0.5 rounded-full font-mono">
                Priority Index
              </span>
              <span className="text-xs text-[#d6b8cc] font-mono">
                Multispectral &bull; Dynamic World Built Model
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-display font-extrabold text-white tracking-tight mt-1">
              Ranked Lake &amp; Wetland Priority Tiers
            </h2>
            <p className="text-sm text-[#d6b8cc] mt-1.5 leading-relaxed max-w-3xl font-sans">
              Synthesized ranking based on classified built-up encroachment loss, 3-year loss velocity, and urban buffer pressure within 500 meters of lake boundaries.
            </p>
          </div>
        </div>

        {/* Mandatory Methodology Note */}
        <div className="mt-4 bg-[#1b121d] border border-[#4b263f] rounded-2xl p-4 flex items-start gap-3 text-[#eed3ba] text-xs sm:text-sm shadow-md">
          <AlertCircle className="w-5 h-5 text-[#eed3ba] shrink-0 mt-0.5" />
          <div className="font-sans">
            <span className="font-bold text-white">Important Methodology Note:</span>{' '}
            Ranking among mid-tier sites changes with the scoring settings; treat it as tiers, not an exact order.
          </div>
        </div>
      </div>

      {/* Ranked Table */}
      <div className="bg-[#18111a] rounded-2xl shadow-xl border border-[#4b263f] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-[#f7e8db]">
            <thead className="bg-[#120e14] border-b border-[#3b1d32] text-[11px] uppercase font-bold text-[#eed3ba] tracking-wider font-mono">
              <tr>
                <th scope="col" className="py-4 px-4 w-12 text-center">Rank</th>
                <th scope="col" className="py-4 px-4">Waterbody Site</th>
                <th scope="col" className="py-4 px-4">Urgency Score &amp; Tier</th>
                <th scope="col" className="py-4 px-4">Encroachment % (Since 2017)</th>
                <th scope="col" className="py-4 px-4">3Y Loss Velocity</th>
                <th scope="col" className="py-4 px-4">500m Built Pressure</th>
                <th scope="col" className="py-4 px-4">Peak Wet Extent Sparkline</th>
                <th scope="col" className="py-4 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2a1727]">
              {rankedSites.map((item, index) => {
                const tier = getUrgencyTier(item.urgency_score);
                const tierStyle = getTierBadgeStyle(tier);
                const name = siteNames.get(item.site_id) || item.site_id;
                const isSelected = selectedSiteId === item.site_id;
                const siteTimeseries = timeseriesBySite.get(item.site_id);

                return (
                  <tr
                    key={item.site_id}
                    onClick={() => {
                      onSelectSite(item.site_id);
                    }}
                    className={`hover:bg-[#231625] transition-colors cursor-pointer ${
                      isSelected ? 'bg-[#28182a]/90 font-medium' : ''
                    }`}
                  >
                    {/* Rank */}
                    <td className="py-4 px-4 text-center font-bold font-mono text-[#8b6982]">
                      #{index + 1}
                    </td>

                    {/* Site name */}
                    <td className="py-4 px-4">
                      <div className="font-display font-bold text-white text-base tracking-tight">
                        {name}
                      </div>
                      <div className="text-xs text-[#eed3ba]/80 font-mono capitalize">
                        ID: {item.site_id}
                      </div>
                    </td>

                    {/* Score Bar & Tier */}
                    <td className="py-4 px-4 min-w-[200px]">
                      <div className="flex items-center justify-between mb-1.5">
                        <span
                          className={`text-xs px-2.5 py-0.5 rounded-lg border font-bold ${tierStyle.bg} ${tierStyle.text} ${tierStyle.border} ${tierStyle.glow}`}
                        >
                          {tier} Tier
                        </span>
                        <span className="font-bold font-mono text-white">
                          {item.urgency_score} <span className="text-[#8b6982] text-xs font-normal">/ 100</span>
                        </span>
                      </div>
                      {/* Visual score bar */}
                      <div className="w-full bg-[#120e14] h-2 rounded-full overflow-hidden border border-[#3b1d32]">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.min(100, item.urgency_score)}%`,
                            backgroundColor: tierStyle.mapColor,
                            boxShadow: `0 0 10px ${tierStyle.mapColor}`,
                          }}
                        />
                      </div>
                    </td>

                    {/* Encroachment % since 2017 */}
                    <td className="py-4 px-4 font-mono">
                      <div className="font-bold text-rose-400 text-base">
                        {item.loss_pct_since_2017}%
                      </div>
                      <div className="text-[11px] text-[#d6b8cc] font-sans">
                        of 2017 baseline
                      </div>
                    </td>

                    {/* 3Y loss rate */}
                    <td className="py-4 px-4 font-mono">
                      <div className="text-white font-semibold">
                        {item.loss_rate_last3y_ha_per_year} ha/yr
                      </div>
                      <div className="text-[11px] text-[#d6b8cc] font-sans">
                        annual velocity
                      </div>
                    </td>

                    {/* 500m Built */}
                    <td className="py-4 px-4 font-mono text-xs">
                      <div>
                        <span className="text-white font-bold">{item.built_pct_within_500m}%</span> built-up
                      </div>
                      <div className="text-[#eed3ba] font-medium">
                        +{item.built_growth_pp_500m} pp growth
                      </div>
                    </td>

                    {/* Sparkline */}
                    <td className="py-4 px-4">
                      {renderSparkline(siteTimeseries)}
                    </td>

                    {/* Action */}
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectSite(item.site_id);
                            onOpenSitePanel();
                          }}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-[#4b263f] to-[#73355f] hover:from-[#5c2e4e] hover:to-[#853c6c] text-[#eed3ba] text-xs font-bold rounded-lg shadow-md shadow-[#4b263f]/60 border border-[#eed3ba]/30 transition-all"
                        >
                          Dossier
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
