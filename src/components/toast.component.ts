import { type Page, type Locator, expect } from '@playwright/test';

/**
 * Reusable component for toast/notification messages.
 * Handles success, error, warning, and info toasts.
 */
export class ToastComponent {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /** Get all visible toasts */
  get toasts(): Locator {
    return this.page.getByRole('alert');
  }

  /** Wait for a toast with specific text */
  async waitForToast(text: string | RegExp, options?: { timeout?: number }): Promise<Locator> {
    const toast = this.page.getByRole('alert').filter({ hasText: text });
    await toast.waitFor({ state: 'visible', timeout: options?.timeout ?? 10000 });
    return toast;
  }

  /** Assert a success toast is shown */
  async expectSuccess(text: string | RegExp): Promise<void> {
    await expect(this.page.getByRole('alert').filter({ hasText: text })).toBeVisible();
  }

  /** Assert an error toast is shown */
  async expectError(text: string | RegExp): Promise<void> {
    await expect(this.page.getByRole('alert').filter({ hasText: text })).toBeVisible();
  }

  /** Dismiss a toast by clicking its close button */
  async dismiss(text?: string | RegExp): Promise<void> {
    const toast = text
      ? this.page.getByRole('alert').filter({ hasText: text })
      : this.page.getByRole('alert').first();
    const closeBtn = toast.getByRole('button', { name: /close|dismiss|×/i });
    if (await closeBtn.isVisible()) {
      await closeBtn.click();
    }
  }

  /** Wait for all toasts to disappear */
  async waitForClear(timeout = 10000): Promise<void> {
    await this.page.waitForFunction(
      () => document.querySelectorAll('[role="alert"]').length === 0,
      { timeout },
    );
  }
}
