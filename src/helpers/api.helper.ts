import { type APIRequestContext, request } from '@playwright/test';
import { type OuroborosConfig } from '../utils/config.js';

/**
 * Generic API helper for test data setup and teardown.
 * Uses Playwright's APIRequestContext for authenticated requests.
 */
export class APIHelper {
  private config: OuroborosConfig;
  private context!: APIRequestContext;

  constructor(config: OuroborosConfig) {
    this.config = config;
  }

  /** Initialize the API request context with auth storage state */
  async init(): Promise<void> {
    const storageStatePath = this.config.auth?.storageStatePath;
    this.context = await request.newContext({
      baseURL: this.config.project.apiBaseUrl || this.config.project.baseUrl,
      ...(storageStatePath ? { storageState: storageStatePath } : {}),
    });
  }

  /** Make a GET request */
  async get<T = unknown>(path: string, params?: Record<string, string>): Promise<T> {
    const response = await this.context.get(path, { params });
    if (!response.ok()) {
      throw new Error(`GET ${path} failed: ${response.status()} ${response.statusText()}`);
    }
    return response.json() as Promise<T>;
  }

  /** Make a POST request */
  async post<T = unknown>(path: string, data?: unknown): Promise<T> {
    const response = await this.context.post(path, { data });
    if (!response.ok()) {
      throw new Error(`POST ${path} failed: ${response.status()} ${response.statusText()}`);
    }
    return response.json() as Promise<T>;
  }

  /** Make a PUT request */
  async put<T = unknown>(path: string, data?: unknown): Promise<T> {
    const response = await this.context.put(path, { data });
    if (!response.ok()) {
      throw new Error(`PUT ${path} failed: ${response.status()} ${response.statusText()}`);
    }
    return response.json() as Promise<T>;
  }

  /** Make a PATCH request */
  async patch<T = unknown>(path: string, data?: unknown): Promise<T> {
    const response = await this.context.patch(path, { data });
    if (!response.ok()) {
      throw new Error(`PATCH ${path} failed: ${response.status()} ${response.statusText()}`);
    }
    return response.json() as Promise<T>;
  }

  /** Make a DELETE request */
  async delete(path: string): Promise<void> {
    const response = await this.context.delete(path);
    if (!response.ok()) {
      throw new Error(`DELETE ${path} failed: ${response.status()} ${response.statusText()}`);
    }
  }

  /** Dispose the API context */
  async dispose(): Promise<void> {
    await this.context.dispose();
  }
}
