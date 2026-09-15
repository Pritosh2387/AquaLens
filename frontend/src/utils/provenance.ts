import { DataProvenance, ProvenanceMetadata } from '../types/provenance';

export const PROVENANCE_CONFIG: Record<DataProvenance, ProvenanceMetadata> = {
  MOCK: {
    type: 'MOCK',
    label: 'Mock',
    badgeBg: 'rgba(148, 163, 184, 0.12)',
    badgeText: '#94a3b8',
    badgeBorder: 'rgba(148, 163, 184, 0.35)',
    indicatorColor: '#94a3b8',
    description: 'Synthetic input scene or fallback mock dataset. Not direct observation.',
  },
  OBSERVED: {
    type: 'OBSERVED',
    label: 'Observed',
    badgeBg: 'rgba(56, 189, 248, 0.15)',
    badgeText: '#38bdf8',
    badgeBorder: 'rgba(56, 189, 248, 0.4)',
    indicatorColor: '#38bdf8',
    description: 'Value derived directly from sensor/AIS input.',
  },
  INFERRED: {
    type: 'INFERRED',
    label: 'Inferred',
    badgeBg: 'rgba(129, 140, 248, 0.12)',
    badgeText: '#a5b4fc',
    badgeBorder: 'rgba(129, 140, 248, 0.35)',
    indicatorColor: '#818cf8',
    description: 'Algorithmic deduction from AIS correlation and backward drift trajectory.',
  },
  SIMULATED: {
    type: 'SIMULATED',
    label: 'Simulated',
    badgeBg: 'rgba(245, 158, 11, 0.12)',
    badgeText: '#fbbf24',
    badgeBorder: 'rgba(245, 158, 11, 0.35)',
    indicatorColor: '#f59e0b',
    description: 'Forward numerical model, Monte Carlo perturbation, and heuristic scoring.',
  },
  FEEDBACK: {
    type: 'FEEDBACK',
    label: 'Feedback',
    badgeBg: 'rgba(16, 185, 129, 0.12)',
    badgeText: '#34d399',
    badgeBorder: 'rgba(16, 185, 129, 0.35)',
    indicatorColor: '#10b981',
    description: 'Empirical comparison between predicted model state and actual satellite observation.',
  },
};

export function getProvenanceConfig(prov?: string): ProvenanceMetadata {
  if (prov && prov.toUpperCase() in PROVENANCE_CONFIG) {
    return PROVENANCE_CONFIG[prov.toUpperCase() as DataProvenance];
  }
  return PROVENANCE_CONFIG.SIMULATED;
}

