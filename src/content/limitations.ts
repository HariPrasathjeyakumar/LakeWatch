export interface LimitationItem {
  id: string;
  letter: string;
  title: string;
  description: string;
}

export const KNOWN_LIMITATIONS: LimitationItem[] = [
  {
    id: 'sample-size',
    letter: 'a',
    title: 'Hand-labelled Validation Sample',
    description:
      'Accuracy uses a small hand-labelled sample (50 water and 50 land points plus 26 reviewed encroachment patches), labelled by the author from current imagery, so it is not independent ground truth.',
  },
  {
    id: 'pallikaranai-resolution',
    letter: 'b',
    title: 'Resolution Limits at Pallikaranai Marsh',
    description:
      'Pallikaranai is a marsh with channels and strips narrower than a 10 m pixel, and the water mask detected only 4 of 10 labelled water points there. Water-extent trends and the seasonal class are therefore less reliable at this site.',
  },
  {
    id: 'seasonal-definition',
    letter: 'c',
    title: 'Definition of "Seasonal" Changes',
    description:
      '"Seasonal" means loss that did not become built-up (such as drying, drought, or vegetation changes), not proven astronomical or cyclical seasonality.',
  },
  {
    id: 'baseline-cutoff',
    letter: 'd',
    title: '2017–2018 Baseline Window',
    description:
      'The 2017–2018 baseline means earlier encroachment that occurred prior to 2017 is not detected or reflected in the change polygons.',
  },
  {
    id: 'vegetation-checks',
    letter: 'e',
    title: 'Review of Large Seasonal Patches',
    description:
      'The largest 8 seasonal patches were checked individually, and all 8 were confirmed to be vegetation shifts rather than built structures.',
  },
];

export const METHOD_EXPLANATION = {
  title: 'How Seasonal Change is Separated from Encroachment',
  steps: [
    {
      step: 1,
      title: 'Same-Season Cloud-Masked Composites',
      detail:
        'Observations are compared strictly within the same hydrological periods (peak monsoon and dry season) across years, eliminating standard within-year water level fluctuations.',
    },
    {
      step: 2,
      title: 'Two-Consecutive-Year Persistence Rule',
      detail:
        'A loss is only counted if the baseline peak wet extent is absent in both seasons for two consecutive calendar years. Temporary single-year droughts are thus filtered out.',
    },
    {
      step: 3,
      title: 'Built-Area Probability Classification',
      detail:
        'Persistent losses are cross-referenced with Dynamic World built-area probabilities. Areas transitioned into permanent built structures are classified as encroachment; areas retaining soil/vegetation characteristics without structures are marked as seasonal.',
    },
  ],
};
