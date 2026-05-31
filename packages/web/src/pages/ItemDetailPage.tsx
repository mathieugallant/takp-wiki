import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api, formatNpcName } from '../api.js';
import { StatBlock } from '../components/StatBlock.js';
import { RelatedList } from '../components/RelatedList.js';
import { EntityLink } from '../components/EntityLink.js';
import { LoadingSpinner, ErrorMessage } from '../components/Feedback.js';
import type { MerchantSource, RecipeRef, LootSource, QuestData } from '../api.js';

const ITEM_TYPES: Record<number, string> = {
  0: 'Melee 1H', 1: 'Melee 2H Slashing', 2: 'Piercing', 3: 'Melee 1H Blunt',
  4: 'Melee 2H Blunt', 5: 'Archery', 7: 'Throwing', 8: 'Shield', 10: 'Armor',
  11: 'Gems', 12: 'Lockpick', 14: 'Food', 15: 'Drink', 16: 'Light',
  17: 'Combinable', 18: 'Bandage', 19: 'Thrown', 20: 'Spell Scroll',
  23: 'Key', 24: 'Compass', 26: 'Fishing Pole', 27: 'Fishing Bait',
  29: 'Container', 31: 'Note', 35: 'Augmentation',
};

const SLOT_NAMES: Record<number, string> = {
  1: 'Ear', 2: 'Head', 3: 'Face', 4: 'Ear', 5: 'Neck', 6: 'Shoulders',
  7: 'Arms', 8: 'Back', 9: 'Wrist', 10: 'Wrist', 11: 'Range', 12: 'Hands',
  13: 'Primary', 14: 'Secondary', 15: 'Ring', 16: 'Ring', 17: 'Chest',
  18: 'Legs', 19: 'Feet', 20: 'Waist', 21: 'Ammo',
};

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
  const names: string[] = [];
  Object.entries(SLOT_NAMES).forEach(([bit, name]) => {
    if (slotbitmask & (1 << (parseInt(bit) - 1))) names.push(name);
  });
  return names.join(', ') || '—';
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
