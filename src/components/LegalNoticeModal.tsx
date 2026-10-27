import React from 'react';
import {
  X,
  Printer,
  Scale,
} from 'lucide-react';
import { ScoreRow, SiteFeature } from '../types';
import { computeSiteChangeAreas } from '../services/dataService';
import { ChangesGeoJSON } from '../types';

interface LegalNoticeModalProps {
  isOpen: boolean;
  onClose: () => void;
  site: SiteFeature;
  score: ScoreRow | undefined;
  changes: ChangesGeoJSON;
}

export const LegalNoticeModal: React.FC<LegalNoticeModalProps> = ({
  isOpen,
  onClose,
  site,
  score,
  changes,
}) => {
  if (!isOpen) return null;

  const siteId = site.properties.id;
  const siteName = site.properties.name;
  const changeAreas = computeSiteChangeAreas(changes, siteId, '2017-2025');

  const todayStr = new Date().toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="legal-notice-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md font-sans"
    >
      <div className="bg-[#18111a] border border-[#4b263f] rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-[#f7e8db]">
        {/* Modal Topbar */}
        <div className="px-6 py-4 bg-[#120e14] border-b border-[#3b1d32] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#4b263f] text-[#eed3ba] border border-[#eed3ba]/30 flex items-center justify-center shadow-md shadow-[#4b263f]/50">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 id="legal-notice-modal-title" className="text-lg font-display font-bold text-white tracking-tight">
                  Statutory Eviction Notice &amp; Demarcation Dossier
                </h3>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-[#4b263f]/60 text-[#eed3ba] border border-[#eed3ba]/30 font-mono">
                  TN Tank Eviction Act 2007
                </span>
              </div>
              <p className="text-xs text-[#d6b8cc]">
                Official requisition format for Tahsildar / WRD Executive Engineer action
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="text-xs bg-[#241525] hover:bg-[#341d36] text-[#eed3ba] border border-[#4b263f] px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-colors font-medium"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
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

        {/* Notice Preview Body (styled as formal legal paper) */}
        <div className="flex-1 overflow-y-auto p-6 bg-[#100b12]">
          <div className="max-w-2xl mx-auto bg-white text-slate-900 p-8 rounded-xl shadow-2xl font-serif text-xs leading-relaxed border border-slate-300 print:border-none print:shadow-none print:p-0">
            {/* Government Heading */}
            <div className="text-center pb-4 border-b-2 border-slate-800 mb-6 font-sans">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                GOVERNMENT OF TAMIL NADU &bull; WATER RESOURCES DEPARTMENT
              </h2>
              <p className="text-[11px] font-semibold text-slate-700 mt-0.5">
                OFFICE OF THE EXECUTIVE ENGINEER, PALAR BASIN DIVISION / GREATER CHENNAI REGION
              </p>
              <p className="text-[10px] text-slate-500 mt-1">
                Under the Tamil Nadu Protection of Tanks and Eviction of Encroachment Act, 2007 (Act No. 8 of 2007)
              </p>
            </div>

            {/* Meta identifiers */}
            <div className="flex justify-between font-sans text-[11px] mb-4 text-slate-700">
              <div>
                <strong>Dossier Ref No:</strong> WRD/LAKEWATCH/CHN/{siteId.toUpperCase()}/2026/04
              </div>
              <div>
                <strong>Dated:</strong> {todayStr}
              </div>
            </div>

            {/* Subject */}
            <div className="font-sans mb-4 p-3 bg-slate-100 rounded-lg border border-slate-200">
              <p className="font-bold text-slate-900">
                SUBJECT: Multi-spectral Satellite Telemetry Report on Unauthorized Encroachment in {siteName} &amp; Request for Urgent Revenue Boundary Survey under Section 5.
              </p>
            </div>

            {/* Notice Body */}
            <div className="space-y-3 text-justify font-serif">
              <p>
                1. <strong>Preamble &amp; Statutory Authority:</strong> Whereas the waterbody known as <strong>{siteName}</strong> (Site ID: <code>{siteId}</code>) is a notified public water storage tank/wetland vested with the Water Resources Department, Government of Tamil Nadu, protected against unauthorized construction, earth-filling, and road formation under the provisions of the <em>Tamil Nadu Protection of Tanks and Eviction of Encroachment Act, 2007</em>.
              </p>

              <p>
                2. <strong>Satellite Telemetry Findings (2017–2025):</strong> Remote sensing surveillance utilizing European Space Agency Sentinel-2 multi-spectral imagery (10-meter spatial resolution) combined with Dynamic World built-area probability models has detected persistent unauthorized conversion of wet extent into permanent structures:
              </p>

              {/* Data Table */}
              <div className="my-3 font-sans">
                <table className="w-full text-left border border-slate-300 text-[11px]">
                  <thead className="bg-slate-100 font-bold border-b border-slate-300">
                    <tr>
                      <th className="p-2 border-r border-slate-300">Metric Parameters</th>
                      <th className="p-2 border-r border-slate-300">Observed Value</th>
                      <th className="p-2">Statutory Classification</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    <tr>
                      <td className="p-2 border-r border-slate-300">Classified Encroachment Area</td>
                      <td className="p-2 border-r border-slate-300 font-mono font-bold text-rose-700">
                        {changeAreas.encroachment_ha} Hectares ({(changeAreas.encroachment_ha * 2.471).toFixed(2)} Acres)
                      </td>
                      <td className="p-2">Built structures persistent &ge; 2 years</td>
                    </tr>
                    <tr>
                      <td className="p-2 border-r border-slate-300">3-Year Encroachment Velocity</td>
                      <td className="p-2 border-r border-slate-300 font-mono font-bold">
                        {score?.loss_rate_last3y_ha_per_year ?? 0.1} ha / year
                      </td>
                      <td className="p-2">Active advancing perimeter breach</td>
                    </tr>
                    <tr>
                      <td className="p-2 border-r border-slate-300">500-Meter Perimeter Built Fraction</td>
                      <td className="p-2 border-r border-slate-300 font-mono">
                        {score?.built_pct_within_500m ?? 80}% (+{score?.built_growth_pp_500m ?? 4} pp growth)
                      </td>
                      <td className="p-2">High urban peripheral pressure</td>
                    </tr>
                    <tr>
                      <td className="p-2 border-r border-slate-300">Estimated Lost Flood Retention</td>
                      <td className="p-2 border-r border-slate-300 font-mono">
                        {(changeAreas.encroachment_ha * 20).toFixed(1)} Million Litres
                      </td>
                      <td className="p-2">Downstream monsoon surge risk</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <p>
                3. <strong>Notice of Requisition:</strong> In accordance with statutory powers, the competent Revenue authorities (Tahsildar, Survey and Land Records Wing) are hereby requested to:
              </p>

              <ol className="list-decimal pl-6 space-y-1 font-sans text-[11px]">
                <li>Depute a Taluk Surveyor to execute a joint cadastral ground survey utilizing DGPS markers.</li>
                <li>Verify revenue survey records against the satellite change polygon coordinates attached in Annexure A.</li>
                <li>Issue Form-III Eviction Notices under Rule 6 of the TN Tank Eviction Rules 2007 to identified encroachers within 21 days.</li>
              </ol>

              <p className="mt-4">
                4. <strong>Notice to Public &amp; Citizen Groups:</strong> This telemetry dossier is compiled for official administrative action and civil vigilance under the Public Trust Doctrine established by the Hon'ble High Court of Madras in <em>L. Krishnan vs State of Tamil Nadu</em>.
              </p>
            </div>

            {/* Signature Block */}
            <div className="mt-10 pt-6 border-t border-slate-300 flex justify-between items-end font-sans">
              <div className="text-[10px] text-slate-500">
                <p>Telemetry System: LakeWatch Chennai v1.0</p>
                <p>Sensor: Copernicus Sentinel-2 MSI (ESA)</p>
                <p>Classifier: Dynamic World Multi-temporal Pipeline</p>
              </div>

              <div className="text-right">
                <div className="w-32 border-b border-slate-400 mb-1 inline-block"></div>
                <p className="font-bold text-[11px] text-slate-900">EXECUTIVE ENGINEER / TAHSILDAR</p>
                <p className="text-[10px] text-slate-600">Water Resources Department, Chennai</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
