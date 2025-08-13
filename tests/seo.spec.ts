import { test, expect } from '@playwright/test';

const WEB_URL = process.env.WEB_URL || 'http://localhost:3000';
const TRACKER_URL = process.env.TRACKER_URL || 'http://localhost:8080';

test.describe('SEO & Health', () => {
  test('homepage has title, description, canonical', async ({ page }) => {
    await page.goto(WEB_URL);
    await expect(page).toHaveTitle(/CAS Tracker PRD/);
    const desc = await page.locator('meta[name="description"]').getAttribute('content');
    expect(desc).toContain('CAS Tracker');
    const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
    expect(canonical).toBe('http://localhost:3000/');
  });

  test('tracker health endpoint', async ({ request }) => {
    const res = await request.get(`${TRACKER_URL}/health`);
    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    expect(json.status).toBe('ok');
  });
});
