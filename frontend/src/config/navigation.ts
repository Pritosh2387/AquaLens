import {
  Compass,
  Radio,
  History,
  Ship,
  Wind,
  CheckCircle2,
  AlertTriangle,
  Boxes,
  Sliders,
  FileCheck2,
  LucideIcon
} from 'lucide-react';

export interface NavigationItem {
  id: string;
  name: string;
  path: string;
  moduleRange: string;
  icon: LucideIcon;
  badge?: string;
  description: string;
}

export const NAVIGATION_ITEMS: NavigationItem[] = [
  {
    id: 'overview',
    name: 'Overview',
    path: '/overview',
    moduleRange: 'M1-M17',
    icon: Compass,
    description: 'Maritime intelligence command dashboard & live operational state',
  },
  {
    id: 'detection',
    name: 'Spill Detection',
    path: '/detection',
    moduleRange: 'M1-M5',
    icon: Radio,
    description: 'SAR segmentation, optical fusion, confidence & look-alike verification',
  },
  {
    id: 'hindcast',
    name: 'Origin & Hindcast',
    path: '/hindcast',
    moduleRange: 'M7',
    icon: History,
    description: 'Reverse particle drift trajectory & spill origin probability contours',
  },
  {
    id: 'attribution',
    name: 'Vessel Attribution',
    path: '/attribution',
    moduleRange: 'M6, M8',
    icon: Ship,
    description: 'AIS track correlation, dark vessel anomaly flags & candidate ranking',
  },
  {
    id: 'forecast',
    name: 'Forecast',
    path: '/forecast',
    moduleRange: 'M9',
    icon: Wind,
    description: 'Forward drift simulation across 6h, 12h, 24h, 48h, and 72h horizons',
  },
  {
    id: 'feedback',
    name: 'Prediction vs Reality',
    path: '/feedback',
    moduleRange: 'M15',
    icon: CheckCircle2,
    description: 'Ground truth calibration: polygon IoU, centroid drift & recalibration factor',
  },
  {
    id: 'impact',
    name: 'Impact & Uncertainty',
    path: '/impact',
    moduleRange: 'M10-M12',
    icon: AlertTriangle,
    description: 'Monte Carlo perturbation, coastal asset vulnerability & priority score',
  },
  {
    id: 'resources',
    name: 'Resource Planner',
    path: '/resources',
    moduleRange: 'M13',
    icon: Boxes,
    description: 'Containment fleet allocation: skimmers, booms, aircraft & patrol craft',
  },
  {
    id: 'whatif',
    name: 'What-If Simulator',
    path: '/whatif',
    moduleRange: 'M14',
    icon: Sliders,
    description: 'Interactive counterfactual response testing: delays vs surge resources',
  },
  {
    id: 'evidence',
    name: 'Evidence & Recommendations',
    path: '/evidence',
    moduleRange: 'M16-M17',
    icon: FileCheck2,
    description: 'Directed evidence graph, natural-language explainability, decision support & situation reports',
  },
];
