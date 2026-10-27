import React, { useEffect, useState, useMemo } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { MapView } from './components/MapView';
import { RankedList } from './components/RankedList';
import { MethodsAndAccuracy } from './components/MethodsAndAccuracy';
import { SiteDetailPanel } from './components/SiteDetailPanel';
import { CitizenWatchModal } from './components/CitizenWatchModal';
import { FloodCapacityModal } from './components/FloodCapacityModal';
import { LegalNoticeModal } from './components/LegalNoticeModal';
import { loadAllLakeWatchData, AppDataBundle } from './services/dataService';
import {
  INITIAL_CITIZEN_INCIDENTS,
  CitizenIncident,
} from './config/constants';
import { PeriodType } from './types';
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';

export function App() {
  const [data, setData] = useState<AppDataBundle | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Navigation and Selection State
  const [activeTab, setActiveTab] = useState<'map' | 'ranked' | 'methods'>('map');
  const [selectedSiteId, setSelectedSiteId] = useState<string>('pallikaranai');
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>('2017-2025');

  // Modal / Panel states
  const [isSitePanelOpen, setIsSitePanelOpen] = useState(false);
  const [isCitizenModalOpen, setIsCitizenModalOpen] = useState(false);
  const [isFloodModalOpen, setIsFloodModalOpen] = useState(false);
  const [isLegalModalOpen, setIsLegalModalOpen] = useState(false);

  // Citizen Incidents state
  const [incidents, setIncidents] = useState<CitizenIncident[]>(INITIAL_CITIZEN_INCIDENTS);

  // Load telemetry data on initial mount
  const fetchData = async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const bundle = await loadAllLakeWatchData();
      setData(bundle);

      // Default to highest urgency site (Pallikaranai) or first site
      if (bundle.scores.length > 0) {
        const sorted = [...bundle.scores].sort(
          (a, b) => b.urgency_score - a.urgency_score
        );
        setSelectedSiteId(sorted[0].site_id);
      } else if (bundle.sites.features.length > 0) {
        setSelectedSiteId(bundle.sites.features[0].properties.id);
      }
    } catch (err: any) {
      console.error('Failed to load LakeWatch data:', err);
      setLoadError(err?.message || 'Failed to load telemetry and geojson datasets.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddIncident = (newIncident: CitizenIncident) => {
    setIncidents((prev) => [newIncident, ...prev]);
  };

  // Currently selected site feature
  const selectedSiteFeature = useMemo(() => {
    if (!data) return undefined;
    return data.sites.features.find(
      (f) => f.properties.id === selectedSiteId
    );
  }, [data, selectedSiteId]);

  // Currently selected site score
  const selectedSiteScore = useMemo(() => {
    if (!data) return undefined;
    return data.scores.find((s) => s.site_id === selectedSiteId);
  }, [data, selectedSiteId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#120e14] flex flex-col items-center justify-center text-[#f7e8db] p-4 font-sans">
        <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-[#120e14] via-[#4b263f] to-[#eed3ba] flex items-center justify-center mb-5 shadow-2xl shadow-[#4b263f]/60 animate-pulse border border-[#eed3ba]/40">
          <Loader2 className="w-8 h-8 animate-spin text-[#eed3ba]" />
        </div>
        <h2 className="text-2xl font-display font-extrabold tracking-tight text-white">
          Initializing LakeWatch Chennai
        </h2>
        <p className="text-xs text-[#eed3ba] font-mono mt-2">
          Loading Sentinel-2 Multi-spectral Geometries &bull; Dynamic World
        </p>
      </div>
    );
  }

  if (loadError || !data) {
    return (
      <div className="min-h-screen bg-[#120e14] flex flex-col items-center justify-center p-4 font-sans">
        <div className="max-w-md w-full bg-[#18111a] rounded-2xl shadow-2xl border border-rose-500/40 p-6 text-center text-[#f7e8db]">
          <div className="w-12 h-12 rounded-full bg-rose-950/60 text-rose-300 flex items-center justify-center mx-auto mb-3 border border-rose-500/40">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-display font-bold text-white">Data Connection Interrupted</h2>
          <p className="text-xs text-[#d6b8cc] mt-2">
            {loadError || 'Unable to retrieve water extent datasets.'}
          </p>
          <button
            type="button"
            onClick={fetchData}
            className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#4b263f] to-[#73355f] text-[#eed3ba] font-bold text-xs rounded-xl transition-all shadow-md shadow-[#4b263f]/60 border border-[#eed3ba]/30"
          >
            <RefreshCw className="w-4 h-4" />
            Retry Dataset Sync
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#120e14] text-[#f7e8db] font-sans selection:bg-[#4b263f] selection:text-[#eed3ba]">
      {/* Global Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        meta={data.meta}
        sites={data.sites}
        selectedSiteId={selectedSiteId}
        onSelectSite={(id) => {
          setSelectedSiteId(id);
          setIsSitePanelOpen(true);
        }}
        onOpenCitizenModal={() => setIsCitizenModalOpen(true)}
        onOpenFloodModal={() => setIsFloodModalOpen(true)}
        onOpenLegalModal={() => setIsLegalModalOpen(true)}
      />

      {/* Main Content Areas based on Active Tab */}
      <main className="flex-1">
        {activeTab === 'map' && (
          <MapView
            sites={data.sites}
            scores={data.scores}
            changes={data.changes}
            timeseries={data.timeseries}
            selectedSiteId={selectedSiteId}
            onSelectSite={(id) => {
              setSelectedSiteId(id);
              setIsSitePanelOpen(true);
            }}
            selectedPeriod={selectedPeriod}
            onChangePeriod={setSelectedPeriod}
            onOpenSitePanel={() => setIsSitePanelOpen(true)}
            onOpenCitizenModal={() => setIsCitizenModalOpen(true)}
            onOpenFloodModal={() => setIsFloodModalOpen(true)}
            onOpenLegalModal={() => setIsLegalModalOpen(true)}
            incidents={incidents}
          />
        )}

        {activeTab === 'ranked' && (
          <RankedList
            sites={data.sites}
            scores={data.scores}
            timeseries={data.timeseries}
            selectedSiteId={selectedSiteId}
            onSelectSite={(id) => {
              setSelectedSiteId(id);
              setIsSitePanelOpen(true);
            }}
            onOpenSitePanel={() => setIsSitePanelOpen(true)}
            onOpenFloodModal={() => setIsFloodModalOpen(true)}
            onOpenLegalModal={() => setIsLegalModalOpen(true)}
          />
        )}

        {activeTab === 'methods' && (
          <MethodsAndAccuracy
            validation={data.validation}
            meta={data.meta}
          />
        )}
      </main>

      {/* Slide-over Detailed Site Dossier Drawer */}
      {selectedSiteFeature && (
        <SiteDetailPanel
          isOpen={isSitePanelOpen}
          onClose={() => setIsSitePanelOpen(false)}
          site={selectedSiteFeature}
          score={selectedSiteScore}
          timeseries={data.timeseries}
          changes={data.changes}
          siteNotes={data.siteNotes}
          validation={data.validation}
          selectedPeriod={selectedPeriod}
          onChangePeriod={setSelectedPeriod}
          onOpenFloodModal={() => setIsFloodModalOpen(true)}
          onOpenLegalModal={() => setIsLegalModalOpen(true)}
        />
      )}

      {/* Innovative Feature Modals */}
      <CitizenWatchModal
        isOpen={isCitizenModalOpen}
        onClose={() => setIsCitizenModalOpen(false)}
        incidents={incidents}
        onAddIncident={handleAddIncident}
        sites={data.sites}
        selectedSiteId={selectedSiteId}
      />

      <FloodCapacityModal
        isOpen={isFloodModalOpen}
        onClose={() => setIsFloodModalOpen(false)}
        sites={data.sites}
        scores={data.scores}
        changes={data.changes}
        selectedSiteId={selectedSiteId}
      />

      {selectedSiteFeature && (
        <LegalNoticeModal
          isOpen={isLegalModalOpen}
          onClose={() => setIsLegalModalOpen(false)}
          site={selectedSiteFeature}
          score={selectedSiteScore}
          changes={data.changes}
        />
      )}

      {/* Global Footer */}
      <Footer />
    </div>
  );
}
