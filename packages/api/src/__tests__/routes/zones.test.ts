/**
 * Integration tests for /api/zones routes.
 * Requires DB_HOST to be set.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { getPool } from '../../db.js';
import { createTestApp } from '../helpers/app.js';
import type { FastifyInstance } from 'fastify';

const skip = !process.env.DB_HOST;

describe.skipIf(skip)('GET /api/zones', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = createTestApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
    await getPool().end();
  });

  it('returns a list of zones', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/zones' });
    expect(res.statusCode).toBe(200);
    const body = res.json<unknown[]>();
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeGreaterThan(0);
    const first = body[0] as Record<string, unknown>;
    expect(first).toHaveProperty('id');
    expect(first).toHaveProperty('short_name');
    expect(first).toHaveProperty('long_name');
  });

  it('filters zones by search query', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/zones?search=East+Karana' });
    expect(res.statusCode).toBe(200);
    const body = res.json<Record<string, unknown>[]>();
    expect(body.length).toBeGreaterThan(0);
    expect(String(body[0].long_name).toLowerCase()).toContain('east');
  });

  it('returns zone detail with npcs and zone_points', async () => {
    // Get first zone id from list
    const list = await app.inject({ method: 'GET', url: '/api/zones' });
    const zones = list.json<Record<string, unknown>[]>();
    const id = zones[0].id as number;

    const res = await app.inject({ method: 'GET', url: `/api/zones/${id}` });
    expect(res.statusCode).toBe(200);
    const body = res.json<Record<string, unknown>>();
    expect(body).toHaveProperty('zone');
    expect(body).toHaveProperty('npcs');
    expect(body).toHaveProperty('zone_points');
    expect(Array.isArray(body.npcs)).toBe(true);
  });

  it('returns 404 for unknown zone id', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/zones/999999999' });
    expect(res.statusCode).toBe(404);
  });
});
