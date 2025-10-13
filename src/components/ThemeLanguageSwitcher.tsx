import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

const languageFlags: Record<string, string> = {
  en: '🇬🇧',
  de: '🇩🇪',
  es: '🇪🇸',
  fr: '🇫🇷',
};

const languageNames: Record<string, string> = {
  en: 'English',
  de: 'Deutsch',
  es: 'Español',
  fr: 'Français',
};

export function ThemeLanguageSwitcher() {
  const { theme, language, setTheme, setLanguage } = useTheme();

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition-colors"
        title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      >
        {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
      </button>

      <div className="relative group">
        <button
          className="px-3 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-white transition-colors flex items-center gap-2"
          title="Change language"
        >
          <span className="text-lg">{languageFlags[language]}</span>
          <span className="text-sm font-medium">{language.toUpperCase()}</span>
        </button>

        <div className="absolute right-0 mt-2 w-48 bg-gray-900 border border-gray-800 rounded-lg shadow-xl overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
          {Object.entries(languageFlags).map(([code, flag]) => (
            <button
              key={code}
              onClick={() => setLanguage(code as any)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                language === code
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <span className="text-lg">{flag}</span>
              <span className="text-sm font-medium">{languageNames[code]}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
