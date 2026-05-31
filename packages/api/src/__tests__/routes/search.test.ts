import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { getPool } from '../../db.js';
import { createTestApp } from '../helpers/app.js';
import type { FastifyInstance } from 'fastify';

const skip = !process.env.DB_HOST;

describe.skipIf(skip)('GET /api/search', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = createTestApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
    await getPool().end();
  });

  it('returns grouped results across all entity types', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/search?q=fire' });
    expect(res.statusCode).toBe(200);
    const body = res.json<Record<string, unknown>>();
    // All entity type keys should be present (may be empty arrays if no match)
    for (const type of ['npc', 'item', 'spell', 'zone', 'faction', 'aa', 'recipe']) {
      expect(body, `Missing key "${type}" in search results`).toHaveProperty(type);
      expect(Array.isArray(body[type])).toBe(true);
    }
  });

  it('each result record has id, name, and _type', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/search?q=fire' });
    const body = res.json<Record<string, Record<string, unknown>[]>>();
    for (const [type, rows] of Object.entries(body)) {
      for (const row of rows) {
        expect(row, `${type} result missing "id"`).toHaveProperty('id');
        expect(row, `${type} result missing "name"`).toHaveProperty('name');
        expect(row._type).toBe(type);
      }
    }
  });

  it('returns 400 for queries shorter than 2 characters', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/search?q=a' });
    expect(res.statusCode).toBe(400);
  });

  it('supports type filtering', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/search?q=fire&types=item' });
    expect(res.statusCode).toBe(200);
    const body = res.json<Record<string, unknown>>();
    expect(body).toHaveProperty('item');
    // Other types should not appear when filtered
    expect(body).not.toHaveProperty('npc');
  });
});
