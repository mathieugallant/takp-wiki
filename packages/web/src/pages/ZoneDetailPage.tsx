import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api, formatNpcName } from '../api.js';
import { StatBlock } from '../components/StatBlock.js';
import { RelatedList } from '../components/RelatedList.js';
import { EntityLink } from '../components/EntityLink.js';
import { ResolvedEntityLink } from '../components/ResolvedEntityLink.js';
import { LoadingSpinner, ErrorMessage } from '../components/Feedback.js';
import type { NpcSummary, LootEntry, MerchantItem, SpellEntry, QuestData, QuestReward } from '../api.js';

const CLASS_NAMES = ['', 'Warrior', 'Cleric', 'Paladin', 'Ranger', 'Shadow Knight', 'Druid',
  'Monk', 'Bard', 'Rogue', 'Shaman', 'Necromancer', 'Wizard', 'Magician', 'Enchanter', 'Beastlord'];

const EXPANSION_NAMES: Record<number, string> = {
  0: 'Classic', 1: 'Kunark', 2: 'Velious', 3: 'Luclin', 4: 'Planes of Power',
};

function questRewards(q: QuestData): { itemIds: number[]; exp: number; coins: string } {
  let exp = 0;
  let platinum = 0, gold = 0, silver = 0, copper = 0;
  for (const ia of q.interactions) {
    for (const r of ia.rewards) {
      exp      += r.exp ?? 0;
      platinum += r.platinum ?? 0;
      gold     += r.gold ?? 0;
      silver   += r.silver ?? 0;
      copper   += r.copper ?? 0;
    }
  }
  const coinParts = [
    platinum && `${platinum}pp`,
    gold     && `${gold}gp`,
    silver   && `${silver}sp`,
    copper   && `${copper}cp`,
  ].filter(Boolean);
  return {
    itemIds: q.items_rewarded,
    exp,
    coins: coinParts.join(' '),
  };
}

export default function ZoneDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, error } = useQuery({
    queryKey: ['zone', id],
    queryFn: () => api.zone(id!),
    enabled: !!id,
  });

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={(error as Error).message} />;
  if (!data) return null;

  const z = data.zone;
  const expName = EXPANSION_NAMES[z.expansion as number] ?? `Exp ${z.expansion}`;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-eq-gold">{z.long_name as string}</h1>
        <p className="text-eq-muted text-sm">{z.zoneidnumber as number} &middot; {z.short_name as string} &middot; {expName}</p>
      </div>

      <StatBlock rows={[
        { label: 'Min Level', value: z.min_level as number || '—' },
        { label: 'Can Bind', value: z.canbind ? 'Yes' : 'No' },
        { label: 'Can Combat', value: z.cancombat ? 'Yes' : 'No' },
        { label: 'Can Levitate', value: z.canlevitate ? 'Yes' : 'No' },
        { label: 'Hot Zone', value: z.hotzone ? 'Yes' : 'No' },
        { label: 'Safe Coords', value: `${z.safe_x}, ${z.safe_y}, ${z.safe_z}` },
        { label: 'Exp Rate', value: z.zone_exp_multiplier ? `${z.zone_exp_multiplier}x` : '1x' },
      ]} />

      <RelatedList<QuestData>
        title="Quests and Events"
        items={data.quests}
        renderItem={(q) => {
          const { itemIds, exp, coins } = questRewards(q);
          return (
            <li key={q.file_path} className="text-sm">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <EntityLink
                  type="quest"
                  id={q.file_path}
                  name={formatNpcName(q.npc_name)}
                  questPath={`${q.zone}/${q.npc_name}`}
                />
                {itemIds.map((id) => (
                  <ResolvedEntityLink key={id} type="item" id={id} className="text-[11px] border border-eq-gold/40 bg-eq-gold/10 text-eq-gold/80 px-1 py-0 rounded" />
                ))}
                {exp > 0 && (
                  <span className="text-[11px] text-eq-success/80">{exp.toLocaleString()} XP</span>
                )}
                {coins && (
                  <span className="text-[11px] text-amber-300/80">{coins}</span>
                )}
              </div>
            </li>
          );
        }}
      />

      <RelatedList<NpcSummary>
        title="NPCs"
        items={Array.from(new Map(data.npcs.map(n => [n.id, n])).values())}
        renderItem={(npc) => (
          <li key={npc.id} className="text-sm flex gap-3">
            <EntityLink type="npc" id={npc.id} name={formatNpcName(npc.name)} />
            <span className="text-eq-muted">
              L{npc.level} {CLASS_NAMES[npc.class] ?? `Class ${npc.class}`}
            </span>
          </li>
        )}
      />

      <RelatedList
        title="Zone Connections"
        items={(Array.from(new Map(data.zone_points.map(zp => [zp.target_zone_id, zp])).values())).filter(zone => zone.target_zone_id !== z.zoneidnumber)}
        renderItem={(zp) => (
          <li key={zp.id} className="text-sm">
            <EntityLink type="zone" id={zp.target_zone_id} name={zp.dest_long || zp.dest_short || String(zp.target_zone_id)} />
          </li>
        )}
      />
    </div>
  );
}
