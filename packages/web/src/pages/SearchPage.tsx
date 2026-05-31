import { useSearchParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api, formatNpcName } from '../api.js';
import { LoadingSpinner, ErrorMessage } from '../components/Feedback.js';

const TYPE_LABELS: Record<string, string> = {
  npc: 'NPCs',
  item: 'Items',
  spell: 'Spells',
  zone: 'Zones',
  faction: 'Factions',
  aa: 'Alternate Abilities',
  recipe: 'Recipes',
};

const TYPE_PATHS: Record<string, string> = {
  npc: '/npcs',
  item: '/items',
  spell: '/spells',
  zone: '/zones',
  faction: '/factions',
  aa: '/aas',
  recipe: '/recipes',
};

export default function SearchPage() {
  const [params] = useSearchParams();
  const q = params.get('q') ?? '';

  const { data, isLoading, error } = useQuery({
    queryKey: ['search', q],
    queryFn: () => api.search(q),
    enabled: q.length >= 2,
  });

  const totalResults = data
    ? Object.values(data).reduce((sum, arr) => sum + arr.length, 0)
    : 0;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-eq-gold">All Results</h1>

      {q.length < 2 && (
        <p className="text-eq-muted text-sm">Use the search bar above to search across all categories.</p>
      )}

      {isLoading && <LoadingSpinner />}

      {error && <ErrorMessage message={(error as Error).message} />}

      {data && (
        <>
          <p className="text-eq-muted text-sm">
            {totalResults} result{totalResults !== 1 ? 's' : ''} for <strong className="text-eq-text">&ldquo;{q}&rdquo;</strong>
          </p>
          {Object.entries(data).map(([type, results]) => {
            if (results.length === 0) return null;
            const basePath = TYPE_PATHS[type] ?? `/${type}s`;
            return (
              <section key={type} className="space-y-2">
                <h2 className="text-eq-gold font-semibold text-sm uppercase tracking-wide">
                  {TYPE_LABELS[type] ?? type}
                  <span className="ml-2 text-eq-muted font-normal normal-case">({results.length})</span>
                </h2>
                <ul className="divide-y divide-eq-border border border-eq-border rounded-lg overflow-hidden">
                  {results.map((r) => (
                    <li key={r.id}>
                      <Link
                        to={`${basePath}/${r.id}`}
                        className="block px-4 py-2 hover:bg-eq-panel/60 text-sm no-underline"
                      >
                        <span className="text-eq-text">{r._type === 'npc' ? formatNpcName(r.name) : r.name}</span>
                        {r.short_name != null ? (
                          <span className="ml-2 text-eq-muted text-xs">({String(r.short_name)})</span>
                        ) : null}
                      </Link>
                    </li>
                  ))}
                </ul>
                {results.length >= 20 && (
                  <div className="text-right">
                    <Link
                      to={`${basePath}?q=${encodeURIComponent(q)}`}
                      className="text-xs text-eq-accent hover:underline"
                    >
                      Find more {TYPE_LABELS[type] ?? type} matching &ldquo;{q}&rdquo; →
                    </Link>
                  </div>
                )}
              </section>
            );
          })}
        </>
      )}
    </div>
  );
}
