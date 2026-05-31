import { Link } from 'react-router-dom';
import { SearchBar } from '../components/SearchBar.js';

const ENTITY_CARDS = [
  { to: '/zones', label: 'Zones', desc: 'Explore all game zones and their contents' },
  { to: '/npcs', label: 'NPCs', desc: 'Non-player characters, merchants, and monsters' },
  { to: '/items', label: 'Items', desc: 'Equipment, consumables, quest items and more' },
  { to: '/spells', label: 'Spells', desc: 'Magic spells, effects, and components' },
  { to: '/factions', label: 'Factions', desc: 'Faction standings and related NPCs' },
  { to: '/aas', label: 'Alternate Abilities', desc: 'Class AA trees, ranks, and effects' },
  { to: '/recipes', label: 'Recipes', desc: 'Tradeskill recipes, ingredients, and outputs' },
];

export default function HomePage() {
  return (
    <div className="max-w-3xl mx-auto space-y-10">
      <div className="text-center space-y-3 pt-8">
        <h1 className="text-3xl font-bold text-eq-gold">TAKP Wiki</h1>
        <p className="text-eq-muted">
          Browse game data — NPCs, items, zones, spells, quests and more.
        </p>
        <div className="max-w-lg mx-auto pt-2">
          <SearchBar autoFocus placeholder="Search anything…" />
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {ENTITY_CARDS.map(({ to, label, desc }) => (
          <Link
            key={to}
            to={to}
            className="bg-eq-panel border border-eq-border rounded-lg p-4 hover:border-eq-accent transition-colors no-underline group"
          >
            <div className="text-eq-gold font-semibold group-hover:text-eq-accent transition-colors">
              {label}
            </div>
            <div className="text-eq-muted text-xs mt-1">{desc}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
