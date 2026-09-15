import { createBrowserRouter, Navigate } from 'react-router-dom';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { LandingPage } from '../pages/LandingPage';
import { OverviewPage } from '../pages/OverviewPage';
import { DetectionPage } from '../pages/DetectionPage';
import { HindcastPage } from '../pages/HindcastPage';
import { AttributionPage } from '../pages/AttributionPage';
import { ForecastPage } from '../pages/ForecastPage';
import { FeedbackPage } from '../pages/FeedbackPage';
import { ImpactPage } from '../pages/ImpactPage';
import { ResourcesPage } from '../pages/ResourcesPage';
import { WhatIfPage } from '../pages/WhatIfPage';
import { EvidencePage } from '../pages/EvidencePage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <LandingPage />,
  },
  {
    element: <DashboardLayout />,
    children: [
      { path: 'overview', element: <OverviewPage /> },
      { path: 'detection', element: <DetectionPage /> },
      { path: 'hindcast', element: <HindcastPage /> },
      { path: 'attribution', element: <AttributionPage /> },
      { path: 'forecast', element: <ForecastPage /> },
      { path: 'feedback', element: <FeedbackPage /> },
      { path: 'impact', element: <ImpactPage /> },
      { path: 'resources', element: <ResourcesPage /> },
      { path: 'whatif', element: <WhatIfPage /> },
      { path: 'evidence', element: <EvidencePage /> },
      { path: '*', element: <Navigate to="/overview" replace /> },
    ],
  },
]);
