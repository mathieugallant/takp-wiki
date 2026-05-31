import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { StatBlock } from '../components/StatBlock.js';
import { EntityLink } from '../components/EntityLink.js';
import { LoadingSpinner, ErrorMessage } from '../components/Feedback.js';
import type { AaAction } from '../api.js';

// AA class bitmask: bit = 1 << class_id (Warrior=2, Cleric=4, ..., Bard=256, ..., Beastlord=32768)
// 65534 = all 15 classes set (2+4+...+32768)
const CLASS_NAMES = ['', 'Warrior', 'Cleric', 'Paladin', 'Ranger', 'Shadow Knight', 'Druid',
  'Monk', 'Bard', 'Rogue', 'Shaman', 'Necromancer', 'Wizard', 'Magician', 'Enchanter', 'Beastlord'];

const RACE_BITS: [number, string][] = [
  [1, 'Human'], [2, 'Barbarian'], [4, 'Erudite'], [8, 'Wood Elf'],
  [16, 'High Elf'], [32, 'Dark Elf'], [64, 'Half Elf'], [128, 'Dwarf'],
  [256, 'Troll'], [512, 'Ogre'], [1024, 'Halfling'], [2048, 'Gnome'],
  [4096, 'Iksar'], [8192, 'Vah Shir'],
];

const AA_TYPE_LABELS: Record<number, string> = {
  0: 'Not Applicable', 1: 'General', 2: 'Archetype', 3: 'Class',
  4: 'PoP Advanced', 5: 'PoP Abilities', 8: 'Veteran',
};

const AA_SPECIAL_CATEGORY: Record<number, string> = {
  1: 'Not Applicable', 2: 'Not Implemented', 3: 'Shroud Passive',
  4: 'Shroud Active', 5: 'Veteran Reward', 6: 'Tradeskill',
  7: 'Expendable', 8: 'Racial Innate', 4294967295: 'None',
};

const EXPANSION_NAMES: Record<number, string> = {
  0: 'Classic', 1: 'Kunark', 2: 'Velious', 3: 'Luclin', 4: 'Planes of Power',
};

const ACTION_TARGET_LABELS: Record<number, string> = {
  0: 'None', 1: 'Self', 2: 'Current Target',
  3: 'Caster Group', 4: 'Group of Target', 5: 'Caster Pet',
};

function classesFromBitmask(mask: number): string {
  if (mask === 65534 || mask === 0) return 'All';
  const names: string[] = [];
  CLASS_NAMES.forEach((name, i) => {
    if (i > 0 && mask & (1 << i)) names.push(name);
  });
  return names.join(', ') || 'All';
}

function racesFromBitmask(mask: number): string {
  if (mask === 65535 || mask === 0) return 'All';
  return RACE_BITS.filter(([bit]) => mask & bit).map(([, n]) => n).join(', ') || '—';
}

function msToTime(ms: number): string {
  if (!ms) return '0s';
  const s = ms / 1000;
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const rs = s % 60;
  return rs ? `${m}m ${rs}s` : `${m}m`;
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
  const effectsByRank = data.effects_by_rank;

  // Group actions by 0-indexed rank → convert to 1-indexed
  const actionByRank = data.actions.reduce<Record<number, AaAction>>((acc, a) => {
    acc[(a.rank as number) + 1] = a;
    return acc;
  }, {});

  const maxLevel = aa.max_level || 1;

  const baseSpell = aa.spellid && aa.spellid > 0 && aa.spellid < 4294967295
    ? data.linked_spells.find((s) => s.id === aa.spellid)
    : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-eq-gold">{aa.name}</h1>
        {aa.eqmacid && (
          <p className="text-xs text-eq-muted">EQMac ID: {aa.eqmacid}</p>
        )}
        {aa.description && <p className="text-eq-muted text-sm mt-1">{aa.description}</p>}
      </div>

      {/* AA Variables */}
      <StatBlock rows={[
        { label: 'Classes', value: classesFromBitmask(aa.classes) },
        { label: 'Races', value: racesFromBitmask(aa.races) },
        { label: 'Display Tab', value: AA_TYPE_LABELS[aa.type] ?? `Type ${aa.type}` },
        { label: 'Expansion', value: EXPANSION_NAMES[aa.aa_expansion] ?? `Exp ${aa.aa_expansion}` },
        ...(aa.special_category && aa.special_category !== 4294967295
          ? [{ label: 'Special Category', value: AA_SPECIAL_CATEGORY[aa.special_category] ?? String(aa.special_category) }]
          : []),
        ...(aa.account_time_required
          ? [{ label: 'Account Time Required', value: String(aa.account_time_required) }]
          : []),
      ]} />

      {/* Cost Structure */}
      <section>
        <h2 className="text-eq-gold font-semibold text-sm uppercase tracking-wide mb-2">Cost Structure</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm">
          <div className="bg-eq-panel/40 border border-eq-border rounded p-2">
            <div className="text-eq-muted text-xs">Base Cost</div>
            <div className="text-eq-text">{aa.cost} AA pt{aa.cost !== 1 ? 's' : ''}</div>
          </div>
          {aa.cost_inc !== 0 && (
            <div className="bg-eq-panel/40 border border-eq-border rounded p-2">
              <div className="text-eq-muted text-xs">Cost Increment</div>
              <div className="text-eq-text">+{aa.cost_inc} per rank</div>
            </div>
          )}
          <div className="bg-eq-panel/40 border border-eq-border rounded p-2">
            <div className="text-eq-muted text-xs">Total Ranks</div>
            <div className="text-eq-text">{maxLevel}</div>
          </div>
          {aa.class_type > 0 && (
            <div className="bg-eq-panel/40 border border-eq-border rounded p-2">
              <div className="text-eq-muted text-xs">Level Required</div>
              <div className="text-eq-text">{aa.class_type}</div>
            </div>
          )}
          {aa.level_inc !== 0 && (
            <div className="bg-eq-panel/40 border border-eq-border rounded p-2">
              <div className="text-eq-muted text-xs">Level Increment</div>
              <div className="text-eq-text">+{aa.level_inc} per rank</div>
            </div>
          )}
        </div>
      </section>

      {/* Prerequisite */}
      {aa.prereq_skill !== 0 && aa.prereq_skill !== 4294967295 && (
        <section>
          <h2 className="text-eq-gold font-semibold text-sm uppercase tracking-wide mb-2">Prerequisite</h2>
          <div className="text-sm">
            <Link to={`/aas/${aa.prereq_skill}`} className="text-eq-accent hover:underline">
              {data.prereq_name ?? `AA #${aa.prereq_skill}`}
            </Link>
            {aa.prereq_minpoints > 0 && (
              <span className="text-eq-muted ml-2">at rank {aa.prereq_minpoints}</span>
            )}
          </div>
        </section>
      )}

      {/* Base Spell */}
      {baseSpell && (
        <section>
          <h2 className="text-eq-gold font-semibold text-sm uppercase tracking-wide mb-2">Spell Action</h2>
          <div className="text-sm">
            <EntityLink type="spell" id={baseSpell.id} name={baseSpell.name} />
            {aa.spell_refresh > 0 && (
              <span className="text-eq-muted ml-3">Refresh: {msToTime(aa.spell_refresh)}</span>
            )}
          </div>
        </section>
      )}

      {/* Ranks */}
      <section className="space-y-3">
        <h2 className="text-eq-gold font-semibold text-sm uppercase tracking-wide">Ranks</h2>
        <div className="space-y-3">
          {Array.from({ length: maxLevel }, (_, i) => {
            const rankNum = i + 1;
            const calcCost = aa.cost + aa.cost_inc * i;
            const calcLevel = aa.class_type + aa.level_inc * i;
            const action = actionByRank[rankNum];
            const rankEffects = effectsByRank[rankNum] ?? [];
            const rankSpell = action?.spell_id && action.spell_id > 0 && action.spell_id < 65535
              ? data.linked_spells.find((s) => s.id === action.spell_id)
              : null;

            return (
              <div key={rankNum} className="border border-eq-border rounded p-3 text-sm space-y-2">
                {/* Rank header */}
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-eq-text">
                  <span className="text-eq-gold font-semibold">Rank {rankNum}</span>
                  <span className="text-eq-muted">Cost: {calcCost} AA pt{calcCost !== 1 ? 's' : ''}</span>
                  {calcLevel > 0 && (
                    <span className="text-eq-muted">Level Required: {calcLevel}</span>
                  )}
                </div>

                {/* Action */}
                {action && (
                  <div className="space-y-1 pl-3 border-l border-eq-border/60">
                    {rankSpell && (
                      <div>
                        <span className="text-eq-muted mr-2">Spell:</span>
                        <EntityLink type="spell" id={rankSpell.id} name={rankSpell.name} />
                      </div>
                    )}
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-eq-muted">
                      {action.reuse_time > 0 && (
                        <span>Reuse: {msToTime(action.reuse_time)}</span>
                      )}
                      {action.target !== 0 && (
                        <span>Target: {ACTION_TARGET_LABELS[action.target] ?? `${action.target}`}</span>
                      )}
                      {action.nonspell_action !== 0 && (
                        <span>Non-Spell Action: {action.nonspell_action}</span>
                      )}
                      {action.nonspell_mana !== 0 && (
                        <span>Non-Spell Mana: {action.nonspell_mana}</span>
                      )}
                      {action.nonspell_duration !== 0 && (
                        <span>Non-Spell Duration: {action.nonspell_duration}</span>
                      )}
                      {action.redux_aa !== 0 && (
                        <span>Redux AA 1: {action.redux_aa} ({action.redux_rate}%)</span>
                      )}
                      {action.redux_aa2 !== 0 && (
                        <span>Redux AA 2: {action.redux_aa2} ({action.redux_rate2}%)</span>
                      )}
                    </div>
                  </div>
                )}

                {/* Effects */}
                {rankEffects.length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs border-collapse">
                      <thead>
                        <tr className="text-eq-muted text-left border-b border-eq-border/50">
                          <th className="py-1 pr-3 w-8">Slot</th>
                          <th className="py-1 pr-3">Effect</th>
                          <th className="py-1 pr-3 text-right">Base1</th>
                          <th className="py-1 text-right">Base2</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-eq-border/30">
                        {rankEffects.map((e) => (
                          <tr key={e.slot} className="text-eq-muted">
                            <td className="py-0.5 pr-3">{e.slot}</td>
                            <td className="py-0.5 pr-3">{e.effect_name}</td>
                            <td className="py-0.5 pr-3 text-right">{e.base1}</td>
                            <td className="py-0.5 text-right">{e.base2}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
