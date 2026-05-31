import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api, formatNpcName } from '../api.js';
import type { Interaction, FactionChange, QuestReward, TriggerItem } from '../api.js';
import { EntityLink } from '../components/EntityLink.js';
import { ResolvedEntityLink } from '../components/ResolvedEntityLink.js';
import { LoadingSpinner, ErrorMessage } from '../components/Feedback.js';

// ── Coin formatter ─────────────────────────────────────────────────────────────
function formatCoins(r: QuestReward): string {
  return [
    r.platinum && `${r.platinum}pp`,
    r.gold     && `${r.gold}gp`,
    r.silver   && `${r.silver}sp`,
    r.copper   && `${r.copper}cp`,
  ].filter(Boolean).join(' ');
}

// ── Interaction card ───────────────────────────────────────────────────────────
function InteractionCard({ ia }: { ia: Interaction }) {
  const eventLabel = ia.event.replace('event_', '');
  const hasOutcomes =
    ia.faction_changes.length > 0 ||
    ia.rewards.length > 0 ||
    ia.items_given.length > 0 ||
    ia.npcs_spawned.length > 0 ||
    ia.spells_cast.length > 0;

  return (
    <div className="bg-eq-panel border border-eq-border rounded overflow-hidden">
      {/* ── Header: event + trigger ── */}
      <div className="flex flex-wrap items-center gap-2 px-4 py-2 border-b border-eq-border bg-black/20">
        <span className="text-xs font-mono bg-eq-gold/20 text-eq-gold px-2 py-0.5 rounded">
          {eventLabel}
        </span>

        {ia.trigger_keywords.map((kw, i) => (
          <span key={i} className="text-xs border border-eq-border text-eq-text px-2 py-0.5 rounded">
            &ldquo;{kw}&rdquo;
          </span>
        ))}

        {ia.trigger_items.map((t: TriggerItem) => (
          <span key={t.item_id} className="inline-flex items-center gap-1">
            <ResolvedEntityLink type="item" id={t.item_id} className="text-xs border border-eq-border text-eq-text px-2 py-0.5 rounded" />
            {t.count > 1 && (
              <span className="text-xs text-eq-muted">&times;{t.count}</span>
            )}
          </span>
        ))}

        {ia.faction_required !== null && (
          <span className="ml-auto text-xs text-eq-muted">
            faction ≥ {ia.faction_required}
          </span>
        )}
      </div>

      <div className="px-4 py-3 space-y-3">
        {/* ── NPC response (success / unconditional) ── */}
        {ia.responses.map((r, i) => (
          <p key={i} className="text-sm text-eq-text italic border-l-2 border-eq-gold pl-3">
            &ldquo;{r}&rdquo;
          </p>
        ))}

        {/* ── NPC response when faction check fails ── */}
        {ia.responses_fail.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs text-eq-muted">If faction insufficient:</p>
            {ia.responses_fail.map((r, i) => (
              <p key={i} className="text-sm text-eq-muted italic border-l-2 border-eq-danger pl-3">
                &ldquo;{r}&rdquo;
              </p>
            ))}
          </div>
        )}

        {/* ── Outcomes (only shown when present) ── */}
        {hasOutcomes && (
          <div className="space-y-2 pt-1 border-t border-eq-border/50">

            {/* Faction changes */}
            {ia.faction_changes.length > 0 && (
              <div>
                <span className="text-xs font-semibold text-eq-gold uppercase tracking-wide mr-2">
                  Faction:
                </span>
                <span className="inline-flex flex-wrap gap-x-3 gap-y-1">
                  {ia.faction_changes.map((fc: FactionChange, i) => (
                    <span key={i} className="text-xs">
                      <ResolvedEntityLink type="faction" id={fc.faction_id} />
                      <span className={fc.delta >= 0 ? 'text-eq-success ml-1' : 'text-eq-danger ml-1'}>
                        {fc.delta >= 0 ? `+${fc.delta}` : fc.delta}
                      </span>
                    </span>
                  ))}
                </span>
              </div>
            )}

            {/* Quest rewards */}
            {ia.rewards.map((r: QuestReward, i) => (
              <div key={i} className="flex flex-wrap items-center gap-2 text-sm">
                <span className="text-xs font-semibold text-eq-gold uppercase tracking-wide">
                  Reward:
                </span>
                {r.item_id && (
                  <ResolvedEntityLink type="item" id={r.item_id} />
                )}
                {r.exp > 0 && (
                  <span className="text-eq-muted text-xs">{r.exp.toLocaleString()} XP</span>
                )}
                {formatCoins(r) && (
                  <span className="text-eq-muted text-xs">{formatCoins(r)}</span>
                )}
              </div>
            ))}

            {/* Items given directly */}
            {ia.items_given.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-eq-gold uppercase tracking-wide">
                  Item given:
                </span>
                {ia.items_given.map((id) => (
                  <ResolvedEntityLink key={id} type="item" id={id} />
                ))}
              </div>
            )}

            {/* NPCs spawned */}
            {ia.npcs_spawned.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-eq-gold uppercase tracking-wide">
                  Spawns:
                </span>
                {ia.npcs_spawned.map((id) => (
                  <ResolvedEntityLink key={id} type="npc" id={id} />
                ))}
              </div>
            )}

            {/* Spells cast */}
            {ia.spells_cast.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-eq-gold uppercase tracking-wide">
                  Casts:
                </span>
                {ia.spells_cast.map((id) => (
                  <ResolvedEntityLink key={id} type="spell" id={id} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────
export default function QuestDetailPage() {
  const { zone, npc } = useParams<{ zone: string; npc: string }>();
  const { data, isLoading, error } = useQuery({
    queryKey: ['quest', zone, npc],
    queryFn: () => api.quest(zone!, npc!),
    enabled: !!zone && !!npc,
  });

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={(error as Error).message} />;
  if (!data) return null;

  const sayInteractions   = data.interactions.filter((ia) => ia.event === 'event_say');
  const tradeInteractions = data.interactions.filter((ia) => ia.event === 'event_trade');
  const otherInteractions = data.interactions.filter(
    (ia) => ia.event !== 'event_say' && ia.event !== 'event_trade',
  );

  // Fallback summary items not captured in any interaction
  const interactionNpcs   = new Set(data.interactions.flatMap((ia) => ia.npcs_spawned));
  const interactionSpells = new Set(data.interactions.flatMap((ia) => ia.spells_cast));
  const extraNpcs   = data.npcs_spawned.filter((id) => !interactionNpcs.has(id));
  const extraSpells = data.spells_cast.filter((id) => !interactionSpells.has(id));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-eq-gold">
          {formatNpcName(data.npc_name)}
        </h1>
        <p className="text-eq-muted text-sm">
          Zone: <EntityLink type="zone" id={data.zone} name={data.zone} />
          {data.is_encounter && (
            <span className="ml-2 text-xs bg-eq-gold/20 text-eq-gold px-1 rounded">Encounter</span>
          )}
        </p>
      </div>

      {/* No interactions parsed — fall back to flat view */}
      {data.interactions.length === 0 && (
        <>
          {data.keywords.length > 0 && (
            <section className="space-y-2">
              <h2 className="text-eq-gold font-semibold text-sm uppercase tracking-wide">Keywords</h2>
              <div className="flex flex-wrap gap-2">
                {data.keywords.map((kw, i) => (
                  <span key={i} className="bg-eq-panel border border-eq-border text-eq-text text-xs px-2 py-0.5 rounded">
                    {kw}
                  </span>
                ))}
              </div>
            </section>
          )}
          {data.dialogs.length > 0 && (
            <section className="space-y-2">
              <h2 className="text-eq-gold font-semibold text-sm uppercase tracking-wide">Dialog</h2>
              <ul className="space-y-2">
                {data.dialogs.map((line, i) => (
                  <li key={i} className="text-sm text-eq-muted italic border-l-2 border-eq-border pl-3">
                    &ldquo;{line}&rdquo;
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}

      {/* Say interactions */}
      {sayInteractions.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-eq-gold font-semibold text-sm uppercase tracking-wide">
            Conversations
          </h2>
          <div className="space-y-2">
            {sayInteractions.map((ia, i) => (
              <InteractionCard key={i} ia={ia} />
            ))}
          </div>
        </section>
      )}

      {/* Trade interactions */}
      {tradeInteractions.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-eq-gold font-semibold text-sm uppercase tracking-wide">
            Turn-ins
          </h2>
          <div className="space-y-2">
            {tradeInteractions.map((ia, i) => (
              <InteractionCard key={i} ia={ia} />
            ))}
          </div>
        </section>
      )}

      {/* Other event interactions */}
      {otherInteractions.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-eq-gold font-semibold text-sm uppercase tracking-wide">
            Other Events
          </h2>
          <div className="space-y-2">
            {otherInteractions.map((ia, i) => (
              <InteractionCard key={i} ia={ia} />
            ))}
          </div>
        </section>
      )}

      {/* Extra NPCs / spells not captured in interactions */}
      {extraNpcs.length > 0 && (
        <section className="space-y-1">
          <h2 className="text-eq-gold font-semibold text-sm uppercase tracking-wide">NPCs Spawned</h2>
          <div className="flex flex-wrap gap-2">
            {extraNpcs.map((id) => (
              <ResolvedEntityLink key={id} type="npc" id={id} />
            ))}
          </div>
        </section>
      )}
      {extraSpells.length > 0 && (
        <section className="space-y-1">
          <h2 className="text-eq-gold font-semibold text-sm uppercase tracking-wide">Spells Cast</h2>
          <div className="flex flex-wrap gap-2">
            {extraSpells.map((id) => (
              <ResolvedEntityLink key={id} type="spell" id={id} />
            ))}
          </div>
        </section>
      )}

      <p className="text-eq-muted text-xs">
        Source: <code className="text-eq-text">{data.file_path}</code>
        {' · '}Match coverage: {Math.round(data.match_coverage * 100)}%
      </p>
    </div>
  );
}

