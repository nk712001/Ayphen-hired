/**
 * End-to-End Test for Multi-Tenant Organization Flow
 */

import { test, expect } from '@playwright/test';

test.describe('Multi-Tenant Organization Flow', () => {
  test('Admin can create organizations', async ({ page }) => {
    await page.goto('/admin/organizations');
    await page.click('button:has-text("New Organization")');
    await page.fill('input[placeholder="Organization name"]', 'Test Company');
    await page.click('button:has-text("Create")');
    await expect(page.locator('text=Test Company')).toBeVisible();
  });

  test('Data isolation between organizations', async ({ page }) => {
    await page.goto('/interviewer/tests');
    await expect(page.locator('[data-testid="organization-badge"]')).toBeVisible();
  });
});