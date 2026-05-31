import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api, formatNpcName } from '../api.js';
import { LoadingSpinner, ErrorMessage } from '../components/Feedback.js';
import { SortHeader } from '../components/SortHeader.js';

const CLASS_NAMES: Record<number, string> = {
  1: 'Warrior', 2: 'Cleric', 3: 'Paladin', 4: 'Ranger', 5: 'Shadow Knight',
  6: 'Druid', 7: 'Monk', 8: 'Bard', 9: 'Rogue', 10: 'Shaman',
  11: 'Necromancer', 12: 'Wizard', 13: 'Magician', 14: 'Enchanter', 15: 'Beastlord',
};

export default function NpcsPage() {
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
    queryKey: ['npcs', q, sortCol, sortDir],
    queryFn: () => api.npcs({ search: q, sort: sortCol, dir: sortDir }),
    enabled: q.length >= 2,
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-eq-gold">NPCs</h1>

      {q.length < 2 && (
        <p className="text-eq-muted text-sm">Use the search bar above to filter NPCs.</p>
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
                <SortHeader col="class" label="Class" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                <SortHeader col="level" label="Level" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                <SortHeader col="hp" label="HP" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
              </tr>
            </thead>
            <tbody className="divide-y divide-eq-border/50">
              {data.map((n) => (
                <tr key={n.id} className="hover:bg-eq-panel/40">
                  <td className="py-1.5 pr-4 text-eq-muted">{n.id}</td>
                  <td className="py-1.5 pr-4">
                    <Link to={`/npcs/${n.id}`}>{formatNpcName(n.name)}</Link>
                  </td>
                  <td className="py-1.5 pr-4 text-eq-muted">{CLASS_NAMES[n.class] ?? `Class ${n.class}`}</td>
                  <td className="py-1.5 pr-4 text-eq-muted">{n.level}</td>
                  <td className="py-1.5 pr-4 text-eq-muted">{n.hp.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {data.length === 0 && (
            <p className="text-eq-muted text-sm mt-4">No NPCs found.</p>
          )}
        </div>
      )}
    </div>
  );
}
