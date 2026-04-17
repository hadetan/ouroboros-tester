import { APIHelper } from '../helpers/api.helper.js';

export interface TrackedEntity {
  type: string;
  id: string | number;
  endpoint: string;
}

/**
 * Tracks test data created during tests for guaranteed cleanup.
 * Every entity created via API or UI must be tracked here.
 *
 * Usage:
 * ```
 * const entity = await apiHelper.post('/api/users', userData);
 * dataManager.track({ type: 'user', id: entity.id, endpoint: '/api/users' });
 * ```
 */
export class DataManager {
  private tracked: TrackedEntity[] = [];
  private apiHelper: APIHelper;

  constructor(apiHelper: APIHelper) {
    this.apiHelper = apiHelper;
  }

  /** Track an entity for cleanup */
  track(entity: TrackedEntity): void {
    this.tracked.push(entity);
  }

  /** Untrack a specific entity (e.g., if already deleted as part of test) */
  untrack(id: string | number): void {
    this.tracked = this.tracked.filter((e) => e.id !== id);
  }

  /** Get all tracked entities */
  getTracked(): TrackedEntity[] {
    return [...this.tracked];
  }

  /** Get tracked entities by type */
  getByType(type: string): TrackedEntity[] {
    return this.tracked.filter((e) => e.type === type);
  }

  /**
   * Clean up all tracked entities in reverse order.
   * Called automatically by the base fixture after each test.
   */
  async cleanup(): Promise<void> {
    const errors: Error[] = [];

    // Delete in reverse order (LIFO) to handle dependencies
    for (const entity of [...this.tracked].reverse()) {
      try {
        await this.apiHelper.delete(`${entity.endpoint}/${entity.id}`);
      } catch (error) {
        errors.push(
          new Error(`Failed to cleanup ${entity.type} (${entity.id}): ${error}`),
        );
      }
    }

    this.tracked = [];

    if (errors.length > 0) {
      console.warn(
        `DataManager cleanup warnings:\n${errors.map((e) => `  - ${e.message}`).join('\n')}`,
      );
    }
  }
}
