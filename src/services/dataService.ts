import {
  ChangesGeoJSON,
  MetaData,
  PeriodType,
  ScoreRow,
  SiteChangeAreas,
  SiteNotes,
  SitesGeoJSON,
  TimeseriesRow,
  ValidationData,
} from '../types';

let cachedChanges: ChangesGeoJSON | null = null;

async function fetchJsonWithFallback<T>(filename: string): Promise<T> {
  const candidateUrls = [
    `/data/${filename}`,
    `/public/data/${filename}`,
    `/${filename}`,
  ];

  for (const url of candidateUrls) {
    try {
      const res = await fetch(url);
      if (res.ok) {
        return (await res.json()) as T;
      }
    } catch {
      // try next candidate
    }
  }

  throw new Error(`Failed to load ${filename} across all candidate paths`);
}

export async function fetchSites(): Promise<SitesGeoJSON> {
  return fetchJsonWithFallback<SitesGeoJSON>('sites.geojson');
}

export async function fetchTimeseries(): Promise<TimeseriesRow[]> {
  const data = await fetchJsonWithFallback<TimeseriesRow[]>('timeseries.json');
  return Array.isArray(data) ? data : [];
}

export async function fetchScores(): Promise<ScoreRow[]> {
  const data = await fetchJsonWithFallback<ScoreRow[]>('scores.json');
  return Array.isArray(data) ? data : [];
}

export async function fetchChanges(): Promise<ChangesGeoJSON> {
  if (cachedChanges) return cachedChanges;
  const data = await fetchJsonWithFallback<ChangesGeoJSON>('changes.geojson');
  cachedChanges = data;
  return data;
}

export async function fetchValidation(): Promise<ValidationData> {
  return fetchJsonWithFallback<ValidationData>('validation.json');
}

export async function fetchMeta(): Promise<MetaData> {
  return fetchJsonWithFallback<MetaData>('meta.json');
}

export async function fetchSiteNotes(): Promise<SiteNotes> {
  return fetchJsonWithFallback<SiteNotes>('site_notes.json');
}

export interface AppDataBundle {
  sites: SitesGeoJSON;
  timeseries: TimeseriesRow[];
  scores: ScoreRow[];
  changes: ChangesGeoJSON;
  validation: ValidationData;
  meta: MetaData;
  siteNotes: SiteNotes;
}

export async function loadAllLakeWatchData(): Promise<AppDataBundle> {
  const [sites, timeseries, scores, changes, validation, meta, siteNotes] =
    await Promise.all([
      fetchSites(),
      fetchTimeseries(),
      fetchScores(),
      fetchChanges(),
      fetchValidation(),
      fetchMeta(),
      fetchSiteNotes(),
    ]);

  return {
    sites,
    timeseries,
    scores,
    changes,
    validation,
    meta,
    siteNotes,
  };
}

/**
 * Computes area by change_type for a given site and period directly from changes.geojson
 */
export function computeSiteChangeAreas(
  changes: ChangesGeoJSON,
  siteId: string,
  period: PeriodType
): SiteChangeAreas {
  let encroachment_ha = 0;
  let seasonal_ha = 0;
  let uncertain_ha = 0;

  if (changes && Array.isArray(changes.features)) {
    for (const feature of changes.features) {
      const p = feature.properties;
      if (p.site_id === siteId && p.period === period) {
        const area = Number(p.area_ha) || 0;
        if (p.change_type === 'encroachment') {
          encroachment_ha += area;
        } else if (p.change_type === 'seasonal') {
          seasonal_ha += area;
        } else if (p.change_type === 'uncertain') {
          uncertain_ha += area;
        }
      }
    }
  }

  // Round to 2 decimal places
  encroachment_ha = Math.round(encroachment_ha * 100) / 100;
  seasonal_ha = Math.round(seasonal_ha * 100) / 100;
  uncertain_ha = Math.round(uncertain_ha * 100) / 100;
  const total_loss_ha =
    Math.round((encroachment_ha + seasonal_ha + uncertain_ha) * 100) / 100;

  return {
    encroachment_ha,
    seasonal_ha,
    uncertain_ha,
    total_loss_ha,
  };
}
