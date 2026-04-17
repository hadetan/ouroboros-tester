import fs from 'fs';
import path from 'path';

export interface OuroborosConfig {
  project: {
    name: string;
    baseUrl: string;
    apiBaseUrl?: string;
  };
  auth?: {
    required: boolean;
    loginUrl?: string;
    credentials?: {
      default?: {
        username: string;
        password: string;
      };
      [role: string]: {
        username: string;
        password: string;
      } | undefined;
    };
    roles?: Record<string, unknown>;
    storageStatePath: string;
    sessionTimeout?: number;
  };
  exploration?: {
    screenshotOnAction?: boolean;
    captureNetworkRequests?: boolean;
    maxSectionsPerPage?: number;
    waitTimeout?: number;
  };
  testing?: {
    outputDir?: string;
    browsers?: string[];
    parallel?: boolean;
    retries?: number;
    workers?: number | null;
    traceOnFailure?: boolean;
  };
}

/**
 * Load the Ouroboros config from .ouroboros/config.json.
 * Searches up from cwd to find the config file.
 */
export function loadConfig(startDir?: string): OuroborosConfig {
  const configPath = findConfigFile(startDir || process.cwd());
  if (!configPath) {
    throw new Error(
      'Could not find .ouroboros/config.json. Run "orb init" to create one.',
    );
  }
  const raw = fs.readFileSync(configPath, 'utf-8');
  return JSON.parse(raw) as OuroborosConfig;
}

/**
 * Find config file by searching up the directory tree.
 */
function findConfigFile(startDir: string): string | null {
  let dir = path.resolve(startDir);
  const root = path.parse(dir).root;

  while (dir !== root) {
    const candidate = path.join(dir, '.ouroboros', 'config.json');
    if (fs.existsSync(candidate)) {
      return candidate;
    }
    dir = path.dirname(dir);
  }

  return null;
}
