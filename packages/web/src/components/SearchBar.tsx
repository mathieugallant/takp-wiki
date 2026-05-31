import { useState, useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';

const LISTING_PATHS: Record<string, string> = {
  '/zones': 'zones',
  '/npcs': 'NPCs',
  '/items': 'items',
  '/spells': 'spells',
  '/factions': 'factions',
  '/aas': 'AAs',
  '/recipes': 'recipes',
};

export function SearchBar() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [searchParams] = useSearchParams();

  const listingLabel = LISTING_PATHS[pathname] ?? null;
  const currentQ = searchParams.get('q') ?? '';

  const [value, setValue] = useState(currentQ);

  useEffect(() => {
    setValue(currentQ);
  }, [pathname, currentQ]);

  const placeholder = listingLabel ? `Filter ${listingLabel}…` : 'Search anything…';

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = value.trim();
    if (q.length >= 2) {
      const dest = listingLabel ? pathname : '/search';
      navigate(`${dest}?q=${encodeURIComponent(q)}`);
    } else if (listingLabel) {
      navigate(pathname);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="flex-1 bg-eq-panel border border-eq-border rounded px-3 py-2 text-eq-text placeholder:text-eq-muted focus:outline-none focus:border-eq-accent text-sm"
      />
      <button
        type="submit"
        className="px-4 py-2 bg-eq-accent/20 border border-eq-accent text-eq-accent rounded text-sm hover:bg-eq-accent/30 transition-colors"
      >
        Search
      </button>
    </form>
  );
}
