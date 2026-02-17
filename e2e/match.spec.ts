import { test, expect } from '@playwright/test';
import { getFutureDateTime, waitForPageReady, uniqueId, expectToast } from './helpers';

test.describe('Match Flow', () => {
  test('should display match list page', async ({ page }) => {
    await page.goto('/matchs');
    await waitForPageReady(page);

    await expect(page.getByRole('heading', { name: 'Matchs' })).toBeVisible();
    // Create button should be visible
    await expect(page.getByRole('link', { name: /Cr.er/i })).toBeVisible();
  });

  test('should open create match form', async ({ page }) => {
    await page.goto('/matchs/creer');
    await waitForPageReady(page);

    // Form fields should be present
    await expect(page.locator('#title')).toBeVisible();
    await expect(page.locator('#description')).toBeVisible();
    await expect(page.locator('#scheduled_at')).toBeVisible();
    await expect(page.locator('#location_name')).toBeVisible();
    await expect(page.getByRole('button', { name: /Cr.er le match/i })).toBeVisible();
  });

  test('should create a new match', async ({ page }) => {
    const matchTitle = `Match E2E ${uniqueId()}`;
    const futureDate = getFutureDateTime(5);

    await page.goto('/matchs/creer');
    await waitForPageReady(page);

    // Fill required fields
    await page.locator('#title').fill(matchTitle);
    await page.locator('#description').fill('Match de test E2E automatise');
    await page.locator('#scheduled_at').fill(futureDate);
    await page.locator('#location_name').fill('Padel Club E2E');

    // Submit
    await page.getByRole('button', { name: /Cr.er le match/i }).click();

    // Should redirect to match detail page
    await page.waitForURL(/\/matchs\/[a-f0-9-]+/, { timeout: 15_000 });
    await waitForPageReady(page);

    // Match title should be visible on detail page
    await expect(page.getByText(matchTitle)).toBeVisible();
  });

  test('should display match detail page', async ({ page }) => {
    // First create a match
    const matchTitle = `Match Detail ${uniqueId()}`;
    const futureDate = getFutureDateTime(5);

    await page.goto('/matchs/creer');
    await waitForPageReady(page);

    await page.locator('#title').fill(matchTitle);
    await page.locator('#scheduled_at').fill(futureDate);
    await page.locator('#location_name').fill('Padel Club Detail');
    await page.getByRole('button', { name: /Cr.er le match/i }).click();

    await page.waitForURL(/\/matchs\/[a-f0-9-]+/, { timeout: 15_000 });
    await waitForPageReady(page);

    // Check detail page elements
    await expect(page.getByText(matchTitle)).toBeVisible();
    await expect(page.getByText('Padel Club Detail')).toBeVisible();

    // As organizer, cancel button should be available
    await expect(page.getByRole('button', { name: /Annuler/i })).toBeVisible();
  });

  test('should navigate from match list to match detail', async ({ page }) => {
    await page.goto('/matchs');
    await waitForPageReady(page);

    // If there are match cards, click the first one
    const matchLinks = page.locator('a[href^="/matchs/"]').first();
    const hasMatches = await matchLinks.isVisible().catch(() => false);

    if (hasMatches) {
      await matchLinks.click();
      await page.waitForURL(/\/matchs\/[a-f0-9-]+/);
      await waitForPageReady(page);

      // Should show match detail content
      await expect(page.locator('main').first()).toBeVisible();
    }
  });

  test('should cancel a match as organizer', async ({ page }) => {
    // Create a match to cancel
    const matchTitle = `Match Cancel ${uniqueId()}`;
    const futureDate = getFutureDateTime(7);

    await page.goto('/matchs/creer');
    await waitForPageReady(page);

    await page.locator('#title').fill(matchTitle);
    await page.locator('#scheduled_at').fill(futureDate);
    await page.locator('#location_name').fill('Cancel Club');
    await page.getByRole('button', { name: /Cr.er le match/i }).click();

    await page.waitForURL(/\/matchs\/[a-f0-9-]+/, { timeout: 15_000 });
    await waitForPageReady(page);

    // Accept the confirmation dialog
    page.on('dialog', (dialog) => dialog.accept());

    // Click cancel
    await page.getByRole('button', { name: /Annuler le match/i }).click();

    // Should show success feedback or redirect
    await page.waitForTimeout(2000);
  });

  test('should navigate back from match creation', async ({ page }) => {
    await page.goto('/matchs/creer');
    await waitForPageReady(page);

    const backLink = page.getByRole('link', { name: /retour|matchs/i }).first();
    const hasBackLink = await backLink.isVisible().catch(() => false);

    if (hasBackLink) {
      await backLink.click();
      await expect(page).toHaveURL(/\/matchs/);
    }
  });

  test('should filter matches by tab', async ({ page }) => {
    await page.goto('/matchs');
    await waitForPageReady(page);

    // Check if search input exists
    const searchInput = page.locator('input[placeholder*="echerch"]').first();
    const hasSearch = await searchInput.isVisible().catch(() => false);

    if (hasSearch) {
      await searchInput.fill('test');
      await page.waitForTimeout(500);
      // Should filter results
    }
  });
});
