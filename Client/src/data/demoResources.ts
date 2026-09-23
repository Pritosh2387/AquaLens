/**
 * AquaLens Demo Resources & What-If Data — AQL-047
 */

export const DEMO_AVAILABLE_RESOURCES = {
  skimmers: 3,
  booms: 5,
  responseShips: 2,
  helicopters: 1,
  chemicalDispersal: 2,
  divingTeams: 1,
};

export const DEMO_REQUIRED_RESOURCES = {
  skimmers: 2,
  booms: 3,
  responseShips: 1,
  helicopters: 0,
  chemicalDispersal: 1,
  divingTeams: 0,
};

export const DEMO_OPTIMAL_PLAN = {
  id: 'PLAN-AQL-047-OPT',
  generatedAt: '2026-09-15 03:48 UTC',
  estimatedRecovery: '72%',
  estimatedCoverage: '81%',
  priorityScore: 8.7,
  deploymentWindow: '< 6 hours',
  zones: [
    {
      id: 'R-1',
      name: 'Response Zone R-1 (Primary)',
      lat: 15.790,
      lon: 68.750,
      resources: '2 Skimmers + 2 Booms',
      priority: 'PRIMARY',
      expectedContainment: '58%',
    },
    {
      id: 'R-2',
      name: 'Response Zone R-2 (Intercept)',
      lat: 15.768,
      lon: 68.773,
      resources: '1 Boom',
      priority: 'SECONDARY',
      expectedContainment: '14%',
    },
  ],
  unallocated: {
    skimmers: 1,
    booms: 2,
    responseShips: 1,
    helicopters: 1,
    chemicalDispersal: 1,
  },
};

export interface WhatIfScenario {
  id: string;
  label: string;
  description: string;
  impactPct: number;
  recoveryPct: number;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  resources: string;
  cost: string;
  etaHours: number;
}

export const DEMO_WHATIF_SCENARIOS: WhatIfScenario[] = [
  {
    id: 'current',
    label: 'Current Plan',
    description: 'Optimal allocation: 2 skimmers, 3 booms, 1 response ship.',
    impactPct: 72,
    recoveryPct: 81,
    priority: 'HIGH',
    resources: '2 Skimmers, 3 Booms, 1 Ship',
    cost: '₹ 1.2 Cr',
    etaHours: 5.5,
  },
  {
    id: 'plus_skimmers',
    label: '+2 Skimmers',
    description: 'Add 2 additional skimmers to the primary response zone.',
    impactPct: 54,
    recoveryPct: 91,
    priority: 'MEDIUM',
    resources: '4 Skimmers, 3 Booms, 1 Ship',
    cost: '₹ 1.8 Cr',
    etaHours: 5.5,
  },
  {
    id: 'plus_booms',
    label: '+2 Booms',
    description: 'Deploy additional boom lines to intercept southern drift.',
    impactPct: 62,
    recoveryPct: 86,
    priority: 'HIGH',
    resources: '2 Skimmers, 5 Booms, 1 Ship',
    cost: '₹ 1.4 Cr',
    etaHours: 6.0,
  },
  {
    id: 'delay_6h',
    label: '6h Response Delay',
    description: 'Simulate delayed response deployment by 6 hours.',
    impactPct: 88,
    recoveryPct: 63,
    priority: 'CRITICAL',
    resources: '2 Skimmers, 3 Booms, 1 Ship',
    cost: '₹ 1.2 Cr',
    etaHours: 11.5,
  },
  {
    id: 'no_resources',
    label: 'No Additional Resources',
    description: 'Natural attenuation only. No physical containment deployed.',
    impactPct: 96,
    recoveryPct: 28,
    priority: 'CRITICAL',
    resources: 'None',
    cost: '₹ 0',
    etaHours: 0,
  },
  {
    id: 'alternative',
    label: 'Alternative Allocation',
    description: 'Chemical dispersal + 1 skimmer focus on core zone only.',
    impactPct: 68,
    recoveryPct: 74,
    priority: 'HIGH',
    resources: '1 Skimmer, 2 Booms, 2 Dispersal Units',
    cost: '₹ 0.9 Cr',
    etaHours: 4.5,
  },
];
