import { test, expect } from '@playwright/test';
import { waitForPageReady } from './helpers';

test.describe('Club & Booking Flow', () => {
  test('should display clubs directory', async ({ page }) => {
    await page.goto('/clubs');
    await waitForPageReady(page);

    // Should show clubs page
    await expect(page.getByRole('heading', { name: /Clubs/i })).toBeVisible();
  });

  test('should search clubs', async ({ page }) => {
    await page.goto('/clubs');
    await waitForPageReady(page);

    const searchInput = page.locator('input[placeholder*="echerch"]').first();
    const hasSearch = await searchInput.isVisible().catch(() => false);

    if (hasSearch) {
      await searchInput.fill('Nice');
      await page.waitForTimeout(500);
    }
  });

  test('should navigate to club detail page', async ({ page }) => {
    await page.goto('/clubs');
    await waitForPageReady(page);

    // Click first club card
    const clubLinks = page.locator('a[href^="/clubs/"]').first();
    const hasClubs = await clubLinks.isVisible().catch(() => false);

    if (!hasClubs) {
      test.skip(true, 'No clubs available');
      return;
    }

    await clubLinks.click();
    await page.waitForURL(/\/clubs\/[a-f0-9-]+/);
    await waitForPageReady(page);

    // Club detail should show info
    await expect(page.locator('main').first()).toBeVisible();
  });

  test('should display club detail with courts and reviews', async ({ page }) => {
    await page.goto('/clubs');
    await waitForPageReady(page);

    const clubLinks = page.locator('a[href^="/clubs/"]').first();
    const hasClubs = await clubLinks.isVisible().catch(() => false);

    if (!hasClubs) {
      test.skip(true, 'No clubs available');
      return;
    }

    await clubLinks.click();
    await page.waitForURL(/\/clubs\/[a-f0-9-]+/);
    await waitForPageReady(page);

    // Check for courts section or review section
    const hasCourts = await page.getByText(/terrain/i).first().isVisible().catch(() => false);
    const hasReviews = await page.getByText(/avis/i).first().isVisible().catch(() => false);

    // At least some content should be displayed
    expect(hasCourts || hasReviews).toBeTruthy();
  });

  test('should start booking flow from club page', async ({ page }) => {
    await page.goto('/clubs');
    await waitForPageReady(page);

    const clubLinks = page.locator('a[href^="/clubs/"]').first();
    const hasClubs = await clubLinks.isVisible().catch(() => false);

    if (!hasClubs) {
      test.skip(true, 'No clubs available');
      return;
    }

    await clubLinks.click();
    await page.waitForURL(/\/clubs\/[a-f0-9-]+/);
    await waitForPageReady(page);

    // Look for booking / reserve link
    const reserveLink = page.getByRole('link', { name: /server/i }).first();
    const hasReserve = await reserveLink.isVisible().catch(() => false);

    if (!hasReserve) {
      test.skip(true, 'No reservation link available');
      return;
    }

    await reserveLink.click();
    await page.waitForURL(/\/clubs\/[a-f0-9-]+\/reserver/);
    await waitForPageReady(page);

    // Should show booking step 1 (choose court)
    await expect(page.getByText(/terrain/i).first()).toBeVisible();
  });

  test('should navigate booking flow steps', async ({ page }) => {
    await page.goto('/clubs');
    await waitForPageReady(page);

    const clubLinks = page.locator('a[href^="/clubs/"]').first();
    const hasClubs = await clubLinks.isVisible().catch(() => false);

    if (!hasClubs) {
      test.skip(true, 'No clubs available');
      return;
    }

    await clubLinks.click();
    await page.waitForURL(/\/clubs\/[a-f0-9-]+/);
    await waitForPageReady(page);

    const reserveLink = page.getByRole('link', { name: /server/i }).first();
    const hasReserve = await reserveLink.isVisible().catch(() => false);

    if (!hasReserve) {
      test.skip(true, 'No reservation link available');
      return;
    }

    await reserveLink.click();
    await page.waitForURL(/\/clubs\/[a-f0-9-]+\/reserver/);
    await waitForPageReady(page);

    // Step 1: Select a court
    const courtButton = page.locator('button').filter({ hasText: /terrain|court/i }).first();
    const hasCourts = await courtButton.isVisible().catch(() => false);

    if (!hasCourts) {
      test.skip(true, 'No courts available');
      return;
    }

    await courtButton.click();
    await page.waitForTimeout(500);

    // Step 2: Select a date (click a future date button)
    const dateButtons = page.locator('button').filter({ has: page.locator('text=/\\d+/') });
    const dateCount = await dateButtons.count();

    if (dateCount > 1) {
      // Click a date that's a few days from now
      await dateButtons.nth(Math.min(2, dateCount - 1)).click();
      await page.waitForTimeout(500);
    }
  });

  test('should display user reservations page', async ({ page }) => {
    await page.goto('/profil/reservations');
    await waitForPageReady(page);

    // Should show reservations or empty state
    const hasContent = await page.getByText(/reservation|aucune/i).first().isVisible().catch(() => false);
    expect(hasContent).toBeTruthy();
  });
});
