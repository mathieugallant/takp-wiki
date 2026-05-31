import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api.js';
import { StatBlock } from '../components/StatBlock.js';
import { RelatedList } from '../components/RelatedList.js';
import { EntityLink } from '../components/EntityLink.js';
import { LoadingSpinner, ErrorMessage } from '../components/Feedback.js';
import type { RecipeEntry } from '../api.js';

const TRADESKILL_NAMES: Record<number, string> = {
  55: 'Alchemy', 60: 'Baking', 45: 'Blacksmithing', 63: 'Brewing',
  50: 'Fletching', 56: 'Jewelry Making', 64: 'Make Poison', 65: 'Pottery',
  59: 'Research', 52: 'Tailoring', 58: 'Tinkering',
};

export default function RecipeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, error } = useQuery({
    queryKey: ['recipe', id],
    queryFn: () => api.recipe(id!),
    enabled: !!id,
  });

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={(error as Error).message} />;
  if (!data) return null;

  const r = data.recipe;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-eq-gold">{r.name}</h1>
        <p className="text-eq-muted text-sm">
          {TRADESKILL_NAMES[r.tradeskill] ?? r.tradeskill_name}
        </p>
      </div>

      <StatBlock rows={[
        { label: 'Skill Needed', value: r.skillneeded },
        { label: 'Trivial', value: r.trivial },
      ]} />

      {data.containers.length > 0 && (
        <section className="space-y-1">
          <h2 className="text-eq-gold font-semibold text-sm uppercase tracking-wide">Container</h2>
          <ul className="text-sm space-y-1">
            {data.containers.map((c) => (
              <li key={c.item_id}>
                <EntityLink type="item" id={c.item_id} name={c.item_name} />
              </li>
            ))}
          </ul>
        </section>
      )}

      <RelatedList<RecipeEntry>
        title="Ingredients"
        items={data.ingredients.filter((e) => e.componentcount > 0)}
        renderItem={(e) => (
          <li key={e.item_id} className="text-sm flex gap-3">
            <EntityLink type="item" id={e.item_id} name={e.item_name} />
            {e.componentcount > 1 && <span className="text-eq-muted text-xs">x{e.componentcount}</span>}
          </li>
        )}
      />

      <RelatedList<RecipeEntry>
        title="Produces"
        items={data.outputs}
        renderItem={(e) => (
          <li key={e.item_id} className="text-sm flex gap-3">
            <EntityLink type="item" id={e.item_id} name={e.item_name} />
            {e.successcount > 1 && <span className="text-eq-muted text-xs">x{e.successcount}</span>}
          </li>
        )}
      />
    </div>
  );
}
