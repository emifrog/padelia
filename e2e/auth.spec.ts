import { test, expect } from '@playwright/test';

test.describe('Auth Flow', () => {
  // These tests don't use stored auth state
  test.use({ storageState: { cookies: [], origins: [] } });

  test('should display login page with all elements', async ({ page }) => {
    await page.goto('/login');

    // Check form elements
    await expect(page.locator('#email')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Se connecter' })).toBeVisible();
    await expect(page.getByRole('button', { name: /Google/ })).toBeVisible();
    await expect(page.getByRole('link', { name: /inscrire/i })).toBeVisible();
  });

  test('should display register page with all elements', async ({ page }) => {
    await page.goto('/register');

    await expect(page.locator('#fullName')).toBeVisible();
    await expect(page.locator('#email')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();
    await expect(page.getByRole('button', { name: /Cr.er mon compte/ })).toBeVisible();
    await expect(page.getByRole('link', { name: /connecter/i })).toBeVisible();
  });

  test('should navigate between login and register', async ({ page }) => {
    await page.goto('/login');

    // Go to register
    await page.getByRole('link', { name: /inscrire/i }).click();
    await expect(page).toHaveURL(/\/register/);

    // Go back to login
    await page.getByRole('link', { name: /connecter/i }).click();
    await expect(page).toHaveURL(/\/login/);
  });

  test('should show error on invalid credentials', async ({ page }) => {
    await page.goto('/login');

    await page.locator('#email').fill('invalid@test.com');
    await page.locator('#password').fill('wrongpassword');
    await page.getByRole('button', { name: 'Se connecter' }).click();

    // Should show error toast
    const toast = page.locator('[data-sonner-toast]').filter({ hasText: /incorrect/i });
    await expect(toast.first()).toBeVisible({ timeout: 10_000 });
  });

  test('should redirect unauthenticated user to login', async ({ page }) => {
    await page.goto('/accueil');
    await expect(page).toHaveURL(/\/login/);
  });

  test('should redirect unauthenticated user from matchs to login', async ({ page }) => {
    await page.goto('/matchs');
    await expect(page).toHaveURL(/\/login/);
  });

  test('should login successfully with valid credentials', async ({ page }) => {
    const email = process.env.E2E_USER_EMAIL;
    const password = process.env.E2E_USER_PASSWORD;
    if (!email || !password) {
      test.skip(true, 'E2E credentials not configured');
      return;
    }

    await page.goto('/login');

    await page.locator('#email').fill(email);
    await page.locator('#password').fill(password);
    await page.getByRole('button', { name: 'Se connecter' }).click();

    await page.waitForURL(/\/(accueil|onboarding)/, { timeout: 15_000 });
    // Should be on accueil or onboarding
    expect(page.url()).toMatch(/\/(accueil|onboarding)/);
  });
});

test.describe('Onboarding Flow', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('should display onboarding steps correctly', async ({ page }) => {
    const email = process.env.E2E_USER_EMAIL;
    const password = process.env.E2E_USER_PASSWORD;
    if (!email || !password) {
      test.skip(true, 'E2E credentials not configured');
      return;
    }

    // This test verifies the structure of the onboarding page
    // We navigate directly since the user may already be onboarded
    await page.goto('/login');
    await page.locator('#email').fill(email);
    await page.locator('#password').fill(password);
    await page.getByRole('button', { name: 'Se connecter' }).click();
    await page.waitForURL(/\/(accueil|onboarding)/, { timeout: 15_000 });

    // If already onboarded, skip
    if (page.url().includes('/accueil')) {
      test.skip(true, 'User already onboarded');
      return;
    }

    // Step 1: Identity
    await expect(page.locator('#username')).toBeVisible();
    await expect(page.locator('#city')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Suivant' })).toBeVisible();

    // Fill step 1
    await page.locator('#username').fill('e2e_test');
    await page.locator('#city').fill('Nice');
    await page.getByRole('button', { name: 'Suivant' }).click();

    // Step 2: Level
    await expect(page.getByText(/initie/i).first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'Suivant' })).toBeVisible();
    await page.getByRole('button', { name: 'Suivant' }).click();

    // Step 3: Style
    await expect(page.getByRole('button', { name: 'Terminer' })).toBeVisible();
  });
});

test.describe('Authenticated Redirects', () => {
  // Uses stored auth state (logged in user)
  test('should redirect /login to /accueil when authenticated', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveURL(/\/accueil/);
  });

  test('should redirect /register to /accueil when authenticated', async ({ page }) => {
    await page.goto('/register');
    await expect(page).toHaveURL(/\/accueil/);
  });

  test('should access /accueil when authenticated', async ({ page }) => {
    await page.goto('/accueil');
    await expect(page).toHaveURL(/\/accueil/);
    // Page should have main content
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });
});
