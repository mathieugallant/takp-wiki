/**
 * Central manifest: maps each route group to the DB tables it depends on.
 * Used by schema validation tests to detect drift between code and DB early.
 */
export const REQUIRED_TABLES: Record<string, string[]> = {
  zones: [
    'zone',
    'graveyard',
    'npc_types',
    'spawnentry',
    'spawngroup',
    'spawn2',
    'zone_points',
  ],
  npcs: [
    'npc_types',
    'npc_faction',
    'faction_list',
    'spawnentry',
    'spawngroup',
    'spawn2',
    'zone',
    'lootdrop_entries',
    'lootdrop',
    'loottable_entries',
    'loottable',
    'items',
    'merchantlist',
    'npc_spells_entries',
    'spells_new',
    'npc_emotes',
  ],
  items: [
    'items',
    'spells_new',
    'merchantlist',
    'npc_types',
    'tradeskill_recipe_entries',
    'tradeskill_recipe',
    'lootdrop_entries',
    'lootdrop',
    'loottable_entries',
    'loottable',
  ],
  spells: ['spells_new', 'items', 'npc_spells_entries', 'npc_types'],
  factions: ['faction_list', 'npc_types', 'npc_faction'],
  aas: ['altadv_vars', 'aa_actions', 'aa_effects', 'spells_new'],
  recipes: ['tradeskill_recipe', 'tradeskill_recipe_entries', 'items'],
  search: [
    'npc_types',
    'items',
    'spells_new',
    'zone',
    'faction_list',
    'altadv_vars',
    'tradeskill_recipe',
  ],
};

/** Flat deduplicated list of every table the API touches. */
export const ALL_REQUIRED_TABLES: string[] = [
  ...new Set(Object.values(REQUIRED_TABLES).flat()),
].sort();
