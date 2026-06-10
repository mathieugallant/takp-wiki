import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api, formatNpcName } from '../api.js';
import { StatBlock } from '../components/StatBlock.js';
import { RelatedList } from '../components/RelatedList.js';
import { EntityLink } from '../components/EntityLink.js';
import { LoadingSpinner, ErrorMessage } from '../components/Feedback.js';
import type { MerchantSource, RecipeRef, LootSource, QuestData } from '../api.js';

export const ITEM_TYPES: Record<number, string> = {
  0: "1HS",
  1: "2HS",
  2: "Piercing",
  3: "1HB",
  4: "2HB",
  5: "Archery",
  6: "Unused",
  7: "Throwing",
  8: "Shield",
  9: "Unused",
  10: "Defense",
  11: "Involves Tradeskills",
  12: "Lock Picking",
  13: "Unused",
  14: "Food",
  15: "Drink",
  16: "Light Source",
  17: "Common Inventory Item",
  18: "Bind Wound",
  19: "Thrown Casting Items",
  20: "Spells / Song Sheets",
  21: "Potions",
  22: "Fletched Arrows",
  23: "Wind Instruments",
  24: "Stringed Instruments",
  25: "Brass Instruments",
  26: "Drum Instruments",
  27: "Ammo",
  28: "Unused",
  29: "Jewlery Items",
  30: "Unused",
  31: "Readable Notes",
  32: "Readable Books",
  33: "Keys",
  34: "Odd Items",
  35: "2H Pierce",
  36: "Fishing Poles",
  37: "Fishing Bait",
  38: "Alcoholic Beverages",
  39: "More Keys",
  40: "Compasses",
  41: "Unused",
  42: "Poisons",
  43: "Unused",
  44: "Unused",
  45: "Hand to Hand",
  46: "Unused",
  47: "Unused",
  48: "Unused",
  49: "Unused",
  50: "Unused",
  51: "Unused",
  52: "Charms",
  53: "Dyes",
  54: "Augments",
  55: "Augment Solvents",
  56: "Augment Distillers",
  58: "Fellowship Banner Materials",
  60: "Cultural Armor Manuals",
  63: "New Currencies like Orum",
};

export const SLOT_BITS: [number, string][] = [
  [1, 'Cursor'],
  [2, 'Ear01'],
  [4, 'Head'],
  [8, 'Face'],
  [16, 'Ear02'],
  [32, 'Neck'],
  [64, 'Shoulders'],
  [128, 'Arms'],
  [256, 'Back'],
  [512, 'Bracer01'],
  [1024, 'Bracer02'],
  [2048, 'Range'],
  [4096, 'Hands'],
  [8192, 'Primary'],
  [16384, 'Secondary'],
  [32768, 'Ring01'],
  [65536, 'Ring02'],
  [131072, 'Chest'],
  [262144, 'Legs'],
  [524288, 'Feet'],
  [1048576, 'Waist'],
  [2097152, 'Ammo'],
];

const CLASS_BITS: [number, string][] = [
  [1, 'Warrior'], [2, 'Cleric'], [4, 'Paladin'], [8, 'Ranger'],
  [16, 'Shadow Knight'], [32, 'Druid'], [64, 'Monk'], [128, 'Bard'],
  [256, 'Rogue'], [512, 'Shaman'], [1024, 'Necromancer'], [2048, 'Wizard'],
  [4096, 'Magician'], [8192, 'Enchanter'], [16384, 'Beastlord'],
];

const RACE_BITS: [number, string][] = [
  [1, 'Human'], [2, 'Barbarian'], [4, 'Erudite'], [8, 'Wood Elf'],
  [16, 'High Elf'], [32, 'Dark Elf'], [64, 'Half Elf'], [128, 'Dwarf'],
  [256, 'Troll'], [512, 'Ogre'], [1024, 'Halfling'], [2048, 'Gnome'],
  [4096, 'Iksar'], [8192, 'Vah Shir'],
];

function classesFromBitmask(mask: number): string {
  if (mask === 65535 || mask === 0) return 'All';
  return CLASS_BITS.filter(([bit]) => mask & bit).map(([, n]) => n).join(', ') || '—';
}

function racesFromBitmask(mask: number): string {
  if (mask === 65535 || mask === 0) return 'All';
  return RACE_BITS.filter(([bit]) => mask & bit).map(([, n]) => n).join(', ') || '—';
}

function slotNames(slotbitmask: number): string {
  return SLOT_BITS.filter(([bit]) => slotbitmask & bit).map(([, n]) => n).join(', ') || '—';
}

export default function ItemDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, error } = useQuery({
    queryKey: ['item', id],
    queryFn: () => api.item(id!),
    enabled: !!id,
  });

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={(error as Error).message} />;
  if (!data) return null;

  const item = data.item;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-eq-gold">{item.name as string}</h1>
        {item.lore ? <p className="text-eq-muted text-sm italic">{item.lore as string}</p> : null}
        <div className="flex gap-3 mt-1 text-xs">
          {(item.magic as number) ? <span className="bg-eq-accent/20 text-eq-accent px-2 py-0.5 rounded">MAGIC</span> : null}
          {!(item.nodrop as number) ? <span className="bg-eq-danger/20 text-eq-danger px-2 py-0.5 rounded">NO DROP</span> : null}
          {!(item.norent as number) ? <span className="bg-yellow-800/30 text-yellow-400 px-2 py-0.5 rounded">NO RENT</span> : null}
        </div>
      </div>

      <StatBlock rows={[
        { label: 'Type', value: ITEM_TYPES[item.itemtype as number] ?? `Type ${item.itemtype}` },
        { label: 'Slot(s)', value: slotNames(item.slots as number) },
        { label: 'AC', value: (item.ac as number) || null },
        { label: 'Damage', value: (item.damage as number) || null },
        { label: 'Delay', value: (item.delay as number) || null },
        (item.damage as number) && (item.delay as number)
          ? { label: 'Ratio', value: ((item.damage as number) / (item.delay as number)).toFixed(2) }
          : null,
        { label: 'Req. Level', value: (item.reqlevel as number) || null },
        { label: 'Weight', value: `${((item.weight as number) / 10).toFixed(1)} st` },
        { label: 'HP', value: (item.hp as number) || null },
        { label: 'Mana', value: (item.mana as number) || null },
        { label: 'Endurance', value: (item.endurance as number) || null },
        { label: 'STR', value: (item.astr as number) || null },
        { label: 'STA', value: (item.asta as number) || null },
        { label: 'DEX', value: (item.adex as number) || null },
        { label: 'AGI', value: (item.aagi as number) || null },
        { label: 'INT', value: (item.aint as number) || null },
        { label: 'WIS', value: (item.awis as number) || null },
        { label: 'CHA', value: (item.acha as number) || null },
        { label: 'Stack Size', value: (item.stacksize as number) > 1 ? String(item.stacksize) : null },
        { label: 'Price', value: (item.price as number) > 0 ? `${item.price as number} cp` : null },
      ]} />

      {/* Spell Effects */}
      {(data.spells.scroll || data.spells.click || data.spells.worn || data.spells.proc || data.spells.focus) && (
        <section className="space-y-2">
          <h2 className="text-eq-gold font-semibold text-sm uppercase tracking-wide">Spell Effects</h2>
          <ul className="space-y-1 text-sm">
            {data.spells.scroll && (
              <li><span className="text-eq-muted mr-2">Teaches:</span>
                <EntityLink type="spell" id={data.spells.scroll.id} name={data.spells.scroll.name} />
              </li>
            )}
            {data.spells.click && (
              <li><span className="text-eq-muted mr-2">Click:</span>
                <EntityLink type="spell" id={data.spells.click.id} name={data.spells.click.name} />
              </li>
            )}
            {data.spells.worn && (
              <li><span className="text-eq-muted mr-2">Worn:</span>
                <EntityLink type="spell" id={data.spells.worn.id} name={data.spells.worn.name} />
              </li>
            )}
            {data.spells.proc && (
              <li><span className="text-eq-muted mr-2">Proc:</span>
                <EntityLink type="spell" id={data.spells.proc.id} name={data.spells.proc.name} />
              </li>
            )}
            {data.spells.focus && (
              <li><span className="text-eq-muted mr-2">Focus:</span>
                <EntityLink type="spell" id={data.spells.focus.id} name={data.spells.focus.name} />
              </li>
            )}
          </ul>
        </section>
      )}

      {/* Classes & Races */}
      {(() => {
        const classMask = item.classes as number;
        const raceMask = item.races as number;
        const classesStr = classMask ? classesFromBitmask(classMask) : null;
        const racesStr = raceMask ? racesFromBitmask(raceMask) : null;
        if (!classesStr && !racesStr) return null;
        return (
          <section className="space-y-2">
            <h2 className="text-eq-gold font-semibold text-sm uppercase tracking-wide">Usable By</h2>
            <div className="space-y-1 text-sm">
              {classesStr && (
                <div>
                  <span className="text-eq-muted mr-2">Classes:</span>
                  <span className="text-eq-text">{classesStr}</span>
                </div>
              )}
              {racesStr && (
                <div>
                  <span className="text-eq-muted mr-2">Races:</span>
                  <span className="text-eq-text">{racesStr}</span>
                </div>
              )}
            </div>
          </section>
        );
      })()}

      <RelatedList<MerchantSource>
        title="Sold by"
        items={data.merchants}
        renderItem={(m) => (
          <li key={m.npc_id} className="text-sm flex gap-3">
            <EntityLink type="npc" id={m.npc_id} name={formatNpcName(m.npc_name)} />
            {m.zone && <span className="text-eq-muted text-xs">{m.zone}</span>}
            {m.faction_required > 0 && <span className="text-eq-muted text-xs">faction {m.faction_required}</span>}
          </li>
        )}
      />

      <RelatedList<RecipeRef>
        title="Produced by Recipes"
        items={data.recipes_producing}
        renderItem={(r) => (
          <li key={r.id} className="text-sm flex gap-3">
            <EntityLink type="recipe" id={r.id} name={r.recipe_name} />
            <span className="text-eq-muted text-xs">trivial {r.trivial}</span>
          </li>
        )}
      />

      <RelatedList<RecipeRef>
        title="Used in Recipes"
        items={data.recipes_consuming}
        renderItem={(r) => (
          <li key={r.id} className="text-sm flex gap-3">
            <EntityLink type="recipe" id={r.id} name={r.recipe_name} />
            <span className="text-eq-muted text-xs">trivial {r.trivial}</span>
          </li>
        )}
      />

      <RelatedList<LootSource>
        title="Dropped by"
        items={data.loot_sources}
        renderItem={(src) => (
          <li key={src.npc_id} className="text-sm flex gap-3">
            <EntityLink type="npc" id={src.npc_id} name={formatNpcName(src.npc_name)} />
            {src.zone && <span className="text-eq-muted text-xs">{src.zone}</span>}
            <span className="text-eq-muted text-xs">{src.final_pct}%</span>
          </li>
        )}
      />

      <RelatedList<QuestData>
        title="Quests"
        items={data.quests}
        renderItem={(q) => (
          <li key={q.file_path} className="text-sm flex gap-3">
            <EntityLink
              type="quest"
              id={q.file_path}
              name={`${formatNpcName(q.npc_name)} (${q.zone})`}
              questPath={`${q.zone}/${q.npc_name}`}
            />
            <span className="text-eq-muted text-xs">
              {data.item.id && q.items_required.includes(data.item.id as number) ? 'requires' : 'rewards'}
            </span>
          </li>
        )}
      />
    </div>
  );
}
