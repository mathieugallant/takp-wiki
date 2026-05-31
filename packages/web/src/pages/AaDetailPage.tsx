import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api.js';
import { StatBlock } from '../components/StatBlock.js';
import { RelatedList } from '../components/RelatedList.js';
import { EntityLink } from '../components/EntityLink.js';
import { LoadingSpinner, ErrorMessage } from '../components/Feedback.js';
import type { AaRank, AaEffect, SpellSummary } from '../api.js';

const CLASS_NAMES = ['', 'Warrior', 'Cleric', 'Paladin', 'Ranger', 'Shadow Knight', 'Druid',
  'Monk', 'Bard', 'Rogue', 'Shaman', 'Necromancer', 'Wizard', 'Magician', 'Enchanter', 'Beastlord'];

function classesFromBitmask(mask: number): string {
  const names: string[] = [];
  CLASS_NAMES.forEach((name, i) => {
    if (i > 0 && mask & (1 << (i - 1))) names.push(name);
  });
  return names.join(', ') || 'All';
}

export default function AaDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, error } = useQuery({
    queryKey: ['aa', id],
    queryFn: () => api.aa(id!),
    enabled: !!id,
  });

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={(error as Error).message} />;
  if (!data) return null;

  const aa = data.aa;
  const effectsByRank = data.effects.reduce<Record<number, AaEffect[]>>((acc, e) => {
    (acc[e.rank_id] ??= []).push(e);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-eq-gold">{aa.name}</h1>
        {aa.description && <p className="text-eq-muted text-sm">{aa.description}</p>}
      </div>

      <StatBlock rows={[
        { label: 'Classes', value: classesFromBitmask(aa.classes) },
      ]} />

      <section className="space-y-3">
        <h2 className="text-eq-gold font-semibold text-sm uppercase tracking-wide">Ranks</h2>
        <div className="space-y-2">
          {data.ranks.map((rank) => {
            const spellForRank = data.linked_spells.find((s) => s.id === rank.spell_id);
            const rankEffects = effectsByRank[rank.id] ?? [];
            return (
              <div key={rank.id} className="border border-eq-border rounded p-3 text-sm space-y-1">
                <div className="flex gap-4 text-eq-text">
                  <span className="text-eq-gold font-medium">Rank {rank.rank_num}</span>
                  <span className="text-eq-muted">Cost: {rank.cost} AA pts</span>
                  {rank.max_level > 0 && <span className="text-eq-muted">Max Level: {rank.max_level}</span>}
                </div>
                {spellForRank && (
                  <div>
                    <span className="text-eq-muted mr-2">Grants spell:</span>
                    <EntityLink type="spell" id={spellForRank.id} name={spellForRank.name} />
                  </div>
                )}
                {rankEffects.length > 0 && (
                  <ul className="text-eq-muted text-xs space-y-0.5 pl-2 border-l border-eq-border">
                    {rankEffects.map((e, i) => (
                      <li key={i}>Effect {e.effect_id}: {e.base1} / {e.base2}</li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <RelatedList<SpellSummary>
        title="Linked Spells"
        items={data.linked_spells}
        renderItem={(s) => (
          <li key={s.id} className="text-sm">
            <EntityLink type="spell" id={s.id} name={s.name} />
          </li>
        )}
      />
    </div>
  );
}
