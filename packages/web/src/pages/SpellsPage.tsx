import React from 'react';
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

export default function SpellsPage() {
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

  // When class filter is active, keep level as primary ordering.
  // If user explicitly sorts by level, honor that direction for group ordering.
  const effectiveSortCol = classFilter ? 'level' : sortCol;
  const effectiveSortDir = classFilter
    ? (sortCol === 'level' ? sortDir : 'asc')
    : sortDir;

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
    queryKey: ['spells', q, classFilter, levelFilter, effectFilter, effectiveSortCol, effectiveSortDir],
    queryFn: () => api.spells({ search: q, class: classFilter, level: levelFilter, effect: effectFilter, sort: effectiveSortCol, dir: effectiveSortDir }),
    enabled: isEnabled,
  });

  // Group spells by level when class filter is active
  const spellGroups = data && classFilter ? (() => {
    const withLevel: Map<number, typeof data> = new Map();
    const noLevel: typeof data = [];

    data.forEach(spell => {
      const level = spell.min_level != null && spell.min_level < 255 ? spell.min_level : null;
      if (level === null) {
        noLevel.push(spell);
      } else {
        if (!withLevel.has(level)) {
          withLevel.set(level, []);
        }
        withLevel.get(level)!.push(spell);
      }
    });

    // Sort each group by user's selected sort column
    const sortFn = (a: typeof data[0], b: typeof data[0]) => {
      let aVal: any = a[sortCol as keyof typeof a];
      let bVal: any = b[sortCol as keyof typeof b];
      
      if (aVal == null) aVal = '';
      if (bVal == null) bVal = '';
      
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
      }
      
      const aStr = String(aVal);
      const bStr = String(bVal);
      return sortDir === 'asc' ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
    };

    withLevel.forEach(spells => spells.sort(sortFn));
    noLevel.sort(sortFn);

    const grouped = Array.from(withLevel.entries()).sort((a, b) => {
      return sortCol === 'level' && sortDir === 'desc'
        ? b[0] - a[0]
        : a[0] - b[0];
    });

    return { withLevel: grouped, noLevel };
  })() : null;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-eq-gold">Spells</h1>

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
        <p className="text-eq-muted text-sm">Use the search bar above or select a filter to browse spells.</p>
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
                <SortHeader col="level" label="Level" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                <SortHeader col="mana" label="Mana" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                <SortHeader col="casttime" label="Cast Time" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                <SortHeader col="range" label="Range" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
              </tr>
            </thead>
            <tbody className="divide-y divide-eq-border/50">
              {spellGroups ? (
                <>
                  {spellGroups.withLevel.map(([level, spells]) => (
                    <React.Fragment key={`level-${level}`}>
                      <tr className="bg-eq-gold/10">
                        <td colSpan={6} className="py-1 px-2 text-eq-gold font-semibold text-xs uppercase tracking-wide">
                          Level {level}
                        </td>
                      </tr>
                      {spells.map((spell) => (
                        <tr key={spell.id} className="hover:bg-eq-panel/40">
                          <td className="py-1.5 pr-4 text-eq-muted">{spell.id}</td>
                          <td className="py-1.5 pr-4">
                            <Link to={`/spells/${spell.id}`}>{spell.name}</Link>
                          </td>
                          <td className="py-1.5 pr-4 text-eq-muted">
                            {spell.min_level != null && spell.min_level < 255 ? spell.min_level : '—'}
                          </td>
                          <td className="py-1.5 pr-4 text-eq-muted">{spell.mana || '—'}</td>
                          <td className="py-1.5 pr-4 text-eq-muted">
                            {spell.casttime != null ? `${(spell.casttime / 1000).toFixed(1)}s` : '—'}
                          </td>
                          <td className="py-1.5 pr-4 text-eq-muted">
                            {spell.range != null ? `${spell.range}` : '—'}
                          </td>
                        </tr>
                      ))}
                    </React.Fragment>
                  ))}
                  {spellGroups.noLevel.length > 0 && (
                    <React.Fragment key="no-level">
                      <tr className="bg-eq-muted/10">
                        <td colSpan={6} className="py-1 px-2 text-eq-muted font-semibold text-xs uppercase tracking-wide">
                          No Level Requirement
                        </td>
                      </tr>
                      {spellGroups.noLevel.map((spell) => (
                        <tr key={spell.id} className="hover:bg-eq-panel/40">
                          <td className="py-1.5 pr-4 text-eq-muted">{spell.id}</td>
                          <td className="py-1.5 pr-4">
                            <Link to={`/spells/${spell.id}`}>{spell.name}</Link>
                          </td>
                          <td className="py-1.5 pr-4 text-eq-muted">—</td>
                          <td className="py-1.5 pr-4 text-eq-muted">{spell.mana || '—'}</td>
                          <td className="py-1.5 pr-4 text-eq-muted">
                            {spell.casttime != null ? `${(spell.casttime / 1000).toFixed(1)}s` : '—'}
                          </td>
                          <td className="py-1.5 pr-4 text-eq-muted">
                            {spell.range != null ? `${spell.range}` : '—'}
                          </td>
                        </tr>
                      ))}
                    </React.Fragment>
                  )}
                </>
              ) : (
                data.map((spell) => (
                  <tr key={spell.id} className="hover:bg-eq-panel/40">
                    <td className="py-1.5 pr-4 text-eq-muted">{spell.id}</td>
                    <td className="py-1.5 pr-4">
                      <Link to={`/spells/${spell.id}`}>{spell.name}</Link>
                    </td>
                    <td className="py-1.5 pr-4 text-eq-muted">
                      {spell.min_level != null && spell.min_level < 255 ? spell.min_level : '—'}
                    </td>
                    <td className="py-1.5 pr-4 text-eq-muted">{spell.mana || '—'}</td>
                    <td className="py-1.5 pr-4 text-eq-muted">
                      {spell.casttime != null ? `${(spell.casttime / 1000).toFixed(1)}s` : '—'}
                    </td>
                    <td className="py-1.5 pr-4 text-eq-muted">
                      {spell.range != null ? `${spell.range}` : '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          {data.length === 0 && (
            <p className="text-eq-muted text-sm mt-4">No spells found.</p>
          )}
        </div>
      )}
    </div>
  );
}
