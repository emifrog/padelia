import { test as setup, expect } from '@playwright/test';
import path from 'path';

const authFile = path.join(__dirname, '.auth', 'user.json');

setup('authenticate', async ({ page }) => {
  const email = process.env.E2E_USER_EMAIL;
  const password = process.env.E2E_USER_PASSWORD;

  if (!email || !password) {
    throw new Error(
      'E2E_USER_EMAIL and E2E_USER_PASSWORD must be set in .env.test'
    );
  }

  await page.goto('/login');

  await page.locator('#email').fill(email);
  await page.locator('#password').fill(password);
  await page.getByRole('button', { name: 'Se connecter' }).click();

  // Wait for redirect to /accueil (or /onboarding for fresh accounts)
  await page.waitForURL(/\/(accueil|onboarding)/, { timeout: 15_000 });

  // If redirected to onboarding, complete it
  if (page.url().includes('/onboarding')) {
    // Step 1: Identity
    await page.locator('#username').fill('e2e_test_user');
    await page.locator('#city').fill('Nice');
    await page.getByRole('button', { name: 'Suivant' }).click();

    // Step 2: Level — default is fine
    await page.getByRole('button', { name: 'Suivant' }).click();

    // Step 3: Style — defaults are fine
    await page.getByRole('button', { name: 'Terminer' }).click();

    await page.waitForURL('**/accueil', { timeout: 15_000 });
  }

  await expect(page).toHaveURL(/\/accueil/);

  await page.context().storageState({ path: authFile });
});
