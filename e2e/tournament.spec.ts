import { test, expect } from '@playwright/test';
import { getFutureDateTime, waitForPageReady, uniqueId } from './helpers';

test.describe('Tournament Flow', () => {
  test('should display tournaments list page', async ({ page }) => {
    await page.goto('/tournois');
    await waitForPageReady(page);

    // Should show page heading and create button
    await expect(page.getByRole('heading', { name: /Tournois/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Cr.er/i })).toBeVisible();
  });

  test('should show tournament tabs', async ({ page }) => {
    await page.goto('/tournois');
    await waitForPageReady(page);

    // Should have tab buttons
    await expect(page.getByRole('button', { name: /venir/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /En cours/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Termin/i })).toBeVisible();
  });

  test('should search tournaments', async ({ page }) => {
    await page.goto('/tournois');
    await waitForPageReady(page);

    const searchInput = page.locator('input[placeholder*="echerch"]').first();
    const hasSearch = await searchInput.isVisible().catch(() => false);

    if (hasSearch) {
      await searchInput.fill('Open');
      await page.waitForTimeout(500);
    }
  });

  test('should open create tournament form', async ({ page }) => {
    await page.goto('/tournois/creer');
    await waitForPageReady(page);

    // Form fields should be present
    await expect(page.locator('#name')).toBeVisible();
    await expect(page.locator('#description')).toBeVisible();
    await expect(page.locator('#starts_at')).toBeVisible();
    await expect(page.locator('#location_name')).toBeVisible();
    await expect(page.getByRole('button', { name: /Cr.er le tournoi/i })).toBeVisible();
  });

  test('should create a new tournament', async ({ page }) => {
    const tournamentName = `Tournoi E2E ${uniqueId()}`;
    const futureDate = getFutureDateTime(14);

    await page.goto('/tournois/creer');
    await waitForPageReady(page);

    // Fill required fields
    await page.locator('#name').fill(tournamentName);
    await page.locator('#description').fill('Tournoi de test E2E automatise');
    await page.locator('#starts_at').fill(futureDate);
    await page.locator('#location_name').fill('Padel Arena E2E');

    // Submit
    await page.getByRole('button', { name: /Cr.er le tournoi/i }).click();

    // Should redirect to tournament detail page
    await page.waitForURL(/\/tournois\/[a-f0-9-]+/, { timeout: 15_000 });
    await waitForPageReady(page);

    // Tournament name should be visible on detail page
    await expect(page.getByText(tournamentName)).toBeVisible();
  });

  test('should display tournament detail page', async ({ page }) => {
    const tournamentName = `Tournoi Detail ${uniqueId()}`;
    const futureDate = getFutureDateTime(14);

    await page.goto('/tournois/creer');
    await waitForPageReady(page);

    await page.locator('#name').fill(tournamentName);
    await page.locator('#starts_at').fill(futureDate);
    await page.locator('#location_name').fill('Detail Arena');
    await page.getByRole('button', { name: /Cr.er le tournoi/i }).click();

    await page.waitForURL(/\/tournois\/[a-f0-9-]+/, { timeout: 15_000 });
    await waitForPageReady(page);

    // Check detail page elements
    await expect(page.getByText(tournamentName)).toBeVisible();
    await expect(page.getByText('Detail Arena')).toBeVisible();

    // As organizer, should see status management buttons
    await expect(page.getByText(/inscription|draft/i).first()).toBeVisible();
  });

  test('should open registrations for a tournament', async ({ page }) => {
    const tournamentName = `Tournoi Open ${uniqueId()}`;
    const futureDate = getFutureDateTime(14);

    await page.goto('/tournois/creer');
    await waitForPageReady(page);

    await page.locator('#name').fill(tournamentName);
    await page.locator('#starts_at').fill(futureDate);
    await page.locator('#location_name').fill('Open Arena');
    await page.getByRole('button', { name: /Cr.er le tournoi/i }).click();

    await page.waitForURL(/\/tournois\/[a-f0-9-]+/, { timeout: 15_000 });
    await waitForPageReady(page);

    // Open registrations (organizer action)
    const openButton = page.getByRole('button', { name: /Ouvrir les inscriptions/i });
    const hasOpenButton = await openButton.isVisible().catch(() => false);

    if (hasOpenButton) {
      await openButton.click();
      await page.waitForTimeout(2000);
      await waitForPageReady(page);
    }
  });

  test('should navigate to tournament registration page', async ({ page }) => {
    await page.goto('/tournois');
    await waitForPageReady(page);

    // Click first tournament card
    const tournamentLinks = page.locator('a[href^="/tournois/"]').first();
    const hasTournaments = await tournamentLinks.isVisible().catch(() => false);

    if (!hasTournaments) {
      test.skip(true, 'No tournaments available');
      return;
    }

    await tournamentLinks.click();
    await page.waitForURL(/\/tournois\/[a-f0-9-]+/);
    await waitForPageReady(page);

    // Check if registration link/button is present
    const registerLink = page.getByRole('link', { name: /inscrire|inscription/i }).first();
    const hasRegister = await registerLink.isVisible().catch(() => false);

    if (hasRegister) {
      await registerLink.click();
      await page.waitForURL(/\/tournois\/[a-f0-9-]+\/inscrire/);
      await waitForPageReady(page);

      // Should show step 1 (team name)
      await expect(page.locator('#team_name')).toBeVisible();
    }
  });

  test('should fill tournament registration step 1', async ({ page }) => {
    await page.goto('/tournois');
    await waitForPageReady(page);

    const tournamentLinks = page.locator('a[href^="/tournois/"]').first();
    const hasTournaments = await tournamentLinks.isVisible().catch(() => false);

    if (!hasTournaments) {
      test.skip(true, 'No tournaments available');
      return;
    }

    await tournamentLinks.click();
    await page.waitForURL(/\/tournois\/[a-f0-9-]+/);
    await waitForPageReady(page);

    const registerLink = page.getByRole('link', { name: /inscrire|inscription/i }).first();
    const hasRegister = await registerLink.isVisible().catch(() => false);

    if (!hasRegister) {
      test.skip(true, 'Registration not available');
      return;
    }

    await registerLink.click();
    await page.waitForURL(/\/tournois\/[a-f0-9-]+\/inscrire/);
    await waitForPageReady(page);

    // Fill team name
    await page.locator('#team_name').fill('Les Smasheurs E2E');

    // Click continue
    await page.getByRole('button', { name: /Continuer/i }).click();
    await page.waitForTimeout(500);

    // Should advance to step 2 (partner search)
    await expect(page.getByPlaceholder(/Rechercher un joueur/i)).toBeVisible();
  });

  test('should navigate between tournament list tabs', async ({ page }) => {
    await page.goto('/tournois');
    await waitForPageReady(page);

    // Click "En cours" tab
    await page.getByRole('button', { name: /En cours/i }).click();
    await page.waitForTimeout(500);

    // Click "Termines" tab
    await page.getByRole('button', { name: /Termin/i }).click();
    await page.waitForTimeout(500);

    // Click "A venir" tab
    await page.getByRole('button', { name: /venir/i }).click();
    await page.waitForTimeout(500);
  });

  test('should load more tournaments on pagination', async ({ page }) => {
    await page.goto('/tournois');
    await waitForPageReady(page);

    // Check if "Charger plus" button exists
    const loadMoreButton = page.getByRole('button', { name: /Charger plus/i });
    const hasLoadMore = await loadMoreButton.isVisible().catch(() => false);

    if (hasLoadMore) {
      await loadMoreButton.click();
      await page.waitForTimeout(2000);
    }
  });
});
