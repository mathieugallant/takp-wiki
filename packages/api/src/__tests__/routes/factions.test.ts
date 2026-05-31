import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { getPool } from '../../db.js';
import { createTestApp } from '../helpers/app.js';
import type { FastifyInstance } from 'fastify';

const skip = !process.env.DB_HOST;

describe.skipIf(skip)('GET /api/factions', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = createTestApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
    await getPool().end();
  });

  it('returns a list of factions', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/factions' });
    expect(res.statusCode).toBe(200);
    const body = res.json<unknown[]>();
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeGreaterThan(0);
    const first = body[0] as Record<string, unknown>;
    expect(first).toHaveProperty('id');
    expect(first).toHaveProperty('name');
  });

  it('returns faction detail with associated NPCs', async () => {
    const list = await app.inject({ method: 'GET', url: '/api/factions' });
    const factions = list.json<Record<string, unknown>[]>();
    const id = factions[0].id as number;

    const res = await app.inject({ method: 'GET', url: `/api/factions/${id}` });
    expect(res.statusCode).toBe(200);
    const body = res.json<Record<string, unknown>>();
    expect(body).toHaveProperty('faction');
    expect(body).toHaveProperty('npcs');
    expect(Array.isArray(body.npcs)).toBe(true);
  });

  it('returns 404 for unknown faction id', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/factions/999999999' });
    expect(res.statusCode).toBe(404);
  });
});
