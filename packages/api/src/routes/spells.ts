import type { FastifyInstance } from 'fastify';
import { query, queryOne } from '../db.js';

// Spell effect type labels — sourced from Server/common/spdat.h SE_* defines
export const EFFECT_LABELS: Record<number, string> = {
  0:   'HP',
  1:   'Armor Class',
  2:   'Attack',
  3:   'Movement Speed',
  4:   'STR',
  5:   'DEX',
  6:   'AGI',
  7:   'STA',
  8:   'INT',
  9:   'WIS',
  10:  'CHA',
  11:  'Attack Speed',
  12:  'Invisibility',
  13:  'See Invisible',
  14:  'Water Breathing',
  15:  'Mana',
  18:  'Lull',
  19:  'Add Faction',
  20:  'Blind',
  21:  'Stun',
  22:  'Charm',
  23:  'Fear',
  24:  'Stamina',
  25:  'Bind Affinity',
  26:  'Gate',
  27:  'Cancel Magic',
  28:  'Invisibility vs Undead',
  29:  'Invisibility vs Animals',
  30:  'Change Frenzy Radius',
  31:  'Mesmerize',
  32:  'Summon Item',
  33:  'Summon Pet',
  35:  'Disease Counter',
  36:  'Poison Counter',
  40:  'Divine Aura',
  41:  'Destroy',
  42:  'Shadow Step',
  43:  'Berserk',
  46:  'Resist Fire',
  47:  'Resist Cold',
  48:  'Resist Poison',
  49:  'Resist Disease',
  50:  'Resist Magic',
  52:  'Sense Dead',
  53:  'Sense Summoned',
  54:  'Sense Animals',
  55:  'Rune',
  56:  'True North',
  57:  'Levitate',
  58:  'Illusion',
  59:  'Damage Shield',
  61:  'Identify',
  63:  'Wipe Hate List',
  64:  'Spin Target',
  65:  'Infravision',
  66:  'Ultravision',
  67:  'Eye of Zomm',
  68:  'Reclaim Pet',
  69:  'Total HP',
  71:  'Necro Pet',
  73:  'Bind Sight',
  74:  'Feign Death',
  75:  'Voice Graft',
  77:  'Locate Corpse',
  78:  'Absorb Magic',
  79:  'HP (Instant)',
  81:  'Revive',
  82:  'Summon PC',
  83:  'Teleport',
  84:  'Toss Up',
  85:  'Weapon Proc',
  86:  'Harmony',
  87:  'Magnify Vision',
  88:  'Evacuate',
  89:  'Model Size',
  91:  'Summon Corpse',
  92:  'Add Hate',
  94:  'Negate If Combat',
  95:  'Sacrifice',
  96:  'Silence',
  97:  'Mana Pool',
  98:  'Attack Speed 2',
  99:  'Root',
  100: 'Heal Over Time',
  101: 'Complete Heal',
  102: 'Fearless',
  103: 'Call Pet',
  104: 'Translocate',
  105: 'Anti-Gate',
  106: 'Summon BST Pet',
  108: 'Familiar',
  109: 'Summon Item Into Bag',
  110: 'Increase Archery',
  111: 'Resist All',
  112: 'Casting Level',
  113: 'Summon Horse',
  114: 'Change Aggro',
  115: 'Hunger',
  116: 'Curse Counter',
  117: 'Magic Weapon',
  118: 'Amplification',
  119: 'Attack Speed 3',
  120: 'Heal Rate',
  121: 'Reverse DS',
  123: 'Screech',
  124: 'Improved Damage',
  125: 'Improved Heal',
  126: 'Spell Resist Reduction',
  127: 'Increase Spell Haste',
  128: 'Increase Spell Duration',
  129: 'Increase Range',
  130: 'Spell Hate Mod',
  131: 'Reduce Reagent Cost',
  132: 'Reduce Mana Cost',
  133: 'Stun Time Mod',
  134: 'Limit Max Level',
  135: 'Limit Resist',
  136: 'Limit Target',
  137: 'Limit Effect',
  138: 'Limit Spell Type',
  139: 'Limit Spell',
  140: 'Limit Min Duration',
  141: 'Limit Instant',
  142: 'Limit Min Level',
  143: 'Limit Cast Time Min',
  144: 'Limit Cast Time Max',
  145: 'Teleport 2',
  147: 'Percental Heal',
  148: 'Stacking Block',
  149: 'Stacking Overwrite',
  150: 'Death Save',
  152: 'Temporary Pets',
  153: 'Balance HP',
  154: 'Dispel Detrimental',
  155: 'Spell Crit Damage',
  156: 'Illusion Copy',
  157: 'Spell Damage Shield',
  158: 'Reflect',
  159: 'All Stats',
  161: 'Mitigate Spell Damage',
  162: 'Mitigate Melee Damage',
  163: 'Negate Attacks',
  167: 'Pet Power',
  168: 'Melee Mitigation',
  169: 'Critical Hit Chance',
  170: 'Spell Crit Chance',
  171: 'Crippling Blow Chance',
  172: 'Avoid Melee Chance',
  173: 'Riposte Chance',
  174: 'Dodge Chance',
  175: 'Parry Chance',
  176: 'Dual Wield Chance',
  177: 'Double Attack Chance',
  178: 'Melee Lifetap',
  179: 'All Instrument Mod',
  180: 'Resist Spell Chance',
  181: 'Resist Fear Chance',
  182: 'Hundred Hands',
  183: 'Melee Skill Check',
  184: 'Hit Chance',
  185: 'Damage Modifier',
  186: 'Min Damage Modifier',
  187: 'Balance Mana',
  188: 'Block Chance',
  189: 'Endurance',
  190: 'Endurance Pool',
  191: 'Amnesia',
  192: 'Hate',
  193: 'Skill Attack',
  194: 'Fading Memories',
  195: 'Stun Resist',
  196: 'Strike Through',
  198: 'Endurance (Instant)',
  199: 'Taunt',
  200: 'Proc Chance',
  201: 'Ranged Proc',
  202: 'Project Illusion',
  203: 'Mass Group Buff',
  205: 'Rampage',
  206: 'AE Taunt',
  209: 'Dispel Beneficial',
};

// Buff duration formula: 0=not a buff; others use buffduration as the param/cap
// Level-scaled: 1,3,6,7,8,9,10  Fixed/computable: 2,4,5,11,12,50,3600
function ticksToTime(ticks: number): string {
  const totalSec = Math.round(ticks * 6);
  if (totalSec < 60) return `${totalSec}s`;
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  if (m < 60) return s ? `${m}m ${s}s` : `${m}m`;
  const h = Math.floor(m / 60);
  const rm = m % 60;
  return rm ? `${h}h ${rm}m` : `${h}h`;
}

function describeDuration(formula: number, duration: number): string | null {
  if (!formula) return null;
  const cap = ticksToTime(duration);
  switch (formula) {
    // min(Level / 2, duration) ticks  → Level × 3s per level
    case 1: case 6:
      return `Lowest of Level × 3s or ${cap}`;
    // floor(duration / 5 * 3) — fixed
    case 2:
      return ticksToTime(Math.floor(duration / 5 * 3));
    // min(Level * 30, duration) ticks → Level × 3m per level
    case 3:
      return `Lowest of Level × 3m or ${cap}`;
    // duration if not 0, else 50 ticks — fixed
    case 4:
      return ticksToTime(duration || 50);
    // min(duration, 3) ticks — fixed
    case 5:
      return ticksToTime(Math.min(duration, 3));
    // duration if not 0, else Level ticks
    case 7:
      return duration ? cap : 'Level × 6s';
    // min(Level + 10, duration) ticks → (Level + 10) × 6s
    case 8:
      return `Lowest of (Level + 10) × 6s or ${cap}`;
    // min(Level * 2 + 10, duration) ticks
    case 9:
      return `Lowest of (Level × 2 + 10) × 6s or ${cap}`;
    // min(Level * 3 + 10, duration) ticks
    case 10:
      return `Lowest of (Level × 3 + 10) × 6s or ${cap}`;
    // fixed: exactly buffduration ticks
    case 11: case 12:
      return ticksToTime(duration);
    // 72000 ticks = 5 days
    case 50:
      return '5 days';
    // duration if not 0, else 3600 ticks
    case 3600:
      return ticksToTime(duration || 3600);
    default:
      return ticksToTime(duration);
  }
}

// Environment types and time-of-day from spellenums.php
const ENV_TYPES: Record<number, string | null> = {
  0:  null,          // Everywhere — omit
  8:  'Unknown',
  12: 'Cities',
  24: 'Planes',
};

const TIME_OF_DAY: Record<number, string | null> = {
  0: null,          // Any — omit
  1: 'Daytime only',
  2: 'Nighttime only',
};

const GOOD_EFFECT: Record<number, string> = {
  0: 'Detrimental',
  1: 'Beneficial',
  2: 'Beneficial (group only)',
};

function describeEffect(effectid: number, base: number, max: number, formula: number): string {
  const label = EFFECT_LABELS[effectid] ?? `Effect ${effectid}`;
  const s = (n: number) => n >= 0 ? `+${n}` : `${n}`;

  // Percentage-scaled formulas (Effect Base / 100 → display as %)
  if (formula === 60 || formula === 70) {
    return `${label}: ${s(base)}%`;
  }

  // Random range: show lo–hi
  if (formula === 123) {
    const lo = Math.min(base, max || base);
    const hi = Math.max(base, max || base);
    return (max && max !== base)
      ? `${label}: ${s(lo)} to ${s(hi)} (random)`
      : `${label}: ${s(base)}`;
  }

  // Splurt (ramping DoT)
  if (formula === 122) {
    return `${label}: ${s(base)} (Splurt)`;
  }

  // Level-scaling formulas: show the expression with actual base substituted
  // Formulas sourced from spellenums.php $sp_formulas
  switch (formula) {
    case 101: case 107: return `${label}: ${s(base)} + Level / 2`;
    case 102:           return `${label}: ${s(base)} + Level`;
    case 103:           return `${label}: ${s(base)} + Level × 2`;
    case 104:           return `${label}: ${s(base)} + Level × 3`;
    case 105:           return `${label}: ${s(base)} + Level × 4`;
    case 108:           return `${label}: ${s(base)} + Level / 3`;
    case 109:           return `${label}: ${s(base)} + Level / 4`;
    case 110: case 119: return `${label}: ${s(base)} + Level / 5`;
    case 111: case 115: return `${label}: ${s(base)} + 6 × (Level − Spell Level)`;
    case 112: case 116: return `${label}: ${s(base)} + 8 × (Level − Spell Level)`;
    case 113:           return `${label}: ${s(base)} + 10 × (Level − Spell Level)`;
    case 114:           return `${label}: ${s(base)} + 15 × (Level − Spell Level)`;
    case 117:           return `${label}: ${s(base)} + 12 × (Level − Spell Level)`;
    case 118:           return `${label}: ${s(base)} + 20 × (Level − Spell Level)`;
    case 120:           return `${label}: ${s(base)} + Level / 6`;
    case 121:           return `${label}: ${s(base)} + Level / 3`;
    case 124:           return `${label}: ${s(base)} + (Level − 50)`;
    case 125:           return `${label}: ${s(base)} + 2 × (Level − 50)`;
    case 126:           return `${label}: ${s(base)} + 3 × (Level − 50)`;
    case 127:           return `${label}: ${s(base)} + 4 × (Level − 50)`;
    case 128:           return `${label}: ${s(base)} + 5 × (Level − 50)`;
    case 129:           return `${label}: ${s(base)} + 10 × (Level − 50)`;
    case 130:           return `${label}: ${s(base)} + 15 × (Level − 50)`;
    case 131:           return `${label}: ${s(base)} + 20 × (Level − 50)`;
    default:            return `${label}: ${s(base)}`;
  }
}

export async function spellRoutes(app: FastifyInstance) {
  // List / search spells
  app.get<{ Querystring: { search?: string; class?: string; level?: string; effect?: string; sort?: string; dir?: string; page?: string } }>(
    '/api/spells',
    async (req) => {
      const search = req.query.search?.trim() ?? '';
      const classId = req.query.class ? parseInt(req.query.class, 10) : null;
      const maxLevel = req.query.level ? parseInt(req.query.level, 10) : null;
      const effectId = req.query.effect ? parseInt(req.query.effect, 10) : null;
      const page = Math.max(1, parseInt(req.query.page ?? '1', 10));
      let limit = 50;
      const offset = (page - 1) * limit;

      const conditions: string[] = [];
      const params: (string | number)[] = [];

      if (search) {
        conditions.push('name LIKE ?');
        params.push(`%${search}%`);
      }
      // spells_new has per-class columns classes1–classes15; value 255 = not available
      if (classId !== null && !isNaN(classId) && classId >= 1 && classId <= 15) {
        limit = 0; 
        conditions.push(`classes${classId} < 255`);
        if (maxLevel !== null && !isNaN(maxLevel) && maxLevel > 0) {
          conditions.push(`classes${classId} <= ?`);
          params.push(maxLevel);
        }
      } else if (maxLevel !== null && !isNaN(maxLevel) && maxLevel > 0) {
        // No class selected: any class can use it at this level
        const cols = Array.from({ length: 15 }, (_, i) => `classes${i + 1}`).join(',');
        conditions.push(`LEAST(${cols}) <= ?`);
        params.push(maxLevel);
      }
      if (effectId !== null && !isNaN(effectId)) {
        conditions.push(
          `(effectid1 = ? OR effectid2 = ? OR effectid3 = ?
           OR effectid4 = ? OR effectid5 = ? OR effectid6 = ?
           OR effectid7 = ? OR effectid8 = ? OR effectid9 = ?
           OR effectid10 = ? OR effectid11 = ? OR effectid12 = ?)`
        );
        for (let i = 0; i < 12; i++) params.push(effectId);
      }

      const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

      const SPELL_SORT: Record<string, string> = {
        id: 'id', name: 'name', mana: 'mana', casttime: 'cast_time', range: '`range`',
      };
      // Level sort: use the selected class column when available, else LEAST across all classes
      const classCols = Array.from({ length: 15 }, (_, i) => `classes${i + 1}`).join(',');
      const levelSortExpr = (classId !== null && !isNaN(classId) && classId >= 1 && classId <= 15)
        ? `classes${classId}`
        : `LEAST(${classCols})`;
      if (req.query.sort === 'level') {
        SPELL_SORT['level'] = levelSortExpr;
      }
      const sortCol = SPELL_SORT[req.query.sort ?? ''] ?? 'name';
      const sortDir = req.query.dir === 'desc' ? 'DESC' : 'ASC';

      return query(
        `SELECT id, name, mana, cast_time, \`range\`, targettype, resisttype,
                ${levelSortExpr} AS min_level
         FROM spells_new
         ${where}
         ORDER BY ${sortCol} ${sortDir}
         ${limit > 0 ? 'LIMIT ? OFFSET ?' : ''}`,
        [...params, ...(limit > 0 ? [limit, offset] : [])]
      );
    }
  );

  // Spell detail
  app.get<{ Params: { id: string } }>('/api/spells/:id', async (req, reply) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return reply.status(400).send({ error: 'Invalid spell id' });

    const spell = await queryOne<Record<string, unknown>>(
      'SELECT * FROM spells_new WHERE id = ?',
      [id]
    );
    if (!spell) return reply.status(404).send({ error: 'Spell not found' });

    // Build human-readable effect list from effect1-12 / effectbasevalue1-12
    const effects: { label: string; base: number; effectid: number; item_id?: number; item_name?: string }[] = [];
    const summonItemEffects: number[] = [32, 109]; // Summon Item, Summon Item Into Bag
    const summonItemIds: number[] = [];
    
    for (let i = 1; i <= 12; i++) {
      const effectid = spell[`effectid${i}`] as number;
      const base     = spell[`effect_base_value${i}`] as number;
      const max      = (spell[`max${i}`] as number) ?? 0;
      const formula  = (spell[`formula${i}`] as number) ?? 0;
      if (effectid != null && effectid !== 254) {
        effects.push({ label: describeEffect(effectid, base, max, formula), base, effectid });
        // Collect item IDs for summon item effects
        if (summonItemEffects.includes(effectid) && base > 0) {
          summonItemIds.push(base);
        }
      }
    }

    // Look up item names for summon effects
    const summonedItems = summonItemIds.length > 0
      ? await query<{ id: number; name: string }>(
          `SELECT id, Name AS name FROM items WHERE id IN (${summonItemIds.map(() => '?').join(',')})`,
          summonItemIds
        )
      : [];
    
    const itemMap = new Map(summonedItems.map(item => [item.id, item.name]));
    
    // Merge item names into effects
    effects.forEach(effect => {
      if (summonItemEffects.includes(effect.effectid) && effect.base > 0) {
        effect.item_id = effect.base;
        effect.item_name = itemMap.get(effect.base);
      }
    });

    const duration_label = describeDuration(
      spell.buffdurationformula as number,
      spell.buffduration as number
    );
    const env_label  = ENV_TYPES[spell.EnvironmentType as number] ?? null;
    const time_label = TIME_OF_DAY[spell.TimeOfDay as number] ?? null;
    const good_effect_label = GOOD_EFFECT[spell.goodEffect as number] ?? null;

    // Reagent components (component1-4 field in spells_new)
    const reagents = [1, 2, 3, 4]
      .map((n) => { return {id: spell[`components${n}`] as number, count: spell[`component_counts${n}`] as number, name: '', icon: ''} })
      .filter((reagent) => reagent.id && reagent.id > 0 && reagent.count && reagent.count > 0);

    const [reagentItems, npcCasters, itemsWithSpell] = await Promise.all([
      reagents.length > 0
        ? query<{ id: number; name: string; icon: string }>(
            `SELECT id, Name AS name, icon FROM items
            WHERE id IN (${reagents.map(() => '?').join(',')})`,
            reagents.map((r) => r.id)
          )
        : Promise.resolve([]),
      // NPCs that have this spell in their spell sets
      query(
        `SELECT DISTINCT n.id, n.name, n.level, n.class
         FROM npc_spells_entries nse
         JOIN npc_types n ON n.npc_spells_id = nse.npc_spells_id
         WHERE nse.spellid = ?
         ORDER BY n.name
         LIMIT 200`,
        [id]
      ),
      // Items that reference this spell (click/worn/proc/focus)
      query(
        `SELECT id, Name AS name, icon,
                CASE
                  WHEN clickeffect = ? THEN 'click'
                  WHEN worneffect = ? THEN 'worn'
                  WHEN proceffect = ? THEN 'proc'
                  WHEN focuseffect = ? THEN 'focus'
                  WHEN scrolleffect = ? THEN 'scroll'
                END AS effect_type
         FROM items
         WHERE clickeffect = ? OR worneffect = ? OR proceffect = ? OR focuseffect = ? OR scrolleffect = ?
         ORDER BY Name`,
        [id, id, id, id, id, id, id, id, id, id]
      ),
    ]);

    reagents.forEach((reagent) => {
      const item = reagentItems.find((i) => i.id === reagent.id);
      if (item) {
        reagent.name = item.name;
        reagent.icon = item.icon;
      }
    });

    return { spell, effects, duration_label, env_label, time_label, good_effect_label, reagents, npc_casters: npcCasters, items: itemsWithSpell };
  });
}
