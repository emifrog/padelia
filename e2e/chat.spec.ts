import { test, expect } from '@playwright/test';
import { waitForPageReady } from './helpers';

test.describe('Chat Flow', () => {
  test('should display chat page with conversations list', async ({ page }) => {
    await page.goto('/chat');
    await waitForPageReady(page);

    await expect(page.getByRole('heading', { name: 'Messages' })).toBeVisible();

    // New conversation button should be visible
    await expect(page.getByRole('button', { name: /Nouveau/i })).toBeVisible();
  });

  test('should open new conversation sheet', async ({ page }) => {
    await page.goto('/chat');
    await waitForPageReady(page);

    // Click new conversation button
    await page.getByRole('button', { name: /Nouveau/i }).click();

    // Sheet should appear with search input
    await expect(page.getByText(/Nouvelle conversation/i)).toBeVisible({ timeout: 5_000 });
    await expect(page.getByPlaceholder(/Chercher un joueur/i)).toBeVisible();
  });

  test('should search for players in new conversation sheet', async ({ page }) => {
    await page.goto('/chat');
    await waitForPageReady(page);

    await page.getByRole('button', { name: /Nouveau/i }).click();

    await expect(page.getByPlaceholder(/Chercher un joueur/i)).toBeVisible({ timeout: 5_000 });

    // Type a search query
    await page.getByPlaceholder(/Chercher un joueur/i).fill('test');

    // Wait for search results
    await page.waitForTimeout(1000);
  });

  test('should navigate to existing conversation', async ({ page }) => {
    await page.goto('/chat');
    await waitForPageReady(page);

    // Check if there are existing conversations
    const conversationLinks = page.locator('a[href^="/chat/"]').first();
    const hasConversations = await conversationLinks.isVisible().catch(() => false);

    if (hasConversations) {
      await conversationLinks.click();
      await page.waitForURL(/\/chat\/[a-f0-9-]+/);
      await waitForPageReady(page);

      // Chat window should show message input
      await expect(page.getByPlaceholder(/crire un message/i)).toBeVisible();
    } else {
      // Empty state
      await expect(page.getByText(/Aucune conversation/i)).toBeVisible();
    }
  });

  test('should display chat window with message input', async ({ page }) => {
    await page.goto('/chat');
    await waitForPageReady(page);

    const conversationLinks = page.locator('a[href^="/chat/"]').first();
    const hasConversations = await conversationLinks.isVisible().catch(() => false);

    if (!hasConversations) {
      test.skip(true, 'No existing conversations to test');
      return;
    }

    await conversationLinks.click();
    await page.waitForURL(/\/chat\/[a-f0-9-]+/);
    await waitForPageReady(page);

    // Should show message area and input
    await expect(page.getByPlaceholder(/crire un message/i)).toBeVisible();

    // Back link should go to chat list
    const backLink = page.getByRole('link', { name: /retour|messages/i }).first();
    const altBackLink = page.locator('a[href="/chat"]').first();
    const hasBack = await backLink.isVisible().catch(() => false)
      || await altBackLink.isVisible().catch(() => false);
    expect(hasBack).toBeTruthy();
  });

  test('should send a message in conversation', async ({ page }) => {
    await page.goto('/chat');
    await waitForPageReady(page);

    const conversationLinks = page.locator('a[href^="/chat/"]').first();
    const hasConversations = await conversationLinks.isVisible().catch(() => false);

    if (!hasConversations) {
      test.skip(true, 'No existing conversations to test');
      return;
    }

    await conversationLinks.click();
    await page.waitForURL(/\/chat\/[a-f0-9-]+/);
    await waitForPageReady(page);

    const messageInput = page.getByPlaceholder(/crire un message/i);
    await expect(messageInput).toBeVisible();

    const testMessage = `E2E test message ${Date.now()}`;
    await messageInput.fill(testMessage);

    // Send with Enter key
    await messageInput.press('Enter');

    // Message should appear in the chat
    await expect(page.getByText(testMessage)).toBeVisible({ timeout: 10_000 });
  });

  test('should show empty state when no conversations', async ({ page }) => {
    await page.goto('/chat');
    await waitForPageReady(page);

    const conversationLinks = page.locator('a[href^="/chat/"]').first();
    const hasConversations = await conversationLinks.isVisible().catch(() => false);

    if (!hasConversations) {
      await expect(page.getByText(/Aucune conversation/i)).toBeVisible();
    }
  });
});
