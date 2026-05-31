import { Link } from 'react-router-dom';

type EntityType = 'npc' | 'item' | 'spell' | 'zone' | 'faction' | 'aa' | 'recipe' | 'quest';

interface EntityLinkProps {
  type: EntityType;
  id: string | number;
  name: string;
  /** For quests: zone/npc format */
  questPath?: string;
  className?: string;
}

const TYPE_PATHS: Record<EntityType, string> = {
  npc: '/npcs',
  item: '/items',
  spell: '/spells',
  zone: '/zones',
  faction: '/factions',
  aa: '/aas',
  recipe: '/recipes',
  quest: '/quests',
};

export function EntityLink({ type, id, name, questPath, className }: EntityLinkProps) {
  let to: string;
  if (type === 'quest') {
    const raw = questPath ?? String(id);
    // Encode each segment so special chars like '#' don't break the URL.
    const encoded = raw.split('/').map(encodeURIComponent).join('/');
    to = `/quests/${encoded}`;
  } else {
    to = `${TYPE_PATHS[type]}/${id}`;
  }
  return (
    <Link to={to} className={className ?? 'text-eq-accent hover:underline'}>
      {name}
    </Link>
  );
}
