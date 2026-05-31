/**
 * Schema validation — integration test.
 *
 * Checks that every table the API depends on (per REQUIRED_TABLES manifest)
 * actually exists in the connected database.  Any mismatch is reported with
 * the affected route name, making it easy to spot when the DB and code drift.
 *
 * Also validates key column names within selected tables to catch column-level
 * drift (e.g. loottable_entries.probability, not .chance).
 *
 * Requires a live database.  Set DB_HOST (and optionally DB_PORT, DB_USER,
 * DB_PASS, DB_NAME) before running:
 *
 *   DB_HOST=localhost npm test --workspace=packages/api
 */
import { afterAll, describe, expect, it } from 'vitest';
import { getExistingTables, getPool, query } from '../db.js';
import { REQUIRED_TABLES } from '../tables.js';

/** Columns that must exist: { table: [col, ...] } */
const REQUIRED_COLUMNS: Record<string, string[]> = {
  loottable_entries: ['loottable_id', 'lootdrop_id', 'probability', 'multiplier'],
  lootdrop_entries: ['lootdrop_id', 'item_id', 'chance'],
  npc_faction: ['id', 'primaryfaction'],
  altadv_vars: ['skill_id', 'name', 'classes', 'max_level', 'cost', 'spellid'],
  aa_actions: ['aaid', 'rank', 'spell_id', 'reuse_time', 'target'],
  aa_effects: ['aaid', 'slot', 'effectid', 'base1', 'base2'],
  spells_new: ['id', 'name', 'mana', 'cast_time', 'range', 'targettype', 'resisttype', 'recast_time'],
  npc_emotes: ['id', 'emoteid', 'event_', 'type', 'text'],
  npc_types: ['id', 'emoteid', 'loottable_id', 'merchant_id', 'npc_spells_id', 'npc_faction_id'],
};

const dbAvailable = !!process.env.DB_HOST;

afterAll(async () => {
  if (dbAvailable) await getPool().end();
});

describe.skipIf(!dbAvailable)('database schema validation', () => {
  it('all required tables exist (combined report)', async () => {
    const existing = new Set(await getExistingTables());
    const missing: Array<{ route: string; table: string }> = [];

    for (const [route, tables] of Object.entries(REQUIRED_TABLES)) {
      for (const table of tables) {
        if (!existing.has(table)) {
          missing.push({ route, table });
        }
      }
    }

    if (missing.length > 0) {
      const lines = missing.map((m) => `  [${m.route}] ${m.table}`).join('\n');
      throw new Error(`Missing tables detected:\n${lines}`);
    }

    expect(missing).toHaveLength(0);
  });

  // Per-route breakdown so CI output pins the exact failing route
  for (const [route, tables] of Object.entries(REQUIRED_TABLES)) {
    it(`route "${route}" has all required tables`, async () => {
      const existing = new Set(await getExistingTables());
      const missing = tables.filter((t) => !existing.has(t));
      expect(
        missing,
        `Route "${route}" is missing tables: ${missing.join(', ')}`
      ).toHaveLength(0);
    });
  }

  it('required columns exist in their tables', async () => {
    const missing: string[] = [];
    for (const [table, cols] of Object.entries(REQUIRED_COLUMNS)) {
      const rows = await query<{ COLUMN_NAME: string }>(
        `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?`,
        [table]
      );
      const existing = new Set(rows.map((r) => r.COLUMN_NAME));
      for (const col of cols) {
        if (!existing.has(col)) missing.push(`${table}.${col}`);
      }
    }
    if (missing.length > 0) {
      throw new Error(`Missing columns:\n${missing.map((c) => `  ${c}`).join('\n')}`);
    }
    expect(missing).toHaveLength(0);
  });
});

describe.skipIf(dbAvailable)('database schema validation (skipped — no DB_HOST)', () => {
  it('skipped: set DB_HOST env var to run schema checks', () => {
    console.warn('Schema tests skipped: DB_HOST is not set.');
  });
});
