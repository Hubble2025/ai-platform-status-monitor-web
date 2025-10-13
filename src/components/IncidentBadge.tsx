interface IncidentBadgeProps {
  severity: string | null;
  status: string;
}

export function IncidentBadge({ severity, status }: IncidentBadgeProps) {
  const getSeverityColor = () => {
    switch (severity) {
      case 'critical':
        return 'bg-red-900/30 text-red-400 border-red-800';
      case 'major':
        return 'bg-orange-900/30 text-orange-400 border-orange-800';
      case 'minor':
        return 'bg-yellow-900/30 text-yellow-400 border-yellow-800';
      default:
        return 'bg-gray-800 text-gray-400 border-gray-700';
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'investigating':
        return 'bg-blue-900/30 text-blue-400 border-blue-800';
      case 'identified':
        return 'bg-purple-900/30 text-purple-400 border-purple-800';
      case 'monitoring':
        return 'bg-cyan-900/30 text-cyan-400 border-cyan-800';
      case 'resolved':
        return 'bg-green-900/30 text-green-400 border-green-800';
      case 'outage':
        return 'bg-red-900/30 text-red-400 border-red-800';
      case 'degraded':
        return 'bg-yellow-900/30 text-yellow-400 border-yellow-800';
      default:
        return 'bg-gray-800 text-gray-400 border-gray-700';
    }
  };

  return (
    <div className="flex gap-2">
      {severity && (
        <span className={`px-2 py-1 text-xs font-medium rounded border ${getSeverityColor()}`}>
          {severity.toUpperCase()}
        </span>
      )}
      <span className={`px-2 py-1 text-xs font-medium rounded border ${getStatusColor()}`}>
        {status.toUpperCase()}
      </span>
    </div>
  );
}
