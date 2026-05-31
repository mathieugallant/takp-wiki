import { useSearchParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api.js';
import { SearchBar } from '../components/SearchBar.js';
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
      <div className="max-w-lg">
        <SearchBar initialValue={q} autoFocus />
      </div>

      {q.length < 2 && (
        <p className="text-eq-muted text-sm">Enter at least 2 characters to search.</p>
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
                        <span className="text-eq-text">{r.name}</span>
                        {r.short_name != null ? (
                          <span className="ml-2 text-eq-muted text-xs">({String(r.short_name)})</span>
                        ) : null}
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </>
      )}
    </div>
  );
}
