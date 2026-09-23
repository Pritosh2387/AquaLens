/**
 * AquaLens Demo Impact Data — AQL-047
 * Environmental, economic, and population impact assessment.
 */

export interface ImpactAsset {
  name: string;
  lat: number;
  lon: number;
  type: string;
  riskScore: number;
  impactProbability: number;
  etaHours: number;
  sensitivity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  description: string;
}

export const DEMO_IMPACT_ASSETS: ImpactAsset[] = [
  {
    name: 'Lakshadweep MPA',
    lat: 15.58,
    lon: 68.91,
    type: 'Marine Protected Area',
    riskScore: 0.84,
    impactProbability: 0.78,
    etaHours: 22,
    sensitivity: 'CRITICAL',
    description:
      'UNESCO-recognized marine protected area. Coral reef ecosystem. Extremely sensitive to oil contamination.',
  },
  {
    name: 'Coastal Fisheries Zone',
    lat: 15.70,
    lon: 68.86,
    type: 'Fisheries Zone',
    riskScore: 0.71,
    impactProbability: 0.63,
    etaHours: 16,
    sensitivity: 'HIGH',
    description:
      'Primary fishing ground supporting 12,000+ local fishermen. Seasonal spawning zone. Oil exposure would trigger 3-month fishing ban.',
  },
  {
    name: 'Goa North Coast',
    lat: 15.63,
    lon: 68.98,
    type: 'Population Zone',
    riskScore: 0.55,
    impactProbability: 0.41,
    etaHours: 28,
    sensitivity: 'HIGH',
    description:
      'Coastal population of ~45,000. Tourism-dependent economy. Beach contamination would cause significant economic disruption.',
  },
  {
    name: 'Marmagao Port',
    lat: 15.42,
    lon: 69.12,
    type: 'Port / Infrastructure',
    riskScore: 0.48,
    impactProbability: 0.38,
    etaHours: 36,
    sensitivity: 'MEDIUM',
    description:
      'Major commercial port. Potential shipping disruption and port facility contamination risk.',
  },
  {
    name: 'Seabird Breeding Area',
    lat: 15.76,
    lon: 68.78,
    type: 'Ecological Zone',
    riskScore: 0.66,
    impactProbability: 0.58,
    etaHours: 12,
    sensitivity: 'HIGH',
    description:
      'Active breeding colony of greater crested terns and brown noddies. Critical nesting season underway.',
  },
];

export const DEMO_IMPACT_SUMMARY = {
  ecologicalRisk: 0.78,
  fisheriesRisk: 0.63,
  populationRisk: 0.41,
  economicRisk: 0.55,
  overallSeverity: 'HIGH',
  totalAffectedAreaKm2: 183.4,
  estimatedEconomicLossMillion: 4.2,
  populationAtRisk: 45000,
  fisheryBanAreaKm2: 68.2,
};

export const DEMO_RISK_LEVELS = [
  {
    zone: 'Core Impact Zone',
    probability: 0.91,
    severity: 'CRITICAL',
    color: '#dc2626',
    radius: 8,
    label: 'HIGH RISK',
  },
  {
    zone: 'Secondary Impact Zone',
    probability: 0.71,
    severity: 'HIGH',
    color: '#ea580c',
    radius: 16,
    label: 'ELEVATED RISK',
  },
  {
    zone: 'Uncertainty Buffer',
    probability: 0.45,
    severity: 'MEDIUM',
    color: '#d97706',
    radius: 26,
    label: 'POSSIBLE IMPACT',
  },
];
