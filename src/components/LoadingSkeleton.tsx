export function LoadingSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-8 bg-gray-800 rounded-lg w-1/3"></div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="h-6 bg-gray-800 rounded w-32"></div>
              <div className="h-4 w-4 bg-gray-800 rounded-full"></div>
            </div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-800 rounded w-full"></div>
              <div className="h-4 bg-gray-800 rounded w-3/4"></div>
            </div>
            <div className="mt-4 h-16 bg-gray-800 rounded"></div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ProviderCardSkeleton() {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="h-6 bg-gray-800 rounded w-40"></div>
        <div className="h-4 w-4 bg-gray-800 rounded-full"></div>
      </div>
      <div className="space-y-2 mb-4">
        <div className="h-4 bg-gray-800 rounded w-full"></div>
        <div className="h-4 bg-gray-800 rounded w-2/3"></div>
      </div>
      <div className="h-16 bg-gray-800 rounded"></div>
    </div>
  );
}

export function DetailsSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center gap-4">
        <div className="h-10 w-10 bg-gray-800 rounded-lg"></div>
        <div className="flex-1">
          <div className="h-8 bg-gray-800 rounded w-48 mb-2"></div>
          <div className="h-4 bg-gray-800 rounded w-32"></div>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
        <div className="h-6 bg-gray-800 rounded w-32 mb-4"></div>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-4 bg-gray-800 rounded-lg">
              <div className="h-4 w-4 bg-gray-700 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-700 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
