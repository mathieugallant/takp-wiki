import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api, formatNpcName } from '../api.js';
import { StatBlock } from '../components/StatBlock.js';
import { RelatedList } from '../components/RelatedList.js';
import { EntityLink } from '../components/EntityLink.js';
import { LoadingSpinner, ErrorMessage } from '../components/Feedback.js';
import type { NpcSummary } from '../api.js';

export default function FactionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, error } = useQuery({
    queryKey: ['faction', id],
    queryFn: () => api.faction(id!),
    enabled: !!id,
  });

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={(error as Error).message} />;
  if (!data) return null;

  const f = data.faction;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-eq-gold">{f.name}</h1>

      <StatBlock rows={[
        { label: 'Base Value', value: f.base },
        { label: 'Min Cap', value: f.min_cap },
        { label: 'Max Cap', value: f.max_cap },
      ]} />

      <RelatedList<NpcSummary>
        title="NPCs"
        items={data.npcs}
        renderItem={(npc) => (
          <li key={npc.id} className="text-sm flex gap-3">
            <EntityLink type="npc" id={npc.id} name={formatNpcName(npc.name)} />
            <span className="text-eq-muted text-xs">L{npc.level}</span>
          </li>
        )}
      />
    </div>
  );
}
