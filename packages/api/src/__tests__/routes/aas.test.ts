import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { getPool } from '../../db.js';
import { createTestApp } from '../helpers/app.js';
import type { FastifyInstance } from 'fastify';

const skip = !process.env.DB_HOST;

describe.skipIf(skip)('GET /api/aas', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = createTestApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
    await getPool().end();
  });

  it('returns a list of AAs from altadv_vars', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/aas' });
    expect(res.statusCode).toBe(200);
    const body = res.json<unknown[]>();
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeGreaterThan(0);
    const first = body[0] as Record<string, unknown>;
    expect(first).toHaveProperty('id');
    expect(first).toHaveProperty('name');
    expect(first).toHaveProperty('classes');
  });

  it('filters AAs by name search', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/aas?search=innate' });
    expect(res.statusCode).toBe(200);
    const body = res.json<Record<string, unknown>[]>();
    expect(body.length).toBeGreaterThan(0);
    expect(String(body[0].name).toLowerCase()).toContain('innate');
  });

  it('returns AA detail with rank actions and effects', async () => {
    const list = await app.inject({ method: 'GET', url: '/api/aas' });
    const aas = list.json<Record<string, unknown>[]>();
    const id = aas[0].id as number;

    const res = await app.inject({ method: 'GET', url: `/api/aas/${id}` });
    expect(res.statusCode).toBe(200);
    const body = res.json<Record<string, unknown>>();
    expect(body).toHaveProperty('aa');
    expect(body).toHaveProperty('ranks');
    expect(body).toHaveProperty('effects');
    expect(body).toHaveProperty('linked_spells');
    expect(Array.isArray(body.ranks)).toBe(true);
    expect(Array.isArray(body.effects)).toBe(true);
    // The AA record should come from altadv_vars (has skill_id, not id)
    const aa = body.aa as Record<string, unknown>;
    expect(aa).toHaveProperty('skill_id');
    expect(aa).toHaveProperty('name');
  });

  it('returns 404 for unknown AA id', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/aas/999999999' });
    expect(res.statusCode).toBe(404);
  });
});
