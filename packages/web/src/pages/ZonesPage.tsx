import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { SearchBar } from '../components/SearchBar.js';
import { LoadingSpinner, ErrorMessage } from '../components/Feedback.js';

const EXPANSION_NAMES: Record<number, string> = {
  0: 'Classic',
  1: 'Kunark',
  2: 'Velious',
  3: 'Luclin',
  4: "Planes of Power",
};

export default function ZonesPage() {
  const [search, setSearch] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['zones', search],
    queryFn: () => api.zones({ search }),
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-eq-gold">Zones</h1>
      <div className="max-w-sm">
        <SearchBar
          initialValue={search}
          placeholder="Filter zones…"
        />
      </div>

      {isLoading && <LoadingSpinner />}
      {error && <ErrorMessage message={(error as Error).message} />}

      {data && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-eq-border text-eq-muted text-left">
                <th className="py-2 pr-4">Name</th>
                <th className="py-2 pr-4">Short Name</th>
                <th className="py-2 pr-4">Expansion</th>
                <th className="py-2 pr-4">Min Level</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-eq-border/50">
              {data.map((z) => (
                <tr key={z.id} className="hover:bg-eq-panel/40">
                  <td className="py-1.5 pr-4">
                    <Link to={`/zones/${z.id}`}>{z.long_name}</Link>
                    {z.hotzone ? (
                      <span className="ml-2 text-xs bg-eq-gold/20 text-eq-gold px-1 rounded">HOT</span>
                    ) : null}
                  </td>
                  <td className="py-1.5 pr-4 text-eq-muted">{z.short_name}</td>
                  <td className="py-1.5 pr-4 text-eq-muted">
                    {EXPANSION_NAMES[z.expansion] ?? `Exp ${z.expansion}`}
                  </td>
                  <td className="py-1.5 pr-4 text-eq-muted">{z.min_level || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
