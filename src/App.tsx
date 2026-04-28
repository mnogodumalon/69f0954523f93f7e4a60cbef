import '@/lib/sentry';
import { lazy, Suspense } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { ActionsProvider } from '@/context/ActionsContext';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ErrorBusProvider } from '@/components/ErrorBus';
import { Layout } from '@/components/Layout';
import DashboardOverview from '@/pages/DashboardOverview';
import AdminPage from '@/pages/AdminPage';
import StammdatenPage from '@/pages/StammdatenPage';
import AngebotePage from '@/pages/AngebotePage';
import PublicFormStammdaten from '@/pages/public/PublicForm_Stammdaten';
import PublicFormAngebote from '@/pages/public/PublicForm_Angebote';
// <public:imports>
// </public:imports>
// <custom:imports>
// </custom:imports>

export default function App() {
  return (
    <ErrorBoundary>
      <ErrorBusProvider>
        <HashRouter>
          <ActionsProvider>
            <Routes>
              <Route path="public/69f09533f5e14e96e1b508da" element={<PublicFormStammdaten />} />
              <Route path="public/69f09536915bd5d46dd0c8c5" element={<PublicFormAngebote />} />
              {/* <public:routes> */}
              {/* </public:routes> */}
              <Route element={<Layout />}>
                <Route index element={<DashboardOverview />} />
                <Route path="stammdaten" element={<StammdatenPage />} />
                <Route path="angebote" element={<AngebotePage />} />
                <Route path="admin" element={<AdminPage />} />
                {/* <custom:routes> */}
                {/* </custom:routes> */}
              </Route>
            </Routes>
          </ActionsProvider>
        </HashRouter>
      </ErrorBusProvider>
    </ErrorBoundary>
  );
}
