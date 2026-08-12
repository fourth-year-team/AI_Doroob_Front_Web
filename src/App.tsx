import { HashRouter, Route, Routes } from 'react-router-dom';
import { ThemeProvider } from './theme/ThemeProvider';
import { I18nProvider } from './i18n';
import { DataProvider } from './state/DataContext';
import { AppLayout } from './components/layout/AppLayout';
import { DashboardPage } from './pages/DashboardPage';
import { ResultsPage } from './pages/ResultsPage';
import { SummaryPage } from './pages/SummaryPage';

export default function App() {
  return (
    <ThemeProvider>
      <I18nProvider>
        <DataProvider>
          <HashRouter>
            <Routes>
              <Route element={<AppLayout />}>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/results/:sessionId" element={<ResultsPage />} />
                <Route path="/summary" element={<SummaryPage />} />
              </Route>
            </Routes>
          </HashRouter>
        </DataProvider>
      </I18nProvider>
    </ThemeProvider>
  );
}
