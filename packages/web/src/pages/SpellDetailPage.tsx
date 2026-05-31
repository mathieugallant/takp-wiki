import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api, formatNpcName } from '../api.js';
import { StatBlock } from '../components/StatBlock.js';
import { RelatedList } from '../components/RelatedList.js';
import { EntityLink } from '../components/EntityLink.js';
import { LoadingSpinner, ErrorMessage } from '../components/Feedback.js';
import type { NpcSummary, ItemSummary } from '../api.js';

const TARGET_TYPES: Record<number, string> = {
  1: 'Line of Sight', 2: 'Caster AE', 3: 'Group', 4: 'PB AE',
  5: 'Single', 6: 'Self', 8: 'Targeted AE', 11: 'Undead',
  13: 'Summoned', 14: 'Pet', 16: 'Plant', 24: 'Lifetap', 25: 'Pet2',
  41: 'Group v2', 42: 'AE Caster',
};
const RESIST_TYPES: Record<number, string> = {
  0: 'None', 1: 'Magic', 2: 'Fire', 3: 'Cold', 4: 'Poison', 5: 'Disease',
};

const SPELL_CLASS_NAMES = [
  'Warrior', 'Cleric', 'Paladin', 'Ranger', 'Shadow Knight', 'Druid',
  'Monk', 'Bard', 'Rogue', 'Shaman', 'Necromancer', 'Wizard', 'Magician',
  'Enchanter', 'Beastlord',
];

function spellClassesStr(spell: Record<string, unknown>): string | null {
  const entries: string[] = [];
  SPELL_CLASS_NAMES.forEach((name, i) => {
    const level = spell[`classes${i + 1}`] as number;
    if (level != null && level < 255) entries.push(`${name} (${level})`);
  });
  return entries.length ? entries.join(', ') : null;
}

export default function SpellDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, error } = useQuery({
    queryKey: ['spell', id],
    queryFn: () => api.spell(id!),
    enabled: !!id,
  });

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={(error as Error).message} />;
  if (!data) return null;

  const s = data.spell;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-eq-gold">{s.name as string}</h1>
      </div>

      <StatBlock rows={[
        { label: 'Mana', value: s.mana as number },
        { label: 'Cast Time', value: `${((s.cast_time as number) / 1000).toFixed(1)}s` },
        { label: 'Recovery', value: s.recovery_time ? `${((s.recovery_time as number) / 1000).toFixed(1)}s` : null },
        { label: 'Recast', value: s.recast_time ? `${((s.recast_time as number) / 1000).toFixed(1)}s` : null },
        { label: 'Duration', value: data.duration_label },
        { label: 'Range', value: s.range as number > 0 ? `${s.range} units` : null },
        { label: 'AE Range', value: s.aoerange as number > 0 ? `${s.aoerange} units` : null },
        { label: 'Target', value: TARGET_TYPES[s.targettype as number] ?? `Type ${s.targettype}` },
        { label: 'Resist', value: RESIST_TYPES[s.resisttype as number] ?? `Type ${s.resisttype}` },
        { label: 'Resist Diff', value: s.resist_difficulty as number || null },
        { label: 'Effect', value: data.good_effect_label },
        { label: 'Environment', value: data.env_label },
        { label: 'Time of Day', value: data.time_label },
        { label: 'Classes', value: spellClassesStr(s as Record<string, unknown>) },
      ]} />

      {data.effects.length > 0 && (
        <section className="space-y-1">
          <h2 className="text-eq-gold font-semibold text-sm uppercase tracking-wide">Effects</h2>
          <ul className="space-y-0.5 text-sm">
            {data.effects.map((e, i) => (
              <li key={i} className="text-eq-text">{e.label}</li>
            ))}
          </ul>
        </section>
      )}

      <RelatedList<ItemSummary>
        title="Reagents"
        items={data.reagents}
        renderItem={(item) => (
          <li key={item.id} className="text-sm">
            <EntityLink type="item" id={item.id} name={item.name} />
          </li>
        )}
      />

      <RelatedList<ItemSummary & { effect_type: string }>
        title="Items with this Effect"
        items={data.items}
        renderItem={(item) => (
          <li key={item.id} className="text-sm flex gap-3">
            <EntityLink type="item" id={item.id} name={item.name} />
            <span className="text-eq-muted text-xs capitalize">{item.effect_type}</span>
          </li>
        )}
      />

      <RelatedList<NpcSummary>
        title="Cast by NPCs"
        items={data.npc_casters}
        renderItem={(npc) => (
          <li key={npc.id} className="text-sm flex gap-3">
            <EntityLink type="npc" id={npc.id} name={formatNpcName(npc.name)} />
            <span className="text-eq-muted text-xs">L{npc.level}</span>
          </li>
        )}
        defaultOpen={false}
      />
    </div>
  );
}
