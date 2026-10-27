export interface SiteProperties {
  id: string; // 'porur' | 'chembarambakkam' | 'ambattur' | 'puzhal' | 'pallikaranai'
  name: string;
  district?: string;
}

export interface SiteFeature {
  type: 'Feature';
  geometry: {
    type: 'Polygon' | 'MultiPolygon';
    coordinates: any;
  };
  properties: SiteProperties;
}

export interface SitesGeoJSON {
  type: 'FeatureCollection';
  features: SiteFeature[];
}

export interface TimeseriesRow {
  site_id: string;
  year: number;
  water_ha_peak: number;
  water_ha_dry: number;
  open_water_ha_peak: number;
  open_water_ha_dry: number;
  n_peak_scenes: number;
  n_dry_scenes: number;
}

export interface ScoreRow {
  site_id: string;
  urgency_score: number; // 0-100
  loss_pct_since_2017: number;
  loss_rate_last3y_ha_per_year: number;
  built_pct_within_500m: number;
  built_growth_pp_500m: number;
}

export type PeriodType = '2017-2019' | '2017-2021' | '2017-2023' | '2017-2025';

export type ChangeType = 'encroachment' | 'seasonal' | 'uncertain';

export interface ChangeProperties {
  site_id: string;
  period: PeriodType;
  change_type: ChangeType;
  area_ha: number;
  confidence: number;
}

export interface ChangeFeature {
  type: 'Feature';
  geometry: {
    type: 'Polygon' | 'MultiPolygon';
    coordinates: any;
  };
  properties: ChangeProperties;
}

export interface ChangesGeoJSON {
  type: 'FeatureCollection';
  features: ChangeFeature[];
}

export interface SeasonalReview {
  n_reviewed: number | null;
  vegetation: number | null;
  built_or_filled: number | null;
  other: number | null;
}

export interface ValidationData {
  iou: number | null;
  precision: number | null;
  recall: number | null;
  n_validation_points?: number | null;
  n_validation_polygons?: number | null;
  encroachment_precision: number | null;
  n_encroachment_points: number | null;
  seasonal_review?: SeasonalReview | null;
}

export interface MetaData {
  mock: boolean;
  validated?: boolean;
  generated?: string;
  years?: number[];
  method?: string;
  limitations?: string[];
}

export type SiteNotes = Record<string, string>;

export interface SiteChangeAreas {
  encroachment_ha: number;
  seasonal_ha: number;
  uncertain_ha: number;
  total_loss_ha: number;
}
