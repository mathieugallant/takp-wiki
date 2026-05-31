import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api.js';
import { LoadingSpinner, ErrorMessage } from '../components/Feedback.js';
import { EffectSelect } from '../components/EffectSelect.js';
import { SortHeader } from '../components/SortHeader.js';

const CLASS_OPTIONS: [number, string][] = [
  [1, 'Warrior'], [2, 'Cleric'], [3, 'Paladin'], [4, 'Ranger'],
  [5, 'Shadow Knight'], [6, 'Druid'], [7, 'Monk'], [8, 'Bard'],
  [9, 'Rogue'], [10, 'Shaman'], [11, 'Necromancer'], [12, 'Wizard'],
  [13, 'Magician'], [14, 'Enchanter'], [15, 'Beastlord'],
];

const AA_TYPE_LABELS: Record<number, string> = {
  1: 'General', 2: 'Archetype', 3: 'Class',
};

export default function AasPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const q = searchParams.get('q') ?? '';
  const classFilter = searchParams.get('class') ?? '';
  const levelFilter = searchParams.get('level') ?? '';
  const effectFilter = searchParams.get('effect') ?? '';

  const isEnabled = q.length >= 2 || classFilter !== '' || levelFilter !== '' || effectFilter !== '';

  function setFilter(key: string, value: string) {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (value === '') next.delete(key); else next.set(key, value);
      return next;
    });
  }

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
    queryKey: ['aas', q, classFilter, levelFilter, effectFilter, sortCol, sortDir],
    queryFn: () => api.aas({ search: q, class: classFilter, level: levelFilter, effect: effectFilter, sort: sortCol, dir: sortDir }),
    enabled: isEnabled,
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-eq-gold">Alternate Abilities</h1>

      <div className="flex flex-wrap gap-x-4 gap-y-2 items-center text-sm">
        <label className="text-eq-muted flex items-center gap-1">
          Class:
          <select
            value={classFilter}
            onChange={(e) => setFilter('class', e.target.value)}
            className="bg-eq-dark border border-eq-border rounded px-2 py-0.5 text-eq-text"
          >
            <option value="">All</option>
            {CLASS_OPTIONS.map(([id, name]) => (
              <option key={id} value={String(id)}>{name}</option>
            ))}
          </select>
        </label>
        <label className="text-eq-muted flex items-center gap-1">
          Max Level:
          <input
            type="number"
            min={1}
            max={65}
            value={levelFilter}
            placeholder="—"
            onChange={(e) => setFilter('level', e.target.value)}
            className="bg-eq-dark border border-eq-border rounded px-2 py-0.5 text-eq-text w-16"
          />
        </label>
        <div className="text-eq-muted flex items-center gap-1">
          <span>Spell Effect:</span>
          <EffectSelect value={effectFilter} onChange={(v) => setFilter('effect', v)} />
        </div>
      </div>

      {!isEnabled && (
        <p className="text-eq-muted text-sm">Use the search bar above or select a filter to browse AAs.</p>
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
                <SortHeader col="type" label="Type" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                <SortHeader col="description" label="Description" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
              </tr>
            </thead>
            <tbody className="divide-y divide-eq-border/50">
              {data.map((aa) => (
                <tr key={aa.id} className="hover:bg-eq-panel/40">
                  <td className="py-1.5 pr-4 text-eq-muted">{aa.id}</td>
                  <td className="py-1.5 pr-4 whitespace-nowrap">
                    <Link to={`/aas/${aa.id}`}>{aa.name}</Link>
                  </td>
                  <td className="py-1.5 pr-4 text-eq-muted whitespace-nowrap">
                    {AA_TYPE_LABELS[aa.type] ?? `Type ${aa.type}`}
                  </td>
                  <td className="py-1.5 pr-4 text-eq-muted text-xs max-w-xs truncate">
                    {aa.description}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {data.length === 0 && (
            <p className="text-eq-muted text-sm mt-4">No alternate abilities found.</p>
          )}
        </div>
      )}
    </div>
  );
}
