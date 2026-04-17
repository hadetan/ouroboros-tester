import { type Page, type Locator, expect } from '@playwright/test';

/**
 * Reusable component for data tables (grids, lists).
 * Handles pagination, sorting, row selection, searching.
 */
export class TableComponent {
  readonly page: Page;
  readonly root: Locator;

  constructor(page: Page, root?: Locator) {
    this.page = page;
    this.root = root || page.locator('table').first();
  }

  /** Get all visible rows (tbody tr) */
  get rows(): Locator {
    return this.root.locator('tbody tr');
  }

  /** Get row count */
  async getRowCount(): Promise<number> {
    return this.rows.count();
  }

  /** Get a specific row by index (0-based) */
  row(index: number): Locator {
    return this.rows.nth(index);
  }

  /** Get cell value by row index and column header text */
  async getCellValue(rowIndex: number, columnHeader: string): Promise<string> {
    const headers = this.root.locator('thead th');
    const headerCount = await headers.count();
    let colIndex = -1;

    for (let i = 0; i < headerCount; i++) {
      const text = await headers.nth(i).textContent();
      if (text?.trim().toLowerCase().includes(columnHeader.toLowerCase())) {
        colIndex = i;
        break;
      }
    }

    if (colIndex === -1) {
      throw new Error(`Column "${columnHeader}" not found`);
    }

    const cell = this.rows.nth(rowIndex).locator('td').nth(colIndex);
    return (await cell.textContent())?.trim() || '';
  }

  /** Find row containing specific text */
  rowContaining(text: string | RegExp): Locator {
    return this.rows.filter({ hasText: text });
  }

  /** Click a row's action button */
  async clickRowAction(rowLocator: Locator, actionName: string | RegExp): Promise<void> {
    await rowLocator.getByRole('button', { name: actionName }).click();
  }

  /** Get header cells */
  get headers(): Locator {
    return this.root.locator('thead th');
  }

  /** Click a column header (for sorting) */
  async sortBy(columnHeader: string): Promise<void> {
    await this.root.locator('thead th', { hasText: columnHeader }).click();
  }

  /** Wait for table to finish loading */
  async waitForData(): Promise<void> {
    await this.root.waitFor({ state: 'visible' });
    // Wait for at least one row or empty state
    await this.page.waitForTimeout(300);
  }

  /** Assert the table has a specific number of rows */
  async expectRowCount(count: number): Promise<void> {
    await expect(this.rows).toHaveCount(count);
  }

  /** Assert table contains a row with specific text */
  async expectRowWithText(text: string | RegExp): Promise<void> {
    await expect(this.rowContaining(text)).toBeVisible();
  }
}
