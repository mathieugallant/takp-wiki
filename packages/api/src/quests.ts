import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

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

export interface QuestIndex {
  by_zone: Record<string, string[]>;
  by_npc: Record<string, string[]>;
  by_item: Record<number, string[]>;
  by_spawned_npc: Record<number, string[]>;
}

const QUEST_DATA_DIR = path.resolve(
  process.env.QUEST_DATA_DIR ?? path.join(process.cwd(), '../../data/quests')
);

let _index: QuestIndex | null = null;
// Map from relative file_path → QuestData (lazy-loaded per-request to save startup RAM)
const _cache = new Map<string, QuestData>();

export async function getQuestIndex(): Promise<QuestIndex> {
  if (_index) return _index;
  const indexPath = path.join(QUEST_DATA_DIR, 'index.json');
  if (!existsSync(indexPath)) {
    console.warn(`Quest index not found at ${indexPath}. Run "npm run parse" first.`);
    _index = { by_zone: {}, by_npc: {}, by_item: {}, by_spawned_npc: {} };
    return _index;
  }
  const raw = await readFile(indexPath, 'utf-8');
  _index = JSON.parse(raw) as QuestIndex;
  return _index;
}

export async function getQuestData(relPath: string): Promise<QuestData | null> {
  if (_cache.has(relPath)) return _cache.get(relPath)!;
  const absPath = path.join(QUEST_DATA_DIR, relPath.replace(/\.lua$/, '.json'));
  if (!existsSync(absPath)) return null;
  const raw = await readFile(absPath, 'utf-8');
  const data = JSON.parse(raw) as QuestData;
  _cache.set(relPath, data);
  return data;
}

export async function getQuestsForZone(zone: string): Promise<QuestData[]> {
  const index = await getQuestIndex();
  const paths = index.by_zone[zone] ?? [];
  const results = await Promise.all(paths.map(getQuestData));
  return results.filter((d): d is QuestData => d !== null);
}

export async function getQuestsForItem(itemId: number): Promise<QuestData[]> {
  const index = await getQuestIndex();
  const paths = index.by_item[itemId] ?? [];
  const results = await Promise.all(paths.map(getQuestData));
  return results.filter((d): d is QuestData => d !== null);
}

export async function getQuestsForNpc(npcName: string): Promise<QuestData[]> {
  const index = await getQuestIndex();
  const paths = index.by_npc[npcName.toLowerCase()] ?? [];
  const results = await Promise.all(paths.map(getQuestData));
  return results.filter((d): d is QuestData => d !== null);
}
