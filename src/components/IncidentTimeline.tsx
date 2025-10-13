import { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import type { Incident } from '../lib/database.types';

interface IncidentTimelineProps {
  incidents: Incident[];
}

interface DayData {
  date: Date;
  dateStr: string;
  incidents: Incident[];
  severity: 'none' | 'minor' | 'major' | 'critical';
  hasActive: boolean;
}

export function IncidentTimeline({ incidents }: IncidentTimelineProps) {
  const { theme, t } = useTheme();
  const [hoveredDay, setHoveredDay] = useState<DayData | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  const getLast30Days = (): DayData[] => {
    const days: DayData[] = [];
    const today = new Date();

    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const nextDate = new Date(date);
      nextDate.setDate(date.getDate() + 1);

      const dayIncidents = incidents.filter(incident => {
        const incidentDate = new Date(incident.created_at);
        const resolvedDate = incident.resolved_at ? new Date(incident.resolved_at) : new Date();

        return (incidentDate <= nextDate && resolvedDate >= date);
      });

      let severity: 'none' | 'minor' | 'major' | 'critical' = 'none';
      let hasActive = false;

      if (dayIncidents.length > 0) {
        hasActive = dayIncidents.some(inc => inc.status !== 'resolved');

        if (dayIncidents.some(inc => inc.severity === 'critical')) {
          severity = 'critical';
        } else if (dayIncidents.some(inc => inc.severity === 'major')) {
          severity = 'major';
        } else if (dayIncidents.some(inc => inc.severity === 'minor')) {
          severity = 'minor';
        }
      }

      days.push({
        date,
        dateStr: date.toISOString().split('T')[0],
        incidents: dayIncidents,
        severity,
        hasActive
      });
    }

    return days;
  };

  const getBarColor = (severity: string, hasActive: boolean) => {
    const isDark = theme === 'dark';

    if (severity === 'critical') {
      return isDark ? '#ef4444' : '#dc2626';
    } else if (severity === 'major') {
      return isDark ? '#f97316' : '#ea580c';
    } else if (severity === 'minor') {
      return isDark ? '#fbbf24' : '#d97706';
    } else {
      return isDark ? '#10b981' : '#059669';
    }
  };

  const getBarHeight = (severity: string, hasActive: boolean) => {
    if (severity === 'critical') return hasActive ? '100%' : '85%';
    if (severity === 'major') return hasActive ? '75%' : '60%';
    if (severity === 'minor') return hasActive ? '50%' : '35%';
    return '20%';
  };

  const handleMouseEnter = (day: DayData, event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setTooltipPosition({
      x: rect.left + rect.width / 2,
      y: rect.top
    });
    setHoveredDay(day);
  };

  const handleMouseLeave = () => {
    setHoveredDay(null);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const days = getLast30Days();

  return (
    <div className="relative">
      <div className="flex items-end gap-[2px] h-16 px-2">
        {days.map((day, index) => {
          const color = getBarColor(day.severity, day.hasActive);
          const height = getBarHeight(day.severity, day.hasActive);

          return (
            <div
              key={day.dateStr}
              className="flex-1 flex items-end cursor-pointer transition-opacity hover:opacity-80"
              onMouseEnter={(e) => handleMouseEnter(day, e)}
              onMouseLeave={handleMouseLeave}
            >
              <div
                className={`w-full rounded-t-sm transition-all ${
                  day.hasActive ? 'animate-pulse' : ''
                }`}
                style={{
                  backgroundColor: color,
                  height: height,
                  minHeight: '3px'
                }}
              />
            </div>
          );
        })}
      </div>

      {hoveredDay && (
        <div
          className="fixed z-50 pointer-events-none"
          style={{
            left: `${tooltipPosition.x}px`,
            top: `${tooltipPosition.y - 10}px`,
            transform: 'translate(-50%, -100%)'
          }}
        >
          <div className="bg-gray-900 dark:bg-gray-800 text-white px-3 py-2 rounded-lg shadow-xl border border-gray-700 dark:border-gray-600 min-w-[200px]">
            <div className="text-sm font-semibold mb-1">
              {formatDate(hoveredDay.date)}
            </div>

            {hoveredDay.incidents.length > 0 ? (
              <div className="space-y-1">
                <div className="text-xs text-gray-300">
                  {hoveredDay.incidents.length} {hoveredDay.incidents.length === 1 ? 'incident' : 'incidents'}
                </div>
                {hoveredDay.incidents.slice(0, 3).map((incident) => (
                  <div key={incident.id} className="text-xs">
                    <span className={`inline-block w-2 h-2 rounded-full mr-1 ${
                      incident.severity === 'critical' ? 'bg-red-500' :
                      incident.severity === 'major' ? 'bg-orange-500' :
                      'bg-yellow-500'
                    }`} />
                    <span className="text-gray-200">{incident.title.substring(0, 40)}{incident.title.length > 40 ? '...' : ''}</span>
                  </div>
                ))}
                {hoveredDay.incidents.length > 3 && (
                  <div className="text-xs text-gray-400 italic">
                    +{hoveredDay.incidents.length - 3} more
                  </div>
                )}
                {hoveredDay.hasActive && (
                  <div className="text-xs text-red-400 font-semibold mt-1">
                    Active incident
                  </div>
                )}
              </div>
            ) : (
              <div className="text-xs text-gray-400">
                No incidents
              </div>
            )}
          </div>
          <div
            className="w-2 h-2 bg-gray-900 dark:bg-gray-800 border-r border-b border-gray-700 dark:border-gray-600 transform rotate-45 mx-auto -mt-1"
          />
        </div>
      )}
    </div>
  );
}
