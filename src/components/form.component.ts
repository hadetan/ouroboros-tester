import { type Page, type Locator, expect } from '@playwright/test';

/**
 * Reusable component for forms (create, edit, filter forms).
 * Handles field interactions, validation, and submission.
 */
export class FormComponent {
  readonly page: Page;
  readonly root: Locator;

  constructor(page: Page, root?: Locator) {
    this.page = page;
    this.root = root || page.locator('form').first();
  }

  /** Fill a text input by label */
  async fillByLabel(label: string | RegExp, value: string): Promise<void> {
    await this.root.getByLabel(label).fill(value);
  }

  /** Select a dropdown option by label */
  async selectByLabel(label: string | RegExp, value: string): Promise<void> {
    await this.root.getByLabel(label).selectOption(value);
  }

  /** Check a checkbox by label */
  async checkByLabel(label: string | RegExp): Promise<void> {
    await this.root.getByLabel(label).check();
  }

  /** Uncheck a checkbox by label */
  async uncheckByLabel(label: string | RegExp): Promise<void> {
    await this.root.getByLabel(label).uncheck();
  }

  /** Click a radio button by label */
  async selectRadio(label: string | RegExp): Promise<void> {
    await this.root.getByLabel(label).click();
  }

  /** Get a field locator by label */
  field(label: string | RegExp): Locator {
    return this.root.getByLabel(label);
  }

  /** Fill multiple fields at once */
  async fillFields(fields: Record<string, string>): Promise<void> {
    for (const [label, value] of Object.entries(fields)) {
      await this.fillByLabel(label, value);
    }
  }

  /** Submit the form via submit button */
  async submit(buttonText: string | RegExp = /submit|save|create|update/i): Promise<void> {
    await this.root.getByRole('button', { name: buttonText }).click();
  }

  /** Cancel / close the form */
  async cancel(buttonText: string | RegExp = /cancel|close|discard/i): Promise<void> {
    await this.root.getByRole('button', { name: buttonText }).click();
  }

  /** Assert a field has a validation error */
  async expectFieldError(label: string | RegExp, errorText: string | RegExp): Promise<void> {
    const field = this.root.getByLabel(label);
    const fieldContainer = field.locator('..');
    await expect(fieldContainer.getByText(errorText)).toBeVisible();
  }

  /** Assert the form is in a clean (empty) state */
  async expectEmpty(fieldLabels: (string | RegExp)[]): Promise<void> {
    for (const label of fieldLabels) {
      await expect(this.root.getByLabel(label)).toHaveValue('');
    }
  }

  /** Get the value of a field */
  async getFieldValue(label: string | RegExp): Promise<string> {
    return this.root.getByLabel(label).inputValue();
  }
}
