const BASE = '/api';

/**
 * Format a raw NPC name from the database for display.
 * EQEmu stores NPC names with underscores in place of spaces (e.g. "a_lesser_spirit").
 * The game client replaces underscores with spaces and capitalises the first letter.
 */
export function formatNpcName(raw: string | null | undefined): string {
  if (!raw) return '';
  const spaced = raw.replace(/_/g, ' ');
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

async function get<T>(path: string, params?: Record<string, string>): Promise<T> {
  const url = new URL(BASE + path, window.location.origin);
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== '') url.searchParams.set(k, v);
    });
  }
  const res = await fetch(url.toString());
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error((err as { error: string }).error ?? res.statusText);
  }
  return res.json() as Promise<T>;
}

export const api = {
  search: (q: string, types?: string[]) =>
    get<Record<string, SearchResult[]>>('/search', {
      q,
      ...(types?.length ? { types: types.join(',') } : {}),
    }),

  zones: (params?: { search?: string; sort?: string; dir?: string; page?: string }) => get<Zone[]>('/zones', params),
  zone: (id: string | number) => get<ZoneDetail>(`/zones/${id}`),

  npcs: (params?: { search?: string; zone?: string; sort?: string; dir?: string; page?: string }) =>
    get<NpcSummary[]>('/npcs', params),
  npc: (id: string | number) => get<NpcDetail>(`/npcs/${id}`),

  items: (params?: { search?: string; class?: string; race?: string; type?: string; level?: string; effect?: string; sort?: string; dir?: string; page?: string }) => get<ItemSummary[]>('/items', params),
  item: (id: string | number) => get<ItemDetail>(`/items/${id}`),

  spells: (params?: { search?: string; class?: string; level?: string; effect?: string; sort?: string; dir?: string; page?: string }) =>
    get<SpellSummary[]>('/spells', params),
  spell: (id: string | number) => get<SpellDetail>(`/spells/${id}`),

  factions: (params?: { search?: string; sort?: string; dir?: string; page?: string }) =>
    get<FactionSummary[]>('/factions', params),
  faction: (id: string | number) => get<FactionDetail>(`/factions/${id}`),

  aas: (params?: { search?: string; class?: string; level?: string; effect?: string; sort?: string; dir?: string; page?: string }) =>
    get<AaSummary[]>('/aas', params),
  aa: (id: string | number) => get<AaDetail>(`/aas/${id}`),

  recipes: (params?: { search?: string; skill?: string; sort?: string; dir?: string; page?: string }) =>
    get<RecipeSummary[]>('/recipes', params),
  recipe: (id: string | number) => get<RecipeDetail>(`/recipes/${id}`),

  quest: (zone: string, npc: string) => get<QuestData>(`/quests/${encodeURIComponent(zone)}/${encodeURIComponent(npc)}`),
  questsForZone: (zone: string) => get<QuestData[]>(`/quests/${encodeURIComponent(zone)}`),
};

// ── Types ──────────────────────────────────────────────────────

export interface SearchResult {
  id: number;
  name: string;
  _type: string;
  [key: string]: unknown;
}

export interface Zone {
  id: number;
  short_name: string;
  long_name: string;
  expansion: number;
  min_level: number;
  hotzone: number;
}

export interface ZoneDetail {
  zone: Zone & Record<string, unknown>;
  npcs: NpcSummary[];
  zone_points: ZonePoint[];
  quests: QuestData[];
}

export interface ZonePoint {
  id: number;
  zone: string;
  target_zone_id: number;
  dest_short: string;
  dest_long: string;
}

export interface NpcSummary {
  id: number;
  name: string;
  lastname?: string;
  level: number;
  class: number;
  race: number;
  hp: number;
}

export interface NpcDetail {
  npc: NpcSummary & Record<string, unknown>;
  spawn_locations: SpawnLocation[];
  loot: LootEntry[];
  merchant_inventory: MerchantItem[];
  spells: SpellEntry[];
  emotes: Emote[];
  quests: QuestData[];
}

export interface SpawnLocation {
  zone: string;
  long_name: string;
  x: number;
  y: number;
  z: number;
  spawn2_id: number;
}

export interface LootEntry {
  id: number;
  name: string;
  icon: number;
  drop_chance: number;
  table_chance: number;
  final_pct: number;
}

export interface MerchantItem {
  id: number;
  name: string;
  icon: number;
  slot: number;
  quantity: number;
  faction_required: number;
  level_required: number;
  classes_required: number;
}

export interface SpellEntry {
  id: number;
  name: string;
  priority: number;
  minlevel: number;
}

export interface Emote {
  id: number;
  text: string;
  type: number;
  event_: number;
  time_start: number;
  time_end: number;
}

export interface ItemSummary {
  id: number;
  name: string;
  icon: number;
  itemtype: number;
  ac: number;
  damage: number;
  delay: number;
  weight: number;
  magic: number;
  nodrop: number;
  norent: number;
}

export interface ItemDetail {
  item: ItemSummary & Record<string, unknown>;
  spells: {
    click: SpellSummary | null;
    worn: SpellSummary | null;
    proc: SpellSummary | null;
    focus: SpellSummary | null;
    scroll: SpellSummary | null;
  };
  merchants: MerchantSource[];
  recipes_producing: RecipeRef[];
  recipes_consuming: RecipeRef[];
  loot_sources: LootSource[];
  quests: QuestData[];
}

export interface MerchantSource {
  npc_id: number;
  npc_name: string;
  slot: number;
  quantity: number;
  faction_required: number;
}

export interface RecipeRef {
  id: number;
  recipe_name: string;
  tradeskill: number;
  trivial: number;
  skillneeded: number;
  qty: number;
}

export interface LootSource {
  npc_id: number;
  npc_name: string;
  drop_chance: number;
  table_chance: number;
  final_pct: number;
}

export interface SpellSummary {
  id: number;
  name: string;
  mana: number;
  casttime?: number;
  range?: number;
}

export interface SpellDetail {
  spell: SpellSummary & Record<string, unknown>;
  effects: { label: string; base: number }[];
  duration_label: string | null;
  env_label: string | null;
  time_label: string | null;
  good_effect_label: string | null;
  reagents: ItemSummary[];
  npc_casters: NpcSummary[];
  items: (ItemSummary & { effect_type: string })[];
}

export interface FactionSummary {
  id: number;
  name: string;
  base: number;
  min_cap: number;
  max_cap: number;
}

export interface FactionDetail {
  faction: FactionSummary;
  npcs: NpcSummary[];
}

export interface AaSummary {
  id: number;
  name: string;
  type: number;
  classes: number;
  races: number;
  description: string;
  category: number;
}

/** Full altadv_vars row + extra API fields */
export interface AaVars extends AaSummary {
  cost: number;
  cost_inc: number;
  max_level: number;
  class_type: number;
  level_inc: number;
  spellid: number;
  spell_type: number;
  spell_refresh: number;
  prereq_skill: number;
  prereq_minpoints: number;
  aa_expansion: number;
  special_category: number;
  account_time_required: number;
  eqmacid: string;
  [key: string]: unknown;
}

export interface AaDetail {
  aa: AaVars;
  actions: AaAction[];
  /** Effects keyed by 1-indexed rank number */
  effects_by_rank: Record<string, AaEffect[]>;
  prereq_name: string | null;
  linked_spells: SpellSummary[];
}

/** Row from aa_actions; rank is 0-indexed */
export interface AaAction {
  rank: number;
  reuse_time: number;
  spell_id: number;
  target: number;
  nonspell_action: number;
  nonspell_mana: number;
  nonspell_duration: number;
  redux_aa: number;
  redux_rate: number;
  redux_aa2: number;
  redux_rate2: number;
}

/** Row from aa_effects; aaid = skill_id + rank - 1 */
export interface AaEffect {
  aaid: number;
  slot: number;
  effectid: number;
  effect_name: string;
  base1: number;
  base2: number;
}

export interface RecipeSummary {
  id: number;
  name: string;
  tradeskill: number;
  trivial: number;
  skillneeded: number;
}

export interface RecipeDetail {
  recipe: RecipeSummary & { tradeskill_name: string };
  ingredients: RecipeEntry[];
  outputs: RecipeEntry[];
  containers: RecipeEntry[];
}

export interface RecipeEntry {
  item_id: number;
  item_name: string;
  icon: number;
  componentcount: number;
  successcount: number;
  failcount: number;
  iscontainer: number;
}

export interface FactionChange {
  faction_id: number;
  delta: number;
}

export interface QuestReward {
  copper: number;
  silver: number;
  gold: number;
  platinum: number;
  item_id: number | null;
  item_choices: number[] | null;
  exp: number;
}

export interface TriggerItem {
  item_id: number;
  count: number;
}

export interface Interaction {
  event: string;
  trigger_keywords: string[];
  trigger_items: TriggerItem[];
  items_required_gate: number[];
  faction_required: number | null;
  responses: string[];
  responses_fail: string[];
  faction_changes: FactionChange[];
  rewards: QuestReward[];
  items_given: number[];
  npcs_spawned: number[];
  spells_cast: number[];
}

export interface QuestData {
  zone: string;
  npc_name: string;
  file_path: string;
  is_encounter: boolean;
  events: string[];
  keywords: string[];
  dialogs: string[];
  items_required: number[];
  items_rewarded: number[];
  npcs_spawned: number[];
  spells_cast: number[];
  factions_modified: number[];
  interactions: Interaction[];
  match_coverage: number;
}
