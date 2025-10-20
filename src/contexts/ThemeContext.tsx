import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { translations, type Language } from '../lib/translations';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  language: Language;
  setTheme: (theme: Theme) => void;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function getSessionId(): string {
  let sessionId = localStorage.getItem('session_id');
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('session_id', sessionId);
  }
  return sessionId;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('dark');
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    loadPreferences();
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.classList.toggle('light', theme === 'light');
  }, [theme]);

  async function loadPreferences() {
    try {
      const sessionId = getSessionId();
      const { data } = await supabase
        .from('user_preferences')
        .select('theme, language')
        .eq('session_id', sessionId)
        .maybeSingle();

      if (data) {
        setThemeState((data.theme as Theme) || 'dark');
        setLanguageState((data.language as Language) || 'en');
      }
    } catch (error) {
      console.error('Failed to load preferences:', error);
    }
  }

  async function setTheme(newTheme: Theme) {
    setThemeState(newTheme);
    await savePreference('theme', newTheme);
  }

  async function setLanguage(newLang: Language) {
    setLanguageState(newLang);
    await savePreference('language', newLang);
  }

  async function savePreference(key: string, value: string) {
    try {
      const sessionId = getSessionId();
      const { data: existing } = await supabase
        .from('user_preferences')
        .select('id')
        .eq('session_id', sessionId)
        .maybeSingle();

      if (existing) {
        await supabase
          .from('user_preferences')
          .update({ [key]: value, updated_at: new Date().toISOString() })
          .eq('id', existing.id);
      } else {
        await supabase
          .from('user_preferences')
          .insert({ session_id: sessionId, [key]: value });
      }
    } catch (error) {
      console.error('Failed to save preference:', error);
    }
  }

  function t(key: string): string {
    return translations[language][key] || key;
  }

  return (
    <ThemeContext.Provider value={{ theme, language, setTheme, setLanguage, t }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
