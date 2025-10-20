import { useEffect, useState } from 'react';
import { ArrowLeft, Plus, Edit, Wrench, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Changelog } from '../lib/database.types';

interface ChangelogProps {
  onBack: () => void;
}

interface GroupedChangelog {
  version: string;
  release_date: string;
  changes: Changelog[];
}

export function Changelog({ onBack }: ChangelogProps) {
    const [changelog, setChangelog] = useState<GroupedChangelog[]>([
      {
        version: '1.11',
        release_date: '2025-10-20T10:00:00Z',
        changes: [
          { id: 'new-feature-1', version: '1.11', release_date: '2025-10-20T10:00:00Z', type: 'added', category: 'Feature', description: 'Added new Changelog entry and updated versioning.' },
          { id: 'lang-switch-fix', version: '1.11', release_date: '2025-10-20T10:00:00Z', type: 'fixed', category: 'Bugfix', description: 'Ensured Language Switch affects all text content and new text content globally.' },
          { id: 'discovery-tabs', version: '1.11', release_date: '2025-10-20T10:00:00Z', type: 'added', category: 'Feature', description: 'Implemented Discovery and Suggest Platform tabs with translations.' },
          { id: 'italian-lang', version: '1.11', release_date: '2025-10-20T10:00:00Z', type: 'added', category: 'Feature', description: 'Added Italian as a new language option.' },
        ],
      },
    ]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
loadChangelog();
  }, []);

  async function loadChangelog() {
    try {
      const { data, error } = await supabase
        .from('changelog')
        .select('*')
        .order("release_date", { ascending: true })
        .order("created_at", { ascending: true });

      if (error) throw error;

      const grouped = groupByVersion(data || []);
      setChangelog(prev => [...grouped, ...prev]); // Add new entries to the beginning
    } catch (error) {
      console.error('Failed to load changelog:', error);
    } finally {
      setLoading(false);
    }
  }

  function groupByVersion(items: Changelog[]): GroupedChangelog[] {
    const groups = new Map<string, GroupedChangelog>();

    for (const item of items) {
      if (!groups.has(item.version)) {
        groups.set(item.version, {
          version: item.version,
          release_date: item.release_date,
          changes: [],
        });
      }
      groups.get(item.version)!.changes.push(item);
    }

        let sortedGroups = Array.from(groups.values()).sort((a, b) => {
          return new Date(b.release_date).getTime() - new Date(a.release_date).getTime();
        });

        const v110EntryIndex = sortedGroups.findIndex(group => group.version === '1.10');

        if (v110EntryIndex > -1) {
          const v110Entry = sortedGroups.splice(v110EntryIndex, 1)[0];
          // Insert v1.10 at the second to last position
          sortedGroups.splice(sortedGroups.length - 1, 0, v110Entry);
        }

        return sortedGroups;
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'added':
        return <Plus className="w-4 h-4 text-green-400" />;
      case 'changed':
        return <Edit className="w-4 h-4 text-blue-400" />;
      case 'fixed':
        return <Wrench className="w-4 h-4 text-yellow-400" />;
      case 'removed':
        return <Trash2 className="w-4 h-4 text-red-400" />;
      default:
        return null;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'added':
        return 'text-green-400';
      case 'changed':
        return 'text-blue-400';
      case 'fixed':
        return 'text-yellow-400';
      case 'removed':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Loading changelog...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Changelog</h1>
        <p className="text-gray-400">Track all updates, additions, and fixes to the platform</p>
      </div>

      <div className="space-y-6">
        {changelog.map((release) => (
          <div key={release.version} className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <div className="flex items-baseline gap-3 mb-4">
              <h2 className="text-2xl font-bold text-white">v{release.version}</h2>
              <span className="text-sm text-gray-400">
                {new Date(release.release_date).toLocaleDateString('de-DE', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
            </div>

            <div className="space-y-4">
              {['added', 'changed', 'fixed', 'removed'].map((type) => {
                const items = release.changes.filter((c) => c.type === type);
                if (items.length === 0) return null;

                return (
                  <div key={type}>
                    <h3 className={`text-sm font-semibold uppercase mb-2 flex items-center gap-2 ${getTypeColor(type)}`}>
                      {getTypeIcon(type)}
                      {type}
                    </h3>
                    <ul className="space-y-1 ml-6">
                      {items.map((item) => (
                        <li key={item.id} className="text-gray-300 text-sm">
                          <span className="text-gray-500 mr-2">•</span>
                          <span className="text-gray-500 text-xs uppercase mr-2">[{item.category}]</span>
                          {item.description}
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {changelog.length === 0 && (
        <div className="text-center py-12 bg-gray-900 border border-gray-800 rounded-lg">
          <p className="text-gray-400">No changelog entries yet</p>
        </div>
      )}
    </div>
  );
}
