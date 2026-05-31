const BASE = '/api';

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

  zones: (params?: { search?: string; page?: string }) => get<Zone[]>('/zones', params),
  zone: (id: string | number) => get<ZoneDetail>(`/zones/${id}`),

  npcs: (params?: { search?: string; zone?: string; page?: string }) =>
    get<NpcSummary[]>('/npcs', params),
  npc: (id: string | number) => get<NpcDetail>(`/npcs/${id}`),

  items: (params?: { search?: string; page?: string }) => get<ItemSummary[]>('/items', params),
  item: (id: string | number) => get<ItemDetail>(`/items/${id}`),

  spells: (params?: { search?: string; page?: string }) =>
    get<SpellSummary[]>('/spells', params),
  spell: (id: string | number) => get<SpellDetail>(`/spells/${id}`),

  factions: (params?: { search?: string; page?: string }) =>
    get<FactionSummary[]>('/factions', params),
  faction: (id: string | number) => get<FactionDetail>(`/factions/${id}`),

  aas: (params?: { search?: string; class?: string; page?: string }) =>
    get<AaSummary[]>('/aas', params),
  aa: (id: string | number) => get<AaDetail>(`/aas/${id}`),

  recipes: (params?: { search?: string; skill?: string; page?: string }) =>
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

export interface AaDetail {
  aa: AaSummary;
  ranks: AaRank[];
  effects: AaEffect[];
  linked_spells: SpellSummary[];
}

export interface AaRank {
  id: number;
  rank_num: number;
  cost: number;
  max_level: number;
  spell_id: number;
}

export interface AaEffect {
  rank_id: number;
  slot: number;
  effect_id: number;
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
