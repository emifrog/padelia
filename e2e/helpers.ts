import { type Page, expect } from '@playwright/test';

/**
 * Wait for navigation loading to complete.
 * Next.js shows a NProgress bar or similar — we just wait for network idle.
 */
export async function waitForPageReady(page: Page) {
  await page.waitForLoadState('networkidle');
}

/**
 * Navigate to a main section via bottom nav.
 */
export async function navigateViaBottomNav(
  page: Page,
  label: string
) {
  const nav = page.locator('nav').last();
  await nav.getByRole('link', { name: label }).click();
  await waitForPageReady(page);
}

/**
 * Fill a datetime-local input with a future date.
 * Returns the ISO string used.
 */
export function getFutureDateTime(daysFromNow: number = 3): string {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  date.setHours(18, 0, 0, 0);
  // Format as YYYY-MM-DDTHH:mm for datetime-local inputs
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}T18:00`;
}

/**
 * Assert a toast message appears.
 */
export async function expectToast(page: Page, text: string) {
  const toast = page.locator('[data-sonner-toast]').filter({ hasText: text });
  await expect(toast.first()).toBeVisible({ timeout: 10_000 });
}

/**
 * Dismiss any visible toasts by clicking them.
 */
export async function dismissToasts(page: Page) {
  const toasts = page.locator('[data-sonner-toast]');
  const count = await toasts.count();
  for (let i = 0; i < count; i++) {
    await toasts.nth(i).click().catch(() => {});
  }
}

/**
 * Generate a unique test identifier to avoid collisions.
 */
export function uniqueId(prefix: string = 'e2e'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}
