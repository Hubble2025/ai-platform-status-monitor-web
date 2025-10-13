import { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';

const CHECK_INTERVAL = 10 * 60 * 1000;

export function StatusChecker() {
  const [checking, setChecking] = useState(false);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);
  const [nextCheck, setNextCheck] = useState<Date | null>(null);

  useEffect(() => {
    checkStatus();

    const interval = setInterval(() => {
      checkStatus();
    }, CHECK_INTERVAL);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (lastCheck) {
      const next = new Date(lastCheck.getTime() + CHECK_INTERVAL);
      setNextCheck(next);
    }
  }, [lastCheck]);

  async function checkStatus() {
    setChecking(true);
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const response = await fetch(
        `${supabaseUrl}/functions/v1/check-provider-status`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        setLastCheck(new Date());
      }
    } catch (error) {
      console.error('Failed to check status:', error);
    } finally {
      setChecking(false);
    }
  }

  function formatTimeUntilNext(): string {
    if (!nextCheck) return '';

    const now = new Date();
    const diff = nextCheck.getTime() - now.getTime();

    if (diff <= 0) return 'checking now...';

    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);

    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-gray-900 border border-gray-800 rounded-lg p-4 shadow-xl">
      <div className="flex items-center gap-3">
        <button
          onClick={checkStatus}
          disabled={checking}
          className="p-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Check status now"
        >
          <RefreshCw className={`w-4 h-4 text-white ${checking ? 'animate-spin' : ''}`} />
        </button>

        <div className="text-sm">
          {checking ? (
            <p className="text-gray-400">Checking status...</p>
          ) : lastCheck ? (
            <>
              <p className="text-gray-500 text-xs">Last check: {lastCheck.toLocaleTimeString()}</p>
              <p className="text-gray-400 text-xs">Next check in: {formatTimeUntilNext()}</p>
            </>
          ) : (
            <p className="text-gray-400">Click to check status</p>
          )}
        </div>
      </div>
    </div>
  );
}
