import type { Language } from './translations';

const localeMap: Record<Language, string> = {
  en: 'en-US',
  de: 'de-DE',
  es: 'es-ES',
  fr: 'fr-FR',
};

export function formatDate(date: Date | string, language: Language, options?: Intl.DateTimeFormatOptions): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const locale = localeMap[language];

  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    ...options,
  };

  return dateObj.toLocaleString(locale, defaultOptions);
}

export function formatRelativeTime(date: Date | string, language: Language): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - dateObj.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  const locale = localeMap[language];
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

  if (diffMins < 1) return rtf.format(0, 'minute');
  if (diffMins < 60) return rtf.format(-diffMins, 'minute');

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return rtf.format(-diffHours, 'hour');

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return rtf.format(-diffDays, 'day');

  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths < 12) return rtf.format(-diffMonths, 'month');

  const diffYears = Math.floor(diffMonths / 12);
  return rtf.format(-diffYears, 'year');
}
