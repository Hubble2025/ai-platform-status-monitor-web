import { useEffect, useState } from 'react';
import { Activity, AlertTriangle, XCircle } from 'lucide-react';
import { fetch24HourProviderHistory, type HistoryDataPoint } from '../services/providerService';

interface IncidentHistoryChartProps {
  providerId: string;
}

export function IncidentHistoryChart({ providerId }: IncidentHistoryChartProps) {
  const [data, setData] = useState<HistoryDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  useEffect(() => {
    async function loadHistoryData() {
      try {
        const historyData = await fetch24HourProviderHistory(providerId);
        setData(historyData);
      } catch (error) {
        console.error('Failed to load history:', error);
      } finally {
        setLoading(false);
      }
    }

    loadHistoryData();
  }, [providerId]);

  if (loading) {
    return (
      <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-800 rounded w-1/3"></div>
          <div className="h-32 bg-gray-800 rounded"></div>
        </div>
      </div>
    );
  }

  const maxHeight = 60;
  const maxValue = Math.max(...data.map(d => d.incidentCount + d.communityReports), 1);

  const getBarColor = (point: HistoryDataPoint) => {
    if (point.status === 'outage') return 'bg-red-500';
    if (point.status === 'degraded') return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'outage':
        return <XCircle className="w-3 h-3" />;
      case 'degraded':
        return <AlertTriangle className="w-3 h-3" />;
      default:
        return <Activity className="w-3 h-3" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'outage':
        return 'Likely Outage';
      case 'degraded':
        return 'Possible Issues';
      default:
        return 'Operational';
    }
  };

  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-white mb-1">Status Health (Last 24h)</h3>
        <p className="text-sm text-gray-400">Incidents and community reports over time</p>
      </div>

      <div className="relative" style={{ height: `${maxHeight + 40}px` }}>
        <div className="absolute inset-0 flex items-end gap-1 px-2">
          {data.map((point, index) => {
            const totalValue = point.incidentCount + point.communityReports;
            const heightPercent = (totalValue / maxValue) * 100;
            const barHeight = Math.max((heightPercent / 100) * maxHeight, 2);

            return (
              <div
                key={index}
                className="relative flex-1 group"
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                <div
                  className={`${getBarColor(point)} rounded-t transition-all duration-200 cursor-pointer hover:opacity-80`}
                  style={{ height: `${barHeight}px` }}
                ></div>

                {hoveredIndex === index && (
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-10 pointer-events-none">
                    <div className="bg-gray-950 border border-gray-700 rounded-lg p-3 shadow-xl whitespace-nowrap">
                      <div className="text-xs font-medium text-white mb-2">{point.hour}</div>
                      <div className="flex items-center gap-2 text-xs mb-1">
                        {getStatusIcon(point.status)}
                        <span className="text-gray-300">{getStatusText(point.status)}</span>
                      </div>
                      {point.incidentCount > 0 && (
                        <div className="text-xs text-gray-400">
                          Official: {point.incidentCount}
                        </div>
                      )}
                      {point.communityReports > 0 && (
                        <div className="text-xs text-gray-400">
                          Community: {point.communityReports}
                        </div>
                      )}
                      {totalValue === 0 && (
                        <div className="text-xs text-gray-400">No issues</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-gray-500 px-2">
          <span>24h ago</span>
          <span>12h ago</span>
          <span>Now</span>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-xs text-gray-400">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded"></div>
          <span>Operational</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-yellow-500 rounded"></div>
          <span>Possible Issues</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-red-500 rounded"></div>
          <span>Likely Outage</span>
        </div>
      </div>
    </div>
  );
}
