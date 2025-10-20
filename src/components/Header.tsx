import { useState } from 'react';
import { Activity, Menu, X, FileText, Settings, Info, BarChart3, GitCompare, Search, Compass } from 'lucide-react';
import { ThemeLanguageSwitcher } from './ThemeLanguageSwitcher';
import { useTheme } from '../contexts/ThemeContext';

const APP_VERSION = '1.11';

interface HeaderProps {
  onSettingsClick: () => void;
  onChangelogClick: () => void;
  onImpressumClick: () => void;
  onComparisonClick: () => void;
  onReliabilityClick: () => void;
  onSearchClick: () => void;
  onDiscoveryClick: () => void;
}

export function Header({
  onSettingsClick,
  onChangelogClick,
  onImpressumClick,
  onComparisonClick,
  onReliabilityClick,
  onSearchClick,
  onDiscoveryClick,
}: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { t } = useTheme();

  return (
    <header className="bg-gray-900 border-b border-gray-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-white">{t('app.title')}</h1>
                <span className="px-2 py-0.5 text-xs font-medium bg-blue-900/50 text-blue-400 border border-blue-800 rounded">
                  v{APP_VERSION}
                </span>
              </div>
              <p className="text-sm text-gray-400">{t('app.subtitle')}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <ThemeLanguageSwitcher />
            <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition-colors min-touch-target"
              aria-label="Menu"
              aria-expanded={menuOpen}
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-gray-900 border border-gray-800 rounded-lg shadow-xl overflow-hidden">
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onComparisonClick();
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
                >
                  <GitCompare className="w-4 h-4" />
                  <span>{t('nav.comparison')}</span>
                </button>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onReliabilityClick();
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
                >
                  <BarChart3 className="w-4 h-4" />
                  <span>{t('nav.reliability')}</span>
                </button>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onSearchClick();
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
                >
                  <Search className="w-4 h-4" />
                  <span>{t('nav.search')}</span>
                </button>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onDiscoveryClick();
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
                >
                  <Compass className="w-4 h-4" />
                  <span>{t("discovery.title")}</span>
                </button>
                <div className="border-t border-gray-800"></div>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onChangelogClick();
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
                >
                  <FileText className="w-4 h-4" />
                  <span>{t('nav.changelog')}</span>
                </button>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onSettingsClick();
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
                >
                  <Settings className="w-4 h-4" />
                  <span>{t('nav.settings')}</span>
                </button>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onImpressumClick();
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
                >
                  <Info className="w-4 h-4" />
                  <span>{t('nav.impressum')}</span>
                </button>
              </div>
            )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
