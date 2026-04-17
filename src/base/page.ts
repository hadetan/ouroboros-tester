import { type Page, type Locator } from '@playwright/test';

export interface BasePageOptions {
  page: Page;
  baseUrl?: string;
}

/**
 * Base class for all Page Object Models.
 * Domain page objects extend this with page-specific interactions.
 */
export class BasePage {
  readonly page: Page;
  readonly baseUrl: string;

  constructor({ page, baseUrl }: BasePageOptions) {
    this.page = page;
    this.baseUrl = baseUrl || '';
  }

  /** Navigate to a path relative to baseUrl */
  async goto(path: string): Promise<void> {
    await this.page.goto(this.baseUrl + path);
  }

  /** Wait for page to reach network idle */
  async waitForLoad(): Promise<void> {
    await this.page.waitForLoadState('networkidle');
  }

  /** Wait for a specific URL pattern */
  async waitForUrl(pattern: string | RegExp): Promise<void> {
    await this.page.waitForURL(pattern);
  }

  /** Get a locator scoped to the page */
  locator(selector: string): Locator {
    return this.page.locator(selector);
  }

  /** Get element by role */
  getByRole(role: Parameters<Page['getByRole']>[0], options?: Parameters<Page['getByRole']>[1]): Locator {
    return this.page.getByRole(role, options);
  }

  /** Get element by label */
  getByLabel(text: string | RegExp, options?: { exact?: boolean }): Locator {
    return this.page.getByLabel(text, options);
  }

  /** Get element by text */
  getByText(text: string | RegExp, options?: { exact?: boolean }): Locator {
    return this.page.getByText(text, options);
  }

  /** Get element by test id */
  getByTestId(testId: string | RegExp): Locator {
    return this.page.getByTestId(testId);
  }

  /** Get element by placeholder */
  getByPlaceholder(text: string | RegExp, options?: { exact?: boolean }): Locator {
    return this.page.getByPlaceholder(text, options);
  }

  /** Take a screenshot for debugging */
  async screenshot(name: string): Promise<Buffer> {
    return this.page.screenshot({ path: `playwright/screenshots/${name}.png` });
  }
}
