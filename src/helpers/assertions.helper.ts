import { type Page, type Locator, expect } from '@playwright/test';
import { ToastComponent } from '../components/toast.component.js';

/**
 * Generic assertion helpers for common test patterns.
 * Domain projects can extend or compose these.
 */
export class AssertionHelper {
  readonly page: Page;
  readonly toast: ToastComponent;

  constructor(page: Page) {
    this.page = page;
    this.toast = new ToastComponent(page);
  }

  /** Assert a success toast appears with the given message */
  async expectSuccessToast(message: string | RegExp): Promise<void> {
    await this.toast.expectSuccess(message);
  }

  /** Assert an error toast appears with the given message */
  async expectErrorToast(message: string | RegExp): Promise<void> {
    await this.toast.expectError(message);
  }

  /** Assert the page URL matches */
  async expectUrl(pattern: string | RegExp): Promise<void> {
    await expect(this.page).toHaveURL(pattern);
  }

  /** Assert the page title matches */
  async expectTitle(title: string | RegExp): Promise<void> {
    await expect(this.page).toHaveTitle(title);
  }

  /** Assert element is visible */
  async expectVisible(locator: Locator): Promise<void> {
    await expect(locator).toBeVisible();
  }

  /** Assert element is hidden */
  async expectHidden(locator: Locator): Promise<void> {
    await expect(locator).toBeHidden();
  }

  /** Assert element has specific text */
  async expectText(locator: Locator, text: string | RegExp): Promise<void> {
    await expect(locator).toHaveText(text);
  }

  /** Assert element count */
  async expectCount(locator: Locator, count: number): Promise<void> {
    await expect(locator).toHaveCount(count);
  }

  /** Assert a loading state resolves (spinner disappears) */
  async expectLoadingComplete(
    spinnerLocator?: Locator,
    timeout = 30000,
  ): Promise<void> {
    const spinner = spinnerLocator || this.page.getByRole('progressbar');
    await expect(spinner).toBeHidden({ timeout });
  }

  /** Assert an empty state is shown */
  async expectEmptyState(text: string | RegExp = /no (data|records|results|items)/i): Promise<void> {
    await expect(this.page.getByText(text)).toBeVisible();
  }
}
