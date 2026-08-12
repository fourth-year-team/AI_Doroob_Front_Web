import { Outlet, useLocation } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { Footer } from './Footer';

export function AppLayout() {
  const location = useLocation();
  const isResults = location.pathname.startsWith('/results');

  return (
    <div className="app-shell">
      <Header />
      <main className="app-main">
        <div className={isResults ? 'app-content app-content--full' : 'app-content'}>
          <div style={{ minWidth: 0 }}>
            <Outlet />
          </div>
          {!isResults && <Sidebar />}
        </div>
      </main>
      <Footer />
    </div>
  );
}
