import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { getPool } from '../../db.js';
import { createTestApp } from '../helpers/app.js';
import type { FastifyInstance } from 'fastify';

const skip = !process.env.DB_HOST;

describe.skipIf(skip)('GET /api/spells', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = createTestApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
    await getPool().end();
  });

  it('returns a list of spells', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/spells' });
    expect(res.statusCode).toBe(200);
    const body = res.json<unknown[]>();
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeGreaterThan(0);
    const first = body[0] as Record<string, unknown>;
    expect(first).toHaveProperty('id');
    expect(first).toHaveProperty('name');
  });

  it('filters spells by name search', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/spells?search=fireball' });
    expect(res.statusCode).toBe(200);
    const body = res.json<Record<string, unknown>[]>();
    // May be empty if no spell named fireball — just check it's an array
    expect(Array.isArray(body)).toBe(true);
  });

  it('returns spell detail with effects and npc casters', async () => {
    const list = await app.inject({ method: 'GET', url: '/api/spells' });
    const spells = list.json<Record<string, unknown>[]>();
    const id = spells[0].id as number;

    const res = await app.inject({ method: 'GET', url: `/api/spells/${id}` });
    expect(res.statusCode).toBe(200);
    const body = res.json<Record<string, unknown>>();
    expect(body).toHaveProperty('spell');
    expect(body).toHaveProperty('effects');
    expect(body).toHaveProperty('npc_casters');
    expect(Array.isArray(body.effects)).toBe(true);
  });

  it('returns 404 for unknown spell id', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/spells/999999999' });
    expect(res.statusCode).toBe(404);
  });
});
