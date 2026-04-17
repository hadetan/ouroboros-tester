import { test as base, type Page } from '@playwright/test';
import { loadConfig, type OuroborosConfig } from '../utils/config.js';
import { DataManager } from './data.fixture.js';
import { APIHelper } from '../helpers/api.helper.js';

/**
 * Base fixtures provided by the Ouroboros Tester framework.
 * Domain projects extend these with their own page objects and helpers.
 *
 * Usage in domain project (src/fixtures/test.fixture.ts):
 * ```
 * import { createBaseFixtures } from 'ouroboros-tester/fixtures/base.fixture';
 * const baseTest = createBaseFixtures();
 * export const test = baseTest.extend<DomainFixtures>({ ... });
 * export { expect } from '@playwright/test';
 * ```
 */

export interface BaseFixtures {
  config: OuroborosConfig;
  apiHelper: APIHelper;
  dataManager: DataManager;
}

/**
 * Creates the base test fixture with config, API helper, and data manager.
 * Extend this in your domain project's test.fixture.ts.
 */
export function createBaseFixtures() {
  return base.extend<BaseFixtures>({
    config: async ({}, use) => {
      const config = loadConfig();
      await use(config);
    },

    apiHelper: async ({ config }, use) => {
      const helper = new APIHelper(config);
      await helper.init();
      await use(helper);
    },

    dataManager: async ({ apiHelper }, use) => {
      const manager = new DataManager(apiHelper);
      await use(manager);
      // Cleanup all tracked entities after each test
      await manager.cleanup();
    },
  });
}
