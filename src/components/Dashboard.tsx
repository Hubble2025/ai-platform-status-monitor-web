import { useState } from 'react';
import { useProviders } from '../hooks/useProviders';
import { useIncidents } from '../hooks/useIncidents';
import { useProviderOrder } from '../hooks/useProviderOrder';
import { ProviderCard } from './ProviderCard';
import { IncidentList } from './IncidentList';
import { getProviderStatus } from '../services/providerService';
import { Loader2, GripVertical } from 'lucide-react';
import type { Provider } from '../lib/database.types';

interface DashboardProps {
  onProviderClick: (slug: string) => void;
}

export function Dashboard({ onProviderClick }: DashboardProps) {
  const { providers, loading: providersLoading } = useProviders();
  const { incidents, loading: incidentsLoading } = useIncidents();
  const { orderedProviders, saveProviderOrder, loading: orderLoading } = useProviderOrder(providers);
  const [filter, setFilter] = useState<'all' | 'issues'>('all');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  if (providersLoading || incidentsLoading || orderLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  const providersWithStatus = orderedProviders.map(provider => {
    const providerIncidents = incidents.filter(inc => inc.provider_id === provider.id);
    const status = getProviderStatus({ ...provider, incidents: providerIncidents });
    return { provider, ...status };
  });

  const filteredProviders = filter === 'issues'
    ? providersWithStatus.filter(p => p.activeIncidents > 0)
    : providersWithStatus;

  function handleDragStart(index: number) {
    setDraggedIndex(index);
  }

  function handleDragOver(e: React.DragEvent, index: number) {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    setDragOverIndex(index);
  }

  function handleDrop(e: React.DragEvent, dropIndex: number) {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) return;

    const newOrder = [...orderedProviders];
    const draggedItem = newOrder[draggedIndex];
    newOrder.splice(draggedIndex, 1);
    newOrder.splice(dropIndex, 0, draggedItem);

    saveProviderOrder(newOrder);
    setDraggedIndex(null);
    setDragOverIndex(null);
  }

  function handleDragEnd() {
    setDraggedIndex(null);
    setDragOverIndex(null);
  }

  function handleDragLeave() {
    setDragOverIndex(null);
  }

  const totalIncidents = incidents.length;
  const criticalIncidents = incidents.filter(i => i.severity === 'critical').length;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4" role="region" aria-label="Status overview">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <div className="text-sm text-gray-400 mb-1" id="active-incidents-label">Active Incidents</div>
          <div className="text-3xl font-bold text-white" aria-labelledby="active-incidents-label">{totalIncidents}</div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <div className="text-sm text-gray-400 mb-1" id="critical-issues-label">Critical Issues</div>
          <div className="text-3xl font-bold text-red-400" aria-labelledby="critical-issues-label">{criticalIncidents}</div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <div className="text-sm text-gray-400 mb-1" id="operational-label">Operational Services</div>
          <div className="text-3xl font-bold text-green-400" aria-labelledby="operational-label">
            {providers.length - providersWithStatus.filter(p => p.activeIncidents > 0).length}
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-white">Service Status</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              All Services
            </button>
            <button
              onClick={() => setFilter('issues')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'issues'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              Issues Only
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProviders.map(({ provider, status, activeIncidents }, index) => {
            const providerIncidents = incidents.filter(inc => inc.provider_id === provider.id);
            const isDragging = draggedIndex === index;
            const isDropTarget = dragOverIndex === index;

            return (
              <div
                key={provider.id}
                draggable={filter === 'all'}
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDrop={(e) => handleDrop(e, index)}
                onDragEnd={handleDragEnd}
                onDragLeave={handleDragLeave}
                className={`relative transition-all duration-200 ${
                  isDragging ? 'opacity-30 scale-95' : ''
                } ${
                  isDropTarget && !isDragging ? 'ring-2 ring-blue-500 scale-105 shadow-lg shadow-blue-500/20' : ''
                }`}
              >
                {filter === 'all' && (
                  <div className="absolute -left-2 top-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing z-10 transition-colors hover:text-blue-400">
                    <GripVertical className="w-5 h-5 text-gray-600" />
                  </div>
                )}
                <ProviderCard
                  provider={provider}
                  status={status}
                  activeIncidents={activeIncidents}
                  incidents={providerIncidents}
                  onClick={() => onProviderClick(provider.slug)}
                />
              </div>
            );
          })}
        </div>
      </div>

      {incidents.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold text-white mb-4">Recent Incidents</h2>
          <IncidentList incidents={incidents} />
        </div>
      )}
    </div>
  );
}
