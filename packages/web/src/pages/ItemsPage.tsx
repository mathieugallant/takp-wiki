import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api.js';
import { LoadingSpinner, ErrorMessage } from '../components/Feedback.js';
import { EffectSelect } from '../components/EffectSelect.js';
import { SortHeader } from '../components/SortHeader.js';
import { ITEM_TYPES, SLOT_BITS } from './ItemDetailPage.js';

const CLASS_OPTIONS: [number, string][] = [
  [1, 'Warrior'], [2, 'Cleric'], [3, 'Paladin'], [4, 'Ranger'],
  [5, 'Shadow Knight'], [6, 'Druid'], [7, 'Monk'], [8, 'Bard'],
  [9, 'Rogue'], [10, 'Shaman'], [11, 'Necromancer'], [12, 'Wizard'],
  [13, 'Magician'], [14, 'Enchanter'], [15, 'Beastlord'],
];

const RACE_OPTIONS: [number, string][] = [
  [1, 'Human'], [2, 'Barbarian'], [3, 'Erudite'], [4, 'Wood Elf'],
  [5, 'High Elf'], [6, 'Dark Elf'], [7, 'Half Elf'], [8, 'Dwarf'],
  [9, 'Troll'], [10, 'Ogre'], [11, 'Halfling'], [12, 'Gnome'],
  [13, 'Iksar'], [14, 'Vah Shir'],
];

export default function ItemsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const q = searchParams.get('q') ?? '';
  const classFilter = searchParams.get('class') ?? '';
  const raceFilter = searchParams.get('race') ?? '';
  const typeFilter = searchParams.get('type') ?? '';
  const levelFilter = searchParams.get('level') ?? '';
  const effectFilter = searchParams.get('effect') ?? '';

  const hasFilters = classFilter !== '' || raceFilter !== '' || typeFilter !== '' || levelFilter !== '' || effectFilter !== '';
  const isEnabled = q.length >= 2 || hasFilters;

  function setFilter(key: string, value: string) {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (value === '') next.delete(key); else next.set(key, value);
      return next;
    });
  }

  function clearFilters() {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      ['class', 'race', 'type', 'level', 'effect'].forEach((k) => next.delete(k));
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
    queryKey: ['items', q, classFilter, raceFilter, typeFilter, levelFilter, effectFilter, sortCol, sortDir],
    queryFn: () => api.items({ search: q, class: classFilter, race: raceFilter, type: typeFilter, level: levelFilter, effect: effectFilter, sort: sortCol, dir: sortDir }),
    enabled: isEnabled,
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-eq-gold">Items</h1>

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
          Race:
          <select
            value={raceFilter}
            onChange={(e) => setFilter('race', e.target.value)}
            className="bg-eq-dark border border-eq-border rounded px-2 py-0.5 text-eq-text"
          >
            <option value="">All</option>
            {RACE_OPTIONS.map(([id, name]) => (
              <option key={id} value={String(id)}>{name}</option>
            ))}
          </select>
        </label>
        <label className="text-eq-muted flex items-center gap-1">
          Type:
          <select
            value={typeFilter}
            onChange={(e) => setFilter('type', e.target.value)}
            className="bg-eq-dark border border-eq-border rounded px-2 py-0.5 text-eq-text"
          >
            <option value="">All</option>
            {Object.entries(ITEM_TYPES).map(([id, name]) => (
              <option key={id} value={id}>{name}</option>
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
        {hasFilters && (
          <button
            onClick={clearFilters}
            className="text-xs text-eq-muted hover:text-eq-text underline"
          >
            Clear filters
          </button>
        )}
      </div>

      {!isEnabled && (
        <p className="text-eq-muted text-sm">Use the search bar above or select a filter to browse items.</p>
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
                <SortHeader col="itemtype" label="Type" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                <SortHeader col="ac" label="AC" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                <SortHeader col="damage" label="Dmg / Dly" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                <th className="py-2 pr-4 text-eq-muted">Flags</th>
                <th className="py-2 pr-4 text-eq-muted">Slots</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-eq-border/50">
              {data.map((item) => (
                <tr key={item.id} className="hover:bg-eq-panel/40">
                  <td className="py-1.5 pr-4 text-eq-muted">{item.id}</td>
                  <td className="py-1.5 pr-4">
                    <Link to={`/items/${item.id}`}>{item.name}</Link>
                    {item.magic ? <span className="ml-1 text-xs text-eq-accent">M</span> : null}
                  </td>
                  <td className="py-1.5 pr-4 text-eq-muted">{ITEM_TYPES[item.itemtype] ?? `Type ${item.itemtype}`}</td>
                  <td className="py-1.5 pr-4 text-eq-muted">{item.ac || '—'}</td>
                  <td className="py-1.5 pr-4 text-eq-muted">
                    {item.damage
                      ? `${item.damage}/${item.delay} (${(item.damage / item.delay).toFixed(2)})`
                      : '—'}
                  </td>
                  <td className="py-1.5 pr-4 text-xs space-x-1">
                    {!item.nodrop ? <span className="text-eq-danger">ND</span> : null}
                    {!item.norent ? <span className="text-yellow-400">NR</span> : null}
                  </td>
                  <td className="py-1.5 pr-4 text-eq-muted">
                    {SLOT_BITS.filter(([bit]) => item.slots && (item.slots & bit)).map(([, name]) => (
                      <span key={name} className="inline-block border border-eq-muted/50 rounded px-1">
                        {name}
                      </span>
                    ))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {data.length === 0 && (
            <p className="text-eq-muted text-sm mt-4">No items found.</p>
          )}
        </div>
      )}
    </div>
  );
}
