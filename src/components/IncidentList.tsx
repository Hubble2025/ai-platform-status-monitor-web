import { Clock } from 'lucide-react';
import { IncidentBadge } from './IncidentBadge';
import type { Incident, Provider } from '../lib/database.types';

interface IncidentListProps {
  incidents: (Incident & { provider: Provider })[];
}

export function IncidentList({ incidents }: IncidentListProps) {
  const formatDate = (date: string) => {
    return new Date(date).toLocaleString();
  };

  const formatDuration = (start: string, end: string | null) => {
    const startDate = new Date(start);
    const endDate = end ? new Date(end) : new Date();
    const diffMs = endDate.getTime() - startDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `${diffDays}d ${diffHours % 24}h`;
    if (diffHours > 0) return `${diffHours}h ${diffMins % 60}m`;
    return `${diffMins}m`;
  };

  return (
    <div className="space-y-3">
      {incidents.map((incident) => (
        <div
          key={incident.id}
          className="bg-gray-900 border border-gray-800 rounded-lg p-4 hover:border-gray-700 transition-colors"
        >
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-medium text-gray-400">
                  {incident.provider.name}
                </span>
                {incident.component && (
                  <span className="text-sm text-gray-500">• {incident.component}</span>
                )}
              </div>
              <h3 className="text-base font-semibold text-white mb-2">{incident.title}</h3>
              {incident.description && (
                <p className="text-sm text-gray-400 mb-3">{incident.description}</p>
              )}
            </div>
            <IncidentBadge severity={incident.severity} status={incident.status} />
          </div>

          <div className="flex items-center gap-4 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>
                {incident.started_at && formatDate(incident.started_at)}
              </span>
            </div>
            {incident.started_at && (
              <span>
                Duration: {formatDuration(incident.started_at, incident.resolved_at)}
              </span>
            )}
            {incident.regions.length > 0 && (
              <span>Regions: {incident.regions.join(', ')}</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
