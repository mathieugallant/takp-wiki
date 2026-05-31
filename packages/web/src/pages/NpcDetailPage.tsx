import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api, formatNpcName } from '../api.js';
import { StatBlock } from '../components/StatBlock.js';
import { RelatedList } from '../components/RelatedList.js';
import { EntityLink } from '../components/EntityLink.js';
import { LoadingSpinner, ErrorMessage } from '../components/Feedback.js';
import type { LootEntry, MerchantItem, SpellEntry, SpawnLocation, QuestData } from '../api.js';

const CLASS_NAMES = ['', 'Warrior', 'Cleric', 'Paladin', 'Ranger', 'Shadow Knight', 'Druid',
  'Monk', 'Bard', 'Rogue', 'Shaman', 'Necromancer', 'Wizard', 'Magician', 'Enchanter', 'Beastlord'];
const RACE_NAMES: Record<number, string> = {
  1: 'Human', 2: 'Barbarian', 3: 'Erudite', 4: 'Wood Elf', 5: 'High Elf', 6: 'Dark Elf',
  7: 'Half Elf', 8: 'Dwarf', 9: 'Troll', 10: 'Ogre', 11: 'Halfling', 12: 'Gnome',
};

export default function NpcDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, error } = useQuery({
    queryKey: ['npc', id],
    queryFn: () => api.npc(id!),
    enabled: !!id,
  });

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={(error as Error).message} />;
  if (!data) return null;

  // Pull typed fields from the record
  const n = data.npc;
  const nStr = (k: string) => n[k] as string | null;
  const nNum = (k: string) => n[k] as number;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-eq-gold">{formatNpcName(nStr('name'))}</h1>
        {nStr('lastname') && <p className="text-eq-muted text-sm">{nStr('lastname')}</p>}
        <p className="text-eq-muted text-sm">
          {CLASS_NAMES[nNum('class')] ?? `Class ${n.class}`}
          {' · '}
          {RACE_NAMES[nNum('race')] ?? `Race ${n.race}`}
          {' · '}
          L{nNum('level')}
        </p>
      </div>

      <StatBlock rows={[
        { label: 'HP', value: nNum('hp') },
        { label: 'Mana', value: nNum('mana') },
        { label: 'AC', value: nNum('AC') },
        { label: 'Attack', value: `${nNum('mindmg')}–${nNum('maxdmg')}` },
        { label: 'STR', value: nNum('STR') },
        { label: 'STA', value: nNum('STA') },
        { label: 'DEX', value: nNum('DEX') },
        { label: 'AGI', value: nNum('AGI') },
        { label: 'INT', value: nNum('INT') },
        { label: 'WIS', value: nNum('WIS') },
        { label: 'CHA', value: nNum('CHA') },
        { label: 'MR', value: nNum('MR') },
        { label: 'CR', value: nNum('CR') },
        { label: 'DR', value: nNum('DR') },
        { label: 'FR', value: nNum('FR') },
        { label: 'PR', value: nNum('PR') },
        { label: 'Aggro Radius', value: nNum('aggroradius') },
        { label: 'Run Speed', value: nNum('runspeed') },
        { label: 'Rare Spawn', value: nNum('rare_spawn') ? 'Yes' : 'No' },
        { label: 'Faction', value: nStr('faction_name') ? <EntityLink type="faction" id={nNum('npc_faction_id')} name={nStr('faction_name')!} /> : '—' },
      ]} />

      <RelatedList<SpawnLocation>
        title="Spawn Locations"
        items={data.spawn_locations}
        renderItem={(loc) => (
          <li key={loc.spawn2_id} className="text-sm flex gap-3">
            <EntityLink type="zone" id={loc.spawn2_id} name={loc.long_name || loc.zone} />
            <span className="text-eq-muted text-xs">{loc.x.toFixed(1)}, {loc.y.toFixed(1)}, {loc.z.toFixed(1)}</span>
          </li>
        )}
      />

      <RelatedList<LootEntry>
        title="Loot"
        items={data.loot}
        renderItem={(item) => (
          <li key={item.id} className="text-sm flex gap-3">
            <EntityLink type="item" id={item.id} name={item.name} />
            <span className="text-eq-muted text-xs">{item.final_pct}%</span>
          </li>
        )}
      />

      {data.merchant_inventory.length > 0 && (
        <RelatedList<MerchantItem>
          title="Merchant Inventory"
          items={data.merchant_inventory}
          renderItem={(item) => (
            <li key={item.id} className="text-sm flex gap-3">
              <EntityLink type="item" id={item.id} name={item.name} />
              {item.quantity > 0 && <span className="text-eq-muted text-xs">qty {item.quantity}</span>}
              {item.faction_required > 0 && (
                <span className="text-eq-muted text-xs">faction req {item.faction_required}</span>
              )}
            </li>
          )}
        />
      )}

      <RelatedList<SpellEntry>
        title="Spells"
        items={data.spells}
        renderItem={(s) => (
          <li key={s.id} className="text-sm flex gap-3">
            <EntityLink type="spell" id={s.id} name={s.name} />
            {s.minlevel > 0 && <span className="text-eq-muted text-xs">min L{s.minlevel}</span>}
          </li>
        )}
      />

      {data.emotes.length > 0 && (
        <RelatedList
          title="Emotes"
          items={data.emotes}
          renderItem={(e) => (
            <li key={e.id} className="text-sm text-eq-muted italic">&ldquo;{e.text}&rdquo;</li>
          )}
          defaultOpen={false}
        />
      )}

      <RelatedList<QuestData>
        title="Quests"
        items={data.quests}
        renderItem={(q) => (
          <li key={q.file_path} className="text-sm flex gap-3">
            <EntityLink
              type="quest"
              id={q.file_path}
              name={formatNpcName(q.npc_name)}
              questPath={`${q.zone}/${q.npc_name}`}
            />
            <span className="text-eq-muted text-xs">{`${q.zone}`}</span>
          </li>
        )}
      />
    </div>
  );
}
