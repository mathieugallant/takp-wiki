import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { getPool } from '../../db.js';
import { createTestApp } from '../helpers/app.js';
import type { FastifyInstance } from 'fastify';

const skip = !process.env.DB_HOST;

describe.skipIf(skip)('GET /api/npcs', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = createTestApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
    await getPool().end();
  });

  it('returns a list of NPCs', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/npcs' });
    expect(res.statusCode).toBe(200);
    const body = res.json<unknown[]>();
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeGreaterThan(0);
    const first = body[0] as Record<string, unknown>;
    expect(first).toHaveProperty('id');
    expect(first).toHaveProperty('name');
    expect(first).toHaveProperty('level');
  });

  it('filters NPCs by name search', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/npcs?search=guard' });
    expect(res.statusCode).toBe(200);
    const body = res.json<Record<string, unknown>[]>();
    expect(body.length).toBeGreaterThan(0);
  });

  it('returns NPC detail with loot and spawn locations', async () => {
    const list = await app.inject({ method: 'GET', url: '/api/npcs' });
    const npcs = list.json<Record<string, unknown>[]>();
    const id = npcs[0].id as number;

    const res = await app.inject({ method: 'GET', url: `/api/npcs/${id}` });
    expect(res.statusCode).toBe(200);
    const body = res.json<Record<string, unknown>>();
    expect(body).toHaveProperty('npc');
    expect(body).toHaveProperty('loot');
    expect(body).toHaveProperty('spawn_locations');
    expect(body).toHaveProperty('spells');
    expect(body).toHaveProperty('merchant_inventory');
    expect(Array.isArray(body.loot)).toBe(true);
  });

  it('returns 404 for unknown NPC id', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/npcs/999999999' });
    expect(res.statusCode).toBe(404);
  });
});
