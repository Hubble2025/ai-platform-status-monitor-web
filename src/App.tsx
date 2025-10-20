import { useState, lazy, Suspense } from 'react';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { StatusChecker } from './components/StatusChecker';
import { InstallPrompt } from './components/InstallPrompt';
import { useProviders } from './hooks/useProviders';
import { useTheme } from './contexts/ThemeContext';

const ProviderDetail = lazy(() => import('./components/ProviderDetail').then(m => ({ default: m.ProviderDetail })));
const ProviderComparison = lazy(() => import('./components/ProviderComparison').then(m => ({ default: m.ProviderComparison })));
const ReliabilityDashboard = lazy(() => import('./components/ReliabilityDashboard').then(m => ({ default: m.ReliabilityDashboard })));
const AdvancedSearch = lazy(() => import('./components/AdvancedSearch').then(m => ({ default: m.AdvancedSearch })));
const SettingsPanel = lazy(() => import('./components/SettingsPanel').then(m => ({ default: m.SettingsPanel })));
const Changelog = lazy(() => import('./components/Changelog').then(m => ({ default: m.Changelog })));
const Impressum = lazy(() => import('./components/Impressum').then(m => ({ default: m.Impressum })));

type View =
  | { type: 'dashboard' }
  | { type: 'provider'; slug: string }
  | { type: 'comparison' }
  | { type: 'reliability' }
  | { type: 'search' }
  | { type: 'changelog' }
  | { type: 'impressum' };

function App() {
  const [view, setView] = useState<View>({ type: 'dashboard' });
  const [showSettings, setShowSettings] = useState(false);
  const { providers } = useProviders();
  const { theme } = useTheme();

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-black text-white' : 'bg-gray-50 text-gray-900'}`}>
      <Header
        onSettingsClick={() => setShowSettings(true)}
        onChangelogClick={() => setView({ type: 'changelog' })}
        onImpressumClick={() => setView({ type: 'impressum' })}
        onComparisonClick={() => setView({ type: 'comparison' })}
        onReliabilityClick={() => setView({ type: 'reliability' })}
        onSearchClick={() => setView({ type: 'search' })}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-safe">
        <Suspense fallback={
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        }>
          {view.type === 'dashboard' ? (
            <Dashboard onProviderClick={(slug) => setView({ type: 'provider', slug })} />
          ) : view.type === 'comparison' ? (
            <ProviderComparison onBack={() => setView({ type: 'dashboard' })} providers={providers} />
          ) : view.type === 'reliability' ? (
            <ReliabilityDashboard onBack={() => setView({ type: 'dashboard' })} providers={providers} />
          ) : view.type === 'search' ? (
            <AdvancedSearch onBack={() => setView({ type: 'dashboard' })} providers={providers} />
          ) : view.type === 'changelog' ? (
            <Changelog onBack={() => setView({ type: 'dashboard' })} />
          ) : view.type === 'impressum' ? (
            <Impressum onBack={() => setView({ type: 'dashboard' })} />
          ) : (
            <ProviderDetail
              slug={view.slug}
              onBack={() => setView({ type: 'dashboard' })}
            />
          )}
        </Suspense>
      </main>

      {showSettings && (
        <Suspense fallback={null}>
          <SettingsPanel
            providers={providers}
            onClose={() => setShowSettings(false)}
          />
        </Suspense>
      )}

      <StatusChecker />
      <InstallPrompt />
    </div>
  );
}

export default App;
