import { type Page, type Locator, expect } from '@playwright/test';

/**
 * Reusable component for modal/dialog interactions.
 * Handles opening, closing, form submission within modals.
 */
export class ModalComponent {
  readonly page: Page;
  readonly root: Locator;

  constructor(page: Page, root?: Locator) {
    this.page = page;
    this.root = root || page.getByRole('dialog').first();
  }

  /** Wait for modal to appear */
  async waitForOpen(): Promise<void> {
    await this.root.waitFor({ state: 'visible' });
  }

  /** Wait for modal to close */
  async waitForClose(): Promise<void> {
    await this.root.waitFor({ state: 'hidden' });
  }

  /** Get the modal title */
  async getTitle(): Promise<string> {
    const heading = this.root.getByRole('heading').first();
    return (await heading.textContent())?.trim() || '';
  }

  /** Close the modal via close button */
  async close(): Promise<void> {
    await this.root.getByRole('button', { name: /close|×|✕/i }).click();
    await this.waitForClose();
  }

  /** Click a button inside the modal */
  async clickButton(name: string | RegExp): Promise<void> {
    await this.root.getByRole('button', { name }).click();
  }

  /** Confirm a confirmation dialog */
  async confirm(buttonText: string | RegExp = /confirm|yes|ok|delete|remove/i): Promise<void> {
    await this.clickButton(buttonText);
  }

  /** Cancel a confirmation dialog */
  async cancel(buttonText: string | RegExp = /cancel|no|close/i): Promise<void> {
    await this.clickButton(buttonText);
  }

  /** Assert modal is visible */
  async expectVisible(): Promise<void> {
    await expect(this.root).toBeVisible();
  }

  /** Assert modal is hidden */
  async expectHidden(): Promise<void> {
    await expect(this.root).toBeHidden();
  }

  /** Assert modal title matches */
  async expectTitle(title: string | RegExp): Promise<void> {
    await expect(this.root.getByRole('heading').first()).toHaveText(title);
  }

  /** Get a locator within the modal */
  locator(selector: string): Locator {
    return this.root.locator(selector);
  }

  /** Get element by role within modal */
  getByRole(role: Parameters<Locator['getByRole']>[0], options?: Parameters<Locator['getByRole']>[1]): Locator {
    return this.root.getByRole(role, options);
  }

  /** Get element by label within modal */
  getByLabel(label: string | RegExp): Locator {
    return this.root.getByLabel(label);
  }
}
