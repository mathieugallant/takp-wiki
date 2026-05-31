import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api.js';
import { LoadingSpinner, ErrorMessage } from '../components/Feedback.js';
import { SortHeader } from '../components/SortHeader.js';

const TRADESKILLS: Record<number, string> = {
  55: 'Fishing', 56: 'Make Poison', 57: 'Tinkering', 58: 'Research',
  59: 'Alchemy', 60: 'Baking', 61: 'Tailoring', 63: 'Blacksmithing',
  64: 'Fletching', 65: 'Brewing', 68: 'Jewelry Making', 69: 'Pottery',
};

export default function RecipesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const q = searchParams.get('q') ?? '';
  const sortCol = searchParams.get('sort') ?? 'name';
  const sortDir = (searchParams.get('dir') ?? 'asc') as 'asc' | 'desc';

  function handleSort(col: string) {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (next.get('sort') === col) {
        next.set('dir', next.get('dir') === 'desc' ? 'asc' : 'desc');
      } else {
        next.set('sort', col);
        next.delete('dir');
      }
      return next;
    });
  }

  const { data, isLoading, error } = useQuery({
    queryKey: ['recipes', q, sortCol, sortDir],
    queryFn: () => api.recipes({ search: q, sort: sortCol, dir: sortDir }),
    enabled: q.length >= 2,
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-eq-gold">Recipes</h1>

      {q.length < 2 && (
        <p className="text-eq-muted text-sm">Use the search bar above to filter recipes.</p>
      )}

      {isLoading && <LoadingSpinner />}
      {error && <ErrorMessage message={(error as Error).message} />}

      {data && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-eq-border text-eq-muted text-left">
                <SortHeader col="id" label="ID" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                <SortHeader col="name" label="Name" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                <SortHeader col="tradeskill" label="Tradeskill" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                <SortHeader col="trivial" label="Trivial" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                <SortHeader col="skillneeded" label="Skill Needed" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
              </tr>
            </thead>
            <tbody className="divide-y divide-eq-border/50">
              {data.map((r) => (
                <tr key={r.id} className="hover:bg-eq-panel/40">
                  <td className="py-1.5 pr-4 text-eq-muted">{r.id}</td>
                  <td className="py-1.5 pr-4">
                    <Link to={`/recipes/${r.id}`}>{r.name}</Link>
                  </td>
                  <td className="py-1.5 pr-4 text-eq-muted">
                    {TRADESKILLS[r.tradeskill] ?? `Skill ${r.tradeskill}`}
                  </td>
                  <td className="py-1.5 pr-4 text-eq-muted">{r.trivial}</td>
                  <td className="py-1.5 pr-4 text-eq-muted">{r.skillneeded || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {data.length === 0 && (
            <p className="text-eq-muted text-sm mt-4">No recipes found.</p>
          )}
        </div>
      )}
    </div>
  );
}
