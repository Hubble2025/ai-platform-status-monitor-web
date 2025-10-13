import { Calendar, MapPin, Users, Building2, DollarSign, ExternalLink, Code, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { ProviderDetails, AIModel } from '../lib/database.types';

interface ProviderInfoSectionProps {
  providerId: string;
}

export function ProviderInfoSection({ providerId }: ProviderInfoSectionProps) {
  const [details, setDetails] = useState<ProviderDetails | null>(null);
  const [models, setModels] = useState<AIModel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProviderInfo();
  }, [providerId]);

  async function loadProviderInfo() {
    setLoading(true);
    try {
      const [detailsResult, modelsResult] = await Promise.all([
        supabase
          .from('provider_details')
          .select('*')
          .eq('provider_id', providerId)
          .maybeSingle(),
        supabase
          .from('ai_models')
          .select('*')
          .eq('provider_id', providerId)
          .order('is_flagship', { ascending: false })
          .order('release_date', { ascending: false })
      ]);

      if (detailsResult.data) setDetails(detailsResult.data);
      if (modelsResult.data) setModels(modelsResult.data);
    } catch (error) {
      console.error('Failed to load provider info:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 bg-gray-800 rounded w-48"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-800 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!details && models.length === 0) {
    return null;
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000000) return `${(num / 1000000000).toFixed(1)}B`;
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatDate = (date: string | null) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  return (
    <div className="space-y-8">
      {details && (
        <>
          <div>
            <h3 className="text-2xl font-bold text-white mb-6">Platform Information</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {details.founded_date && (
                <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
                  <div className="flex items-center gap-3 mb-2">
                    <Calendar className="w-5 h-5 text-blue-400" />
                    <span className="text-sm text-gray-400">Founded</span>
                  </div>
                  <div className="text-lg font-semibold text-white">
                    {formatDate(details.founded_date)}
                  </div>
                </div>
              )}

              {details.headquarters && (
                <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
                  <div className="flex items-center gap-3 mb-2">
                    <MapPin className="w-5 h-5 text-blue-400" />
                    <span className="text-sm text-gray-400">Headquarters</span>
                  </div>
                  <div className="text-lg font-semibold text-white">
                    {details.headquarters}
                  </div>
                  {details.country && (
                    <div className="text-sm text-gray-400 mt-1">{details.country}</div>
                  )}
                </div>
              )}

              {details.average_users && (
                <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
                  <div className="flex items-center gap-3 mb-2">
                    <Users className="w-5 h-5 text-blue-400" />
                    <span className="text-sm text-gray-400">Active Users</span>
                  </div>
                  <div className="text-lg font-semibold text-white">
                    ~{formatNumber(details.average_users)}
                  </div>
                  {details.total_users && (
                    <div className="text-sm text-gray-400 mt-1">
                      {formatNumber(details.total_users)} total
                    </div>
                  )}
                </div>
              )}

              {details.company_type && (
                <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
                  <div className="flex items-center gap-3 mb-2">
                    <Building2 className="w-5 h-5 text-blue-400" />
                    <span className="text-sm text-gray-400">Company Type</span>
                  </div>
                  <div className="text-lg font-semibold text-white">
                    {details.company_type}
                  </div>
                </div>
              )}

              {details.funding_total && (
                <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
                  <div className="flex items-center gap-3 mb-2">
                    <DollarSign className="w-5 h-5 text-blue-400" />
                    <span className="text-sm text-gray-400">Total Funding</span>
                  </div>
                  <div className="text-lg font-semibold text-white">
                    {details.funding_total}
                  </div>
                </div>
              )}
            </div>

            {details.description && (
              <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 mb-6">
                <h4 className="text-lg font-semibold text-white mb-3">About</h4>
                <p className="text-gray-300 leading-relaxed">{details.description}</p>
              </div>
            )}

            {details.key_people && Array.isArray(details.key_people) && details.key_people.length > 0 && (
              <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 mb-6">
                <h4 className="text-lg font-semibold text-white mb-4">Key People</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {details.key_people.map((person: any, index: number) => (
                    <div key={index} className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-900/30 rounded-full flex items-center justify-center">
                        <span className="text-blue-400 font-semibold">
                          {person.name?.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <div className="text-white font-medium">{person.name}</div>
                        <div className="text-sm text-gray-400">{person.role}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              {details.website_url && (
                <a
                  href={details.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors min-touch-target"
                >
                  <ExternalLink className="w-4 h-4" />
                  Website
                </a>
              )}
              {details.api_documentation_url && (
                <a
                  href={details.api_documentation_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors min-touch-target"
                >
                  <Code className="w-4 h-4" />
                  API Docs
                </a>
              )}
              {details.pricing_url && (
                <a
                  href={details.pricing_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors min-touch-target"
                >
                  <DollarSign className="w-4 h-4" />
                  Pricing
                </a>
              )}
            </div>
          </div>
        </>
      )}

      {models.length > 0 && (
        <div>
          <h3 className="text-2xl font-bold text-white mb-6">AI Models & Capabilities</h3>

          <div className="space-y-4">
            {models.map((model) => (
              <div
                key={model.id}
                className={`bg-gray-900 border ${
                  model.is_flagship ? 'border-blue-600' : 'border-gray-800'
                } rounded-lg p-6 hover:border-gray-700 transition-colors`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="text-xl font-semibold text-white">
                        {model.model_name}
                      </h4>
                      {model.is_flagship && (
                        <span className="flex items-center gap-1 px-2 py-1 bg-blue-900/30 border border-blue-600 text-blue-400 text-xs font-medium rounded">
                          <Sparkles className="w-3 h-3" />
                          Flagship
                        </span>
                      )}
                      {model.is_deprecated && (
                        <span className="px-2 py-1 bg-red-900/30 border border-red-600 text-red-400 text-xs font-medium rounded">
                          Deprecated
                        </span>
                      )}
                    </div>
                    {model.model_version && (
                      <div className="text-sm text-gray-400 mb-2">
                        Version: <span className="text-gray-300 font-mono">{model.model_version}</span>
                      </div>
                    )}
                    {model.description && (
                      <p className="text-gray-300 mb-3">{model.description}</p>
                    )}
                  </div>
                  <div className="text-right ml-4">
                    <div className="px-3 py-1 bg-gray-800 rounded-lg text-sm text-gray-300">
                      {model.model_type}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  {model.release_date && (
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Released</div>
                      <div className="text-sm text-white">{formatDate(model.release_date)}</div>
                    </div>
                  )}
                  {model.context_window && (
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Context</div>
                      <div className="text-sm text-white">{formatNumber(model.context_window)} tokens</div>
                    </div>
                  )}
                  {model.parameters_count && (
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Parameters</div>
                      <div className="text-sm text-white">{model.parameters_count}</div>
                    </div>
                  )}
                  {model.pricing_tier && (
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Tier</div>
                      <div className="text-sm text-white capitalize">{model.pricing_tier}</div>
                    </div>
                  )}
                </div>

                {model.capabilities && Array.isArray(model.capabilities) && model.capabilities.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {model.capabilities.map((capability: string, index: number) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-gray-800 text-gray-300 text-xs rounded"
                      >
                        {capability}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex flex-wrap gap-4 text-sm">
                  {model.supports_vision && (
                    <div className="flex items-center gap-2 text-green-400">
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      Vision Support
                    </div>
                  )}
                  {model.supports_function_calling && (
                    <div className="flex items-center gap-2 text-green-400">
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      Function Calling
                    </div>
                  )}
                  {model.supports_streaming && (
                    <div className="flex items-center gap-2 text-green-400">
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      Streaming
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
