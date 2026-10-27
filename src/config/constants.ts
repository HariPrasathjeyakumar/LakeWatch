import { ChangeType, PeriodType } from '../types';

/**
 * Urgency tier thresholds
 * Higher: >= 35
 * Medium: 15-34
 * Lower: < 15
 */
export const TIER_THRESHOLDS = {
  HIGHER_MIN: 35,
  MEDIUM_MIN: 15,
} as const;

export type UrgencyTier = 'Higher' | 'Medium' | 'Lower';

export function getUrgencyTier(score: number): UrgencyTier {
  if (score >= TIER_THRESHOLDS.HIGHER_MIN) return 'Higher';
  if (score >= TIER_THRESHOLDS.MEDIUM_MIN) return 'Medium';
  return 'Lower';
}

/**
 * Velvet Curfew & Almond Hearth Palette Styling
 * Obsidian Ink: #120E14
 * Velvet Curfew: #4B263F
 * Almond Hearth: #EED3BA
 */
export function getTierBadgeStyle(tier: UrgencyTier): {
  bg: string;
  text: string;
  border: string;
  mapColor: string;
  glow: string;
} {
  switch (tier) {
    case 'Higher':
      return {
        bg: 'bg-rose-950/50',
        text: 'text-rose-300 font-bold',
        border: 'border-rose-500/50',
        mapColor: '#e11d48', // rose-600
        glow: 'shadow-[0_0_15px_rgba(225,29,72,0.4)]',
      };
    case 'Medium':
      return {
        bg: 'bg-[#4B263F]/50',
        text: 'text-[#eed3ba] font-bold',
        border: 'border-[#853c6c]',
        mapColor: '#a84386', // Velvet Curfew brightened
        glow: 'shadow-[0_0_15px_rgba(168,67,134,0.4)]',
      };
    case 'Lower':
      return {
        bg: 'bg-[#eed3ba]/15',
        text: 'text-[#eed3ba] font-bold',
        border: 'border-[#eed3ba]/40',
        mapColor: '#eed3ba', // Almond Hearth
        glow: 'shadow-[0_0_15px_rgba(238,211,186,0.35)]',
      };
  }
}

export const PERIOD_OPTIONS: PeriodType[] = [
  '2017-2019',
  '2017-2021',
  '2017-2023',
  '2017-2025',
];

export const CHANGE_TYPE_CONFIG: Record<
  ChangeType,
  {
    label: string;
    color: string;
    badgeBg: string;
    textColor: string;
    borderColor: string;
    description: string;
  }
> = {
  encroachment: {
    label: 'Encroachment',
    color: '#e11d48', // Crimson Red
    badgeBg: 'bg-rose-950/60',
    textColor: 'text-rose-300',
    borderColor: 'border-rose-500/50',
    description: 'Classified built-up loss of wet extent held for two consecutive years',
  },
  seasonal: {
    label: 'Seasonal',
    color: '#eed3ba', // Almond Hearth
    badgeBg: 'bg-[#eed3ba]/15',
    textColor: 'text-[#eed3ba]',
    borderColor: 'border-[#eed3ba]/40',
    description: 'Non-built loss (drying, drought, emergent vegetation shifts)',
  },
  uncertain: {
    label: 'Uncertain',
    color: '#8b6982', // Muted Velvet Curfew Ash
    badgeBg: 'bg-[#2f1b2c]/60',
    textColor: 'text-[#d6b8cc]',
    borderColor: 'border-[#5a2e51]',
    description: 'Boundary or narrow features (<30 m) below definitive classification confidence',
  },
};

/**
 * Citizen incident reporting configuration
 */
export interface CitizenIncident {
  id: string;
  site_id: string;
  site_name: string;
  reported_at: string;
  reporter_type: 'Resident Group' | 'Citizen Watch' | 'NGO Field Volunteer';
  reporter_name: string;
  incident_type: 'Perimeter Bund Breached' | 'Construction Debris Dumping' | 'Unauthorized Earth Filling' | 'Sewage Inflow / Weed Choking';
  severity: 'Critical' | 'Moderate' | 'Advisory';
  lat: number;
  lng: number;
  description: string;
  status: 'Pending Verification' | 'Inspected by WRD' | 'Eviction Notice Drafted';
  evidence_photo_url?: string;
}

export const INITIAL_CITIZEN_INCIDENTS: CitizenIncident[] = [
  {
    id: 'rep-amb-01',
    site_id: 'ambattur',
    site_name: 'Ambattur Lake',
    reported_at: '2026-10-18',
    reporter_type: 'Resident Group',
    reporter_name: 'Ambattur Waterbody Protection Society',
    incident_type: 'Construction Debris Dumping',
    severity: 'Critical',
    lat: 13.1118,
    lng: 80.1554,
    description: 'Commercial debris trucks spotted dumping foundation rubble near the northwest industrial sector bypass bund.',
    status: 'Inspected by WRD',
  },
  {
    id: 'rep-pal-02',
    site_id: 'pallikaranai',
    site_name: 'Pallikaranai Marsh',
    reported_at: '2026-10-22',
    reporter_type: 'NGO Field Volunteer',
    reporter_name: 'Care Earth Field Volunteer',
    incident_type: 'Unauthorized Earth Filling',
    severity: 'Critical',
    lat: 12.9341,
    lng: 80.2173,
    description: 'Encroaching fill of marsh buffer adjacent to Velachery-Tambaram main link road; soil mound advancing 15 meters inwards.',
    status: 'Eviction Notice Drafted',
  },
  {
    id: 'rep-por-03',
    site_id: 'porur',
    site_name: 'Porur Lake',
    reported_at: '2026-10-25',
    reporter_type: 'Citizen Watch',
    reporter_name: 'Porur Residents Welfare Forum',
    incident_type: 'Perimeter Bund Breached',
    severity: 'Moderate',
    lat: 13.0332,
    lng: 80.1472,
    description: 'Southern culvert edge breached by temporary equipment access road during pipeline laying; bund not reinstated.',
    status: 'Pending Verification',
  },
];
