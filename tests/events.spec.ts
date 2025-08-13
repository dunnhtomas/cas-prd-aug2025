import { test, expect } from '@playwright/test';

const TRACKER_URL = process.env.TRACKER_URL || 'http://localhost:8080';

test.describe('Event API', () => {
  test('create and list events', async ({ request }) => {
    const type = 'test:event';
    const createRes = await request.post(`${TRACKER_URL}/events`, {
      data: { type, payload: { a: 1 } },
    });
    expect(createRes.status()).toBe(201);
    const created = await createRes.json();
    expect(created.type).toBe(type);

    const listRes = await request.get(`${TRACKER_URL}/events`);
    expect(listRes.ok()).toBeTruthy();
    const list = await listRes.json();
    expect(Array.isArray(list)).toBeTruthy();
    expect(list.find(e => e.id === created.id)).toBeTruthy();
  });
});
