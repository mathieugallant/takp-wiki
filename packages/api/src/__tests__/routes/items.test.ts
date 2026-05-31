import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { getPool } from '../../db.js';
import { createTestApp } from '../helpers/app.js';
import type { FastifyInstance } from 'fastify';

const skip = !process.env.DB_HOST;

describe.skipIf(skip)('GET /api/items', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = createTestApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
    await getPool().end();
  });

  it('returns a list of items', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/items' });
    expect(res.statusCode).toBe(200);
    const body = res.json<unknown[]>();
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeGreaterThan(0);
    const first = body[0] as Record<string, unknown>;
    expect(first).toHaveProperty('id');
    expect(first).toHaveProperty('name');
  });

  it('filters items by name search', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/items?search=sword' });
    expect(res.statusCode).toBe(200);
    const body = res.json<Record<string, unknown>[]>();
    expect(body.length).toBeGreaterThan(0);
  });

  it('returns item detail with loot sources and merchants', async () => {
    const list = await app.inject({ method: 'GET', url: '/api/items' });
    const items = list.json<Record<string, unknown>[]>();
    const id = items[0].id as number;

    const res = await app.inject({ method: 'GET', url: `/api/items/${id}` });
    expect(res.statusCode).toBe(200);
    const body = res.json<Record<string, unknown>>();
    expect(body).toHaveProperty('item');
    expect(body).toHaveProperty('loot_sources');
    expect(body).toHaveProperty('merchants');
    expect(body).toHaveProperty('recipes_producing');
    expect(body).toHaveProperty('recipes_consuming');
    expect(Array.isArray(body.loot_sources)).toBe(true);
  });

  it('returns 404 for unknown item id', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/items/999999999' });
    expect(res.statusCode).toBe(404);
  });
});
