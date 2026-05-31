import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api, formatNpcName } from '../api.js';
import { StatBlock } from '../components/StatBlock.js';
import { RelatedList } from '../components/RelatedList.js';
import { EntityLink } from '../components/EntityLink.js';
import { LoadingSpinner, ErrorMessage } from '../components/Feedback.js';
import type { NpcSummary, LootEntry, MerchantItem, SpellEntry, QuestData } from '../api.js';

const CLASS_NAMES = ['', 'Warrior', 'Cleric', 'Paladin', 'Ranger', 'Shadow Knight', 'Druid',
  'Monk', 'Bard', 'Rogue', 'Shaman', 'Necromancer', 'Wizard', 'Magician', 'Enchanter', 'Beastlord'];

const EXPANSION_NAMES: Record<number, string> = {
  0: 'Classic', 1: 'Kunark', 2: 'Velious', 3: 'Luclin', 4: 'Planes of Power',
};

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
        <p className="text-eq-muted text-sm">{z.short_name as string} &middot; {expName}</p>
      </div>

      <StatBlock rows={[
        { label: 'Min Level', value: z.min_level as number || '—' },
        { label: 'Can Bind', value: z.can_bind ? 'Yes' : 'No' },
        { label: 'Can Combat', value: z.can_combat ? 'Yes' : 'No' },
        { label: 'Can Levitate', value: z.can_levitate ? 'Yes' : 'No' },
        { label: 'Hot Zone', value: z.hotzone ? 'Yes' : 'No' },
        { label: 'Safe Coords', value: `${z.safe_x}, ${z.safe_y}, ${z.safe_z}` },
      ]} />

      <RelatedList<NpcSummary>
        title="NPCs"
        items={data.npcs}
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
        items={data.zone_points}
        renderItem={(zp) => (
          <li key={zp.id} className="text-sm">
            <EntityLink type="zone" id={zp.target_zone_id} name={zp.dest_long || zp.dest_short || String(zp.target_zone_id)} />
          </li>
        )}
      />

      <RelatedList<QuestData>
        title="Quests"
        items={data.quests}
        renderItem={(q) => (
          <li key={q.file_path} className="text-sm">
            <EntityLink
              type="quest"
              id={q.file_path}
              name={formatNpcName(q.npc_name)}
              questPath={`${q.zone}/${q.npc_name}`}
            />
            {q.keywords.length > 0 && (
              <span className="ml-2 text-eq-muted text-xs">[{q.keywords.slice(0, 3).join(', ')}]</span>
            )}
          </li>
        )}
      />
    </div>
  );
}
