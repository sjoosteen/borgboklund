'use client';

import { useState } from 'react';

export default function TestStationsPage() {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchStations = async () => {
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      const res = await fetch(`/api/stop-lookup?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      
      if (!res.ok) {
        setError(`API Error: ${res.status} - ${data.error || 'Unknown error'}`);
      } else {
        setResponse(data);
      }
    } catch (err) {
      setError(`Network Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      searchStations();
    }
  };

  const quickSearches = [
    'Klinga',
    'Norrköping',
    'Östra station',
    'Strömporten',
    'Söder Tull',
    '740055002',
    '17317',
    '856',
    '480',
    'Centralstation'
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          🚌 Station Search Test
        </h1>

        {/* Search Input */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex gap-4 mb-4">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Sök på station (namn eller ID)..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={searchStations}
              disabled={loading || !query.trim()}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? 'Söker...' : 'Sök'}
            </button>
          </div>

          {/* Quick Search Buttons */}
          <div className="flex flex-wrap gap-2">
            <span className="text-sm text-gray-600 mr-2">Snabbsök:</span>
            {quickSearches.map((search) => (
              <button
                key={search}
                onClick={() => setQuery(search)}
                className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
              >
                {search}
              </button>
            ))}
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <h3 className="text-red-800 font-semibold mb-2">❌ Fel</h3>
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Response Display */}
        {response && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              📡 API Response för "{query}"
            </h2>
            
            {/* Summary */}
            {response.stopGroups && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <h3 className="text-blue-800 font-semibold mb-2">📊 Sammanfattning</h3>
                <p className="text-blue-700">
                  Hittade <strong>{response.stopGroups.length}</strong> stationsgrupper
                </p>
                {response.stopGroups.length > 0 && (
                  <div className="mt-2">
                    {response.stopGroups.map((group: any, index: number) => (
                      <div key={index} className="text-sm text-blue-600 mb-1">
                        <strong>{group.name}</strong> (ID: {group.id}) - {group.stops?.length || 0} hållplatser
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Raw JSON Response */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h3 className="text-gray-800 font-semibold mb-2">🔍 Fullständig JSON Response</h3>
              <pre className="text-xs text-gray-700 overflow-auto max-h-96 whitespace-pre-wrap">
                {JSON.stringify(response, null, 2)}
              </pre>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-6">
          <h3 className="text-yellow-800 font-semibold mb-2">💡 Tips</h3>
          <ul className="text-yellow-700 text-sm space-y-1">
            <li>• Testa att söka på stationsnamn som "Klinga", "Norrköping", "Östra station"</li>
            <li>• Testa att söka på station-ID:n som "740055002", "17317", "856"</li>
            <li>• Testa att söka på linjenummer som "480"</li>
            <li>• API:et söker först i ResRobot, sedan i Trafiklab om ResRobot misslyckas</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
