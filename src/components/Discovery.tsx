import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';

interface DiscoveryProps {
  onBack: () => void;
  onSuggestPlatform: () => void;
}

export function Discovery({ onBack, onSuggestPlatform }: DiscoveryProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        {t("common.back")}
      </button>

      <div>
        <h1 className="text-3xl font-bold text-white mb-2">{t("discovery.title")}</h1>
        <p className="text-gray-400">{t("discovery.subtitle")}</p>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
        <p className="text-gray-300">Content for discovering new AI platforms will go here.</p>
        <button 
          onClick={onSuggestPlatform}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          {t("discovery.suggestPlatform")}
        </button>
      </div>
    </div>
  );
}

