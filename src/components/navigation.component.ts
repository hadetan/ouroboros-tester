import { type Page, type Locator, expect } from '@playwright/test';

/**
 * Reusable component for navigation elements (sidebar, breadcrumbs, tabs).
 */
export class NavigationComponent {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /** Get the sidebar/main navigation */
  get sidebar(): Locator {
    return this.page.getByRole('navigation').first();
  }

  /** Click a navigation link by text */
  async navigateTo(text: string | RegExp): Promise<void> {
    await this.page.getByRole('link', { name: text }).click();
  }

  /** Click a tab by text */
  async selectTab(text: string | RegExp): Promise<void> {
    await this.page.getByRole('tab', { name: text }).click();
  }

  /** Assert a tab is selected/active */
  async expectTabActive(text: string | RegExp): Promise<void> {
    await expect(this.page.getByRole('tab', { name: text })).toHaveAttribute(
      'aria-selected',
      'true',
    );
  }

  /** Get breadcrumb items */
  get breadcrumbs(): Locator {
    return this.page.getByRole('navigation', { name: /breadcrumb/i }).getByRole('link');
  }

  /** Click a breadcrumb by text */
  async clickBreadcrumb(text: string | RegExp): Promise<void> {
    await this.breadcrumbs.filter({ hasText: text }).click();
  }

  /** Assert current page title/heading */
  async expectPageTitle(title: string | RegExp): Promise<void> {
    await expect(this.page.getByRole('heading', { level: 1 })).toHaveText(title);
  }
}
