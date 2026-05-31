import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { SearchBar } from './SearchBar.js';

interface LayoutProps {
  children: React.ReactNode;
}

const NAV_LINKS = [
  { to: '/search', label: 'All' },
  { to: '/zones', label: 'Zones' },
  { to: '/npcs', label: 'NPCs' },
  { to: '/items', label: 'Items' },
  { to: '/spells', label: 'Spells' },
  { to: '/factions', label: 'Factions' },
  { to: '/aas', label: 'AAs' },
  { to: '/recipes', label: 'Recipes' },
];

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const q = searchParams.get('q');

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-eq-panel border-b border-eq-border sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-6">
          <Link to="/" className="text-eq-gold font-bold text-lg shrink-0 no-underline hover:no-underline">
            TAKP Wiki
          </Link>
          <div className="flex-1 max-w-lg">
            <SearchBar />
          </div>
          <nav className="hidden lg:flex gap-4 text-sm">
            {NAV_LINKS.map(({ to, label }) => (
              <Link
                key={to}
                to={q ? `${to}?q=${encodeURIComponent(q)}` : to}
                className={`hover:text-eq-gold transition-colors ${
                  location.pathname.startsWith(to) ? 'text-eq-gold' : 'text-eq-muted'
                }`}
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6">{children}</main>
      <footer className="border-t border-eq-border text-center text-eq-muted text-xs py-3">
        TAKP Wiki — EQMacEmu data browser
      </footer>
    </div>
  );
}
