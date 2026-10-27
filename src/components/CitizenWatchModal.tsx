import React, { useState } from 'react';
import {
  X,
  AlertTriangle,
  MapPin,
  Clock,
  Shield,
  Send,
  Plus,
  FileDown,
  UserCheck,
} from 'lucide-react';
import { CitizenIncident } from '../config/constants';
import { SitesGeoJSON } from '../types';

interface CitizenWatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  incidents: CitizenIncident[];
  onAddIncident: (incident: CitizenIncident) => void;
  sites: SitesGeoJSON;
  selectedSiteId: string;
}

export const CitizenWatchModal: React.FC<CitizenWatchModalProps> = ({
  isOpen,
  onClose,
  incidents,
  onAddIncident,
  sites,
  selectedSiteId,
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [filterSite, setFilterSite] = useState<string>('all');

  // Form State
  const [siteId, setSiteId] = useState(selectedSiteId || 'pallikaranai');
  const [reporterName, setReporterName] = useState('');
  const [reporterType, setReporterType] = useState<CitizenIncident['reporter_type']>('Citizen Watch');
  const [incidentType, setIncidentType] = useState<CitizenIncident['incident_type']>('Construction Debris Dumping');
  const [severity, setSeverity] = useState<CitizenIncident['severity']>('Critical');
  const [description, setDescription] = useState('');
  const [lat, setLat] = useState('12.9341');
  const [lng, setLng] = useState('80.2173');

  if (!isOpen) return null;

  const filteredIncidents = filterSite === 'all'
    ? incidents
    : incidents.filter((i) => i.site_id === filterSite);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reporterName.trim() || !description.trim()) return;

    const siteName = sites.features.find((f) => f.properties.id === siteId)?.properties.name || siteId;

    const newIncident: CitizenIncident = {
      id: `rep-${Date.now().toString().slice(-4)}`,
      site_id: siteId,
      site_name: siteName,
      reported_at: new Date().toISOString().split('T')[0],
      reporter_type: reporterType,
      reporter_name: reporterName,
      incident_type: incidentType,
      severity,
      lat: parseFloat(lat) || 13.0,
      lng: parseFloat(lng) || 80.2,
      description,
      status: 'Pending Verification',
    };

    onAddIncident(newIncident);
    setDescription('');
    setReporterName('');
    setShowAddForm(false);
  };

  const exportDossier = () => {
    const text = filteredIncidents.map((inc) => (
      `[CITIZEN OBSERVATION REPORT #${inc.id}]
Site: ${inc.site_name} (${inc.site_id})
Date: ${inc.reported_at}
Severity: ${inc.severity}
Status: ${inc.status}
Reporter: ${inc.reporter_name} (${inc.reporter_type})
Coordinates: ${inc.lat}, ${inc.lng}
Category: ${inc.incident_type}
Description: ${inc.description}
----------------------------------------`
    )).join('\n\n');

    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chennai_lakes_citizen_reports_${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="citizen-watch-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
    >
      <div className="bg-[#18111a] border border-[#4b263f] rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-[#f7e8db]">
        {/* Header */}
        <div className="px-6 py-4 bg-[#120e14] border-b border-[#3b1d32] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#4b263f] text-[#eed3ba] border border-[#eed3ba]/30 flex items-center justify-center shadow-md shadow-[#4b263f]/50">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 id="citizen-watch-modal-title" className="text-lg font-display font-bold text-white tracking-tight">
                  Citizen Ground Watchdog Hub
                </h3>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-[#4b263f]/60 text-[#eed3ba] border border-[#eed3ba]/30 font-mono">
                  Community Telemetry
                </span>
              </div>
              <p className="text-xs text-[#d6b8cc] font-sans">
                Ground observation reports logged by lake welfare associations and environmental volunteers
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={exportDossier}
              className="text-xs bg-[#241525] hover:bg-[#341d36] text-[#eed3ba] border border-[#4b263f] px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-colors font-medium"
              title="Export reports as text brief"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>Export Dossier</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#d6b8cc] hover:text-white hover:bg-[#241525] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Action bar & Filters */}
        <div className="px-6 py-3 bg-[#140e16] border-b border-[#3b1d32] flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 font-sans">
            <span className="text-[#d6b8cc] font-medium">Filter by Lake:</span>
            <select
              aria-label="Filter incidents by lake"
              value={filterSite}
              onChange={(e) => setFilterSite(e.target.value)}
              className="bg-[#1e1320] border border-[#4b263f] text-[#eed3ba] font-semibold rounded-lg px-2.5 py-1 text-xs focus:outline-hidden focus:border-[#eed3ba]"
            >
              <option value="all">All Chennai Lakes ({incidents.length})</option>
              {sites.features.map((f) => (
                <option key={f.properties.id} value={f.properties.id}>
                  {f.properties.name}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-gradient-to-r from-[#4b263f] to-[#73355f] hover:from-[#5b2f4d] hover:to-[#853c6c] text-[#eed3ba] border border-[#eed3ba]/30 font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-colors shadow-sm"
          >
            {showAddForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
            <span>{showAddForm ? 'Cancel Logging' : 'Log Ground Encroachment Incident'}</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 font-sans">
          {/* Add Form Accordion */}
          {showAddForm && (
            <form onSubmit={handleSubmit} className="bg-[#120e14] border border-[#4b263f] rounded-2xl p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between pb-2 border-b border-[#3b1d32]">
                <h4 className="text-sm font-display font-bold text-white flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-[#eed3ba]" />
                  Log New Encroachment / Dumping Observation
                </h4>
                <span className="text-[11px] text-[#eed3ba] font-mono">Immediate Local Dispatch</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block text-[#d6b8cc] mb-1 font-medium">Waterbody</label>
                  <select
                    value={siteId}
                    onChange={(e) => setSiteId(e.target.value)}
                    className="w-full bg-[#18111a] border border-[#3b1d32] rounded-lg p-2 text-white"
                  >
                    {sites.features.map((f) => (
                      <option key={f.properties.id} value={f.properties.id}>
                        {f.properties.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[#d6b8cc] mb-1 font-medium">Reporter / Organisation</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Porur RWA / Field Volunteer"
                    value={reporterName}
                    onChange={(e) => setReporterName(e.target.value)}
                    className="w-full bg-[#18111a] border border-[#3b1d32] rounded-lg p-2 text-white placeholder:text-[#8b6982]"
                  />
                </div>

                <div>
                  <label className="block text-[#d6b8cc] mb-1 font-medium">Reporter Affiliation</label>
                  <select
                    value={reporterType}
                    onChange={(e) => setReporterType(e.target.value as any)}
                    className="w-full bg-[#18111a] border border-[#3b1d32] rounded-lg p-2 text-white"
                  >
                    <option value="Citizen Watch">Citizen Watch / Resident</option>
                    <option value="Resident Group">Resident Welfare Association (RWA)</option>
                    <option value="NGO Field Volunteer">NGO / Field Volunteer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[#d6b8cc] mb-1 font-medium">Incident Category</label>
                  <select
                    value={incidentType}
                    onChange={(e) => setIncidentType(e.target.value as any)}
                    className="w-full bg-[#18111a] border border-[#3b1d32] rounded-lg p-2 text-white"
                  >
                    <option value="Construction Debris Dumping">Construction Debris Dumping</option>
                    <option value="Unauthorized Earth Filling">Unauthorized Earth Filling</option>
                    <option value="Perimeter Bund Breached">Perimeter Bund Breached</option>
                    <option value="Sewage Inflow / Weed Choking">Sewage Inflow / Weed Choking</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[#d6b8cc] mb-1 font-medium">Estimated Latitude</label>
                  <input
                    type="text"
                    value={lat}
                    onChange={(e) => setLat(e.target.value)}
                    className="w-full bg-[#18111a] border border-[#3b1d32] rounded-lg p-2 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[#d6b8cc] mb-1 font-medium">Estimated Longitude</label>
                  <input
                    type="text"
                    value={lng}
                    onChange={(e) => setLng(e.target.value)}
                    className="w-full bg-[#18111a] border border-[#3b1d32] rounded-lg p-2 text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#d6b8cc] mb-1 font-medium text-xs">Incident Description & Visual Evidence</label>
                <textarea
                  required
                  rows={2}
                  placeholder="Describe location details, vehicles seen, or structural changes observed on the lake perimeter..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-[#18111a] border border-[#3b1d32] rounded-lg p-2 text-white text-xs placeholder:text-[#8b6982] focus:outline-hidden focus:border-[#eed3ba]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-3 py-1.5 rounded-lg border border-[#3b1d32] text-xs text-[#d6b8cc] hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-[#4b263f] to-[#73355f] text-[#eed3ba] font-bold text-xs flex items-center gap-1.5 shadow-sm border border-[#eed3ba]/30"
                >
                  <Send className="w-3.5 h-3.5" />
                  Publish Incident Report
                </button>
              </div>
            </form>
          )}

          {/* Incident List */}
          <div className="space-y-3">
            {filteredIncidents.length === 0 ? (
              <div className="text-center py-12 text-[#8b6982] text-xs">
                No citizen reports logged for this site yet.
              </div>
            ) : (
              filteredIncidents.map((inc) => (
                <div
                  key={inc.id}
                  className="bg-[#120e14] border border-[#3b1d32] hover:border-[#eed3ba]/40 rounded-xl p-4 transition-all"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-display font-bold text-white text-sm">
                        {inc.site_name}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#201321] text-[#eed3ba] border border-[#4b263f]">
                        {inc.id}
                      </span>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                          inc.severity === 'Critical'
                            ? 'bg-rose-950/50 text-rose-300 border-rose-500/50'
                            : 'bg-[#4b263f]/50 text-[#eed3ba] border-[#853c6c]'
                        }`}
                      >
                        {inc.severity} Severity
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-[#d6b8cc] flex items-center gap-1">
                        <Clock className="w-3 h-3 text-[#8b6982]" />
                        {inc.reported_at}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-md text-[11px] font-medium border ${
                          inc.status === 'Eviction Notice Drafted'
                            ? 'bg-rose-950 text-rose-300 border-rose-800'
                            : inc.status === 'Inspected by WRD'
                            ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                            : 'bg-[#201321] text-[#d6b8cc] border-[#3b1d32]'
                        }`}
                      >
                        {inc.status}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-[#f7e8db] leading-relaxed mt-1">
                    {inc.description}
                  </p>

                  <div className="mt-3 pt-2.5 border-t border-[#231526] flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#d6b8cc]">
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-1 text-white font-medium">
                        <UserCheck className="w-3 h-3 text-[#eed3ba]" />
                        {inc.reporter_name}
                      </span>
                      <span className="text-[#4b263f]">&bull;</span>
                      <span className="text-[#d6b8cc]">{inc.reporter_type}</span>
                    </div>

                    <div className="flex items-center gap-3 font-mono text-[10px]">
                      <span className="flex items-center gap-1 text-[#d6b8cc]">
                        <MapPin className="w-3 h-3 text-[#eed3ba]" />
                        {inc.lat.toFixed(4)}, {inc.lng.toFixed(4)}
                      </span>
                      <span className="bg-[#1f1422] px-2 py-0.5 rounded-md text-[#eed3ba] border border-[#3b1d32]">
                        {inc.incident_type}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
