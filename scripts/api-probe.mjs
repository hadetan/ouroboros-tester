#!/usr/bin/env node

/**
 * API Probe — Agent Tooling Script
 *
 * Centralized tool for agents to authenticate against the target application,
 * probe API endpoints, discover auth mechanisms, and capture network contracts.
 * Replaces manual browser-based API discovery with deterministic, repeatable commands.
 *
 * Usage:
 *   node scripts/api-probe.mjs auth                                # Login, discover auth mechanism, save storageState
 *   node scripts/api-probe.mjs extract-auth                        # Extract auth details from saved storageState
 *   node scripts/api-probe.mjs probe <METHOD> <path> [--data '{}'] # Authenticated API call, returns contract
 *   node scripts/api-probe.mjs smoke [path]                        # Auth + API probe + navigation check
 *   node scripts/api-probe.mjs intercept-snippet                   # JS snippet for browser-side network capture
 *   node scripts/api-probe.mjs run --code '<fn>' [--url <url>]     # Run arbitrary code in authenticated browser
 *   node scripts/api-probe.mjs verify-contract <spec> [--all]      # Verify spec API contracts against live endpoints
 *
 * Flags:
 *   --json, --raw       Machine-readable JSON output (default: formatted)
 *   --storageState <p>  Override storageState file path
 *   --data <json>       Request payload for probe POST/PUT/PATCH
 *   --brief             Truncate large response bodies (arrays to 2 items)
 *
 * Output format:
 *   { "status": "success"|"error", "command": "<cmd>", "data": {...}, "errors": [...] }
 *
 * Exit codes:
 *   0 — success
 *   1 — error (check .errors array for details)
 */

import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { resolve, join } from 'node:path';

const ROOT = resolve(process.cwd());
const CONFIG_PATH = join(ROOT, '.ouroboros', 'config.json');

const rawArgs = process.argv.slice(2);
const command = rawArgs.find((a) => !a.startsWith('--'));
const jsonMode =
  rawArgs.includes('--json') || rawArgs.includes('--raw');
const briefMode = rawArgs.includes('--brief');

function getFlagValue(flag) {
  const idx = rawArgs.indexOf(flag);
  return idx !== -1 && idx + 1 < rawArgs.length
    ? rawArgs[idx + 1]
    : undefined;
}

const storageStateOverride = getFlagValue('--storageState');
const dataFlag = getFlagValue('--data');

// Positional args (everything that isn't the command or a flag)
const positionalArgs = rawArgs.filter(
  (a, i) =>
    a !== command &&
    !a.startsWith('--') &&
    !(i > 0 && rawArgs[i - 1].startsWith('--')),
);

function loadConfig() {
  if (!existsSync(CONFIG_PATH)) return null;
  return JSON.parse(readFileSync(CONFIG_PATH, 'utf-8'));
}

function getStorageStatePath(config) {
  return storageStateOverride || resolve(ROOT, config.auth.storageStatePath);
}

function output(status, cmd, data, errors = []) {
  const result = { status, command: cmd, data, errors };
  if (jsonMode) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    const icon = status === 'success' ? '✅' : '❌';
    console.log(`\n${icon} api-probe ${cmd}`);
    if (errors.length > 0) {
      for (const e of errors) console.log(`  ❌ ${e}`);
      console.log('');
    }
    if (data) {
      console.log(JSON.stringify(data, null, 2));
    }
  }
  process.exit(status === 'success' ? 0 : 1);
}

/**
 * Given any JSON value, produce a TypeScript-like type string.
 * Used by agents to understand API response structure without
 * reading the entire response body.
 */
function inferShape(value, depth = 0, maxDepth = 4, indent = 0) {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  const type = typeof value;
  if (type === 'string') return 'string';
  if (type === 'number') return 'number';
  if (type === 'boolean') return 'boolean';

  const pad = '  '.repeat(indent);
  const innerPad = '  '.repeat(indent + 1);

  if (Array.isArray(value)) {
    if (value.length === 0) return 'unknown[]';
    const itemShape = inferShape(value[0], depth + 1, maxDepth, indent);
    return `Array<${itemShape}>`;
  }

  if (type === 'object') {
    if (depth >= maxDepth) return 'object';
    const entries = Object.entries(value);
    if (entries.length === 0) return '{}';
    const fields = entries.map(
      ([k, v]) =>
        `${innerPad}${k}: ${inferShape(v, depth + 1, maxDepth, indent + 1)}`,
    );
    return `{\n${fields.join(',\n')}\n${pad}}`;
  }

  return 'unknown';
}

/**
 * Flatten all fields in a JSON value into a dot-path inventory.
 * Produces entries like: { path: "data[].role.id", type: "string", sample: "abc-123" }
 */
function flattenFields(value, prefix = '', result = []) {
  if (value === null || value === undefined || typeof value !== 'object')
    return result;

  if (Array.isArray(value)) {
    if (value.length > 0 && typeof value[0] === 'object') {
      flattenFields(value[0], `${prefix}[]`, result);
    } else if (value.length > 0) {
      result.push({
        path: `${prefix}[]`,
        type: typeof value[0],
        sample: String(value[0]).slice(0, 100),
      });
    }
    return result;
  }

  for (const [k, v] of Object.entries(value)) {
    const path = prefix ? `${prefix}.${k}` : k;
    const type =
      v === null ? 'null' : Array.isArray(v) ? 'array' : typeof v;
    result.push({
      path,
      type,
      sample:
        type === 'object' || type === 'array'
          ? undefined
          : String(v).slice(0, 100),
    });
    if (typeof v === 'object' && v !== null) {
      flattenFields(v, path, result);
    }
  }
  return result;
}

/**
 * Truncate large response bodies for --brief mode.
 * Arrays are limited to maxItems; strings to maxChars.
 */
function truncateBody(value, maxItems = 2, maxChars = 200) {
  if (value === null || value === undefined) return value;
  if (Array.isArray(value)) {
    const truncated = value
      .slice(0, maxItems)
      .map((v) => truncateBody(v, maxItems, maxChars));
    if (value.length > maxItems) {
      truncated.push(
        `... (${value.length - maxItems} more items, ${value.length} total)`,
      );
    }
    return truncated;
  }
  if (typeof value === 'object') {
    const result = {};
    for (const [k, v] of Object.entries(value)) {
      result[k] = truncateBody(v, maxItems, maxChars);
    }
    return result;
  }
  if (typeof value === 'string' && value.length > maxChars) {
    return value.slice(0, maxChars) + `... (${value.length} chars total)`;
  }
  return value;
}

// Auth Token Extraction
const TOKEN_PATTERNS = /token|jwt|access[_-]?token|auth|bearer|id[_-]?token/i;

/**
 * Extract auth token from a saved storageState file.
 * Checks localStorage first (common for SPAs), then cookies.
 */
function extractTokenFromStorageState(storageStatePath) {
  if (!existsSync(storageStatePath)) {
    return { token: null, error: `storageState not found at ${storageStatePath}` };
  }

  const state = JSON.parse(readFileSync(storageStatePath, 'utf-8'));

  // Check localStorage across all origins
  for (const origin of state.origins || []) {
    for (const item of origin.localStorage || []) {
      if (
        TOKEN_PATTERNS.test(item.name) ||
        (typeof item.value === 'string' && item.value.startsWith('eyJ'))
      ) {
        return {
          token: item.value,
          source: 'localStorage',
          key: item.name,
          origin: origin.origin,
        };
      }
    }
  }

  for (const cookie of state.cookies || []) {
    if (TOKEN_PATTERNS.test(cookie.name)) {
      return {
        token: cookie.value,
        source: 'cookies',
        key: cookie.name,
        domain: cookie.domain,
      };
    }
  }

  return { token: null, error: 'No auth token found in storageState' };
}

/**
 * Build HTTP headers with proper auth based on token source.
 */
function buildAuthHeaders(authResult) {
  const headers = { 'Content-Type': 'application/json' };
  if (!authResult.token) return headers;

  if (
    authResult.source === 'localStorage' ||
    authResult.source === 'sessionStorage'
  ) {
    headers['Authorization'] = `Bearer ${authResult.token}`;
  } else if (authResult.source === 'cookies') {
    headers['Cookie'] = `${authResult.key}=${authResult.token}`;
  }
  return headers;
}

// Browser Auth Discovery
/**
 * After login, inspect the page to discover WHERE the app stores auth tokens.
 * Returns a structured report of localStorage, sessionStorage, and cookies.
 */
async function discoverAuth(page) {
  const localStorage = await page.evaluate(() => {
    const items = {};
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      items[key] = window.localStorage.getItem(key);
    }
    return items;
  });

  const sessionStorage = await page.evaluate(() => {
    const items = {};
    for (let i = 0; i < window.sessionStorage.length; i++) {
      const key = window.sessionStorage.key(i);
      items[key] = window.sessionStorage.getItem(key);
    }
    return items;
  });

  const cookies = await page.context().cookies();

  let authMechanism = {
    type: 'unknown',
    source: 'unknown',
    key: null,
    tokenPreview: null,
    headerFormat: null,
  };

  for (const [key, value] of Object.entries(localStorage)) {
    if (
      TOKEN_PATTERNS.test(key) ||
      (typeof value === 'string' && value.startsWith('eyJ'))
    ) {
      authMechanism = {
        type: 'bearer',
        source: 'localStorage',
        key,
        tokenPreview: value.slice(0, 30) + '...',
        headerFormat: `Authorization: Bearer <localStorage["${key}"]>`,
      };
      break;
    }
  }

  if (authMechanism.type === 'unknown') {
    for (const [key, value] of Object.entries(sessionStorage)) {
      if (
        TOKEN_PATTERNS.test(key) ||
        (typeof value === 'string' && value.startsWith('eyJ'))
      ) {
        authMechanism = {
          type: 'bearer',
          source: 'sessionStorage',
          key,
          tokenPreview: value.slice(0, 30) + '...',
          headerFormat: `Authorization: Bearer <sessionStorage["${key}"]>`,
        };
        break;
      }
    }
  }

  if (authMechanism.type === 'unknown') {
    const authCookie = cookies.find((c) => TOKEN_PATTERNS.test(c.name));
    if (authCookie) {
      authMechanism = {
        type: 'cookie',
        source: 'cookies',
        key: authCookie.name,
        tokenPreview: authCookie.value.slice(0, 30) + '...',
        headerFormat: `Cookie: ${authCookie.name}=<value>`,
      };
    }
  }

  return {
    authMechanism,
    localStorageKeys: Object.keys(localStorage),
    sessionStorageKeys: Object.keys(sessionStorage),
    cookies: cookies.map((c) => ({
      name: c.name,
      domain: c.domain,
      httpOnly: c.httpOnly,
      secure: c.secure,
    })),
  };
}

// Only load Playwright when a command actually needs a browser.
// This keeps `probe`, `extract-auth`, and `intercept-snippet` fast.
async function launchBrowser() {
  const { chromium } = await import('@playwright/test');
  return chromium.launch({ headless: true });
}

// Commands

/**
 * auth — Login via browser, discover auth mechanism, save storageState.
 *
 * This is the first command agents should run. It:
 * 1. Launches a headless browser
 * 2. Navigates to the login page and authenticates
 * 3. Inspects localStorage, sessionStorage, and cookies to find the auth token
 * 4. Saves storageState for future use
 * 5. Reports exactly HOW the app authenticates (token location, format, header)
 */
async function cmdAuth() {
  const config = loadConfig();
  if (!config) {
    output('error', 'auth', null, [
      'Config not found at .ouroboros/config.json — run /tc-init first',
    ]);
    return;
  }

  const storageStatePath = getStorageStatePath(config);
  const creds = config.auth.credentials.default;

  let browser;
  try {
    browser = await launchBrowser();
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto(config.auth.loginUrl, {
      waitUntil: 'domcontentloaded',
    });
    await page
      .locator('input[type="text"], input[type="email"]')
      .first()
      .fill(creds.username);
    await page
      .locator('input[type="password"]')
      .first()
      .fill(creds.password);
    const submitBtn = page
      .locator(
        'button[type="submit"], button:has-text("Login"), button:has-text("Sign In")',
      )
      .first();
    await submitBtn.click();
    await page.waitForURL(
      (url) => !url.toString().includes('/login'),
      { timeout: 20_000 },
    );

    // Discover auth mechanism
    const authInfo = await discoverAuth(page);

    await context.storageState({ path: storageStatePath });
    await browser.close();
    browser = null;

    output('success', 'auth', {
      storageStatePath,
      ...authInfo,
      loginUrl: config.auth.loginUrl,
      baseUrl: config.project.baseUrl,
      apiBaseUrl: config.project.apiBaseUrl,
    });
  } catch (err) {
    if (browser) await browser.close().catch(() => {});
    output('error', 'auth', null, [err.message]);
  }
}

/**
 * extract-auth — Read an existing storageState and report auth details.
 *
 * Use this when storageState already exists (e.g., after running auth setup)
 * and you need to know how to propagate auth to API helpers.
 */
async function cmdExtractAuth() {
  const config = loadConfig();
  if (!config) {
    output('error', 'extract-auth', null, [
      'Config not found at .ouroboros/config.json — run /tc-init first',
    ]);
    return;
  }

  const storageStatePath = getStorageStatePath(config);
  const result = extractTokenFromStorageState(storageStatePath);

  if (!result.token) {
    output('error', 'extract-auth', null, [
      result.error,
      'Run `node scripts/api-probe.mjs auth` first',
    ]);
    return;
  }

  const isBearer =
    result.source === 'localStorage' ||
    result.source === 'sessionStorage';

  output('success', 'extract-auth', {
    source: result.source,
    key: result.key,
    origin: result.origin || result.domain,
    tokenPreview: result.token.slice(0, 30) + '...',
    headerFormat: isBearer
      ? `Authorization: Bearer <${result.source}["${result.key}"]>`
      : `Cookie: ${result.key}=<value>`,
    playwrightNote: isBearer
      ? [
          'Playwright `page.request` does NOT send localStorage tokens automatically.',
          'You must extract the token from storageState and pass it in headers:',
          '',
          '  const state = JSON.parse(readFileSync(storageStatePath, "utf-8"));',
          `  const token = state.origins`,
          `    .flatMap(o => o.localStorage)`,
          `    .find(i => i.name === "${result.key}")?.value;`,
          '  request.get(url, { headers: { Authorization: `Bearer ${token}` } });',
        ].join('\n')
      : 'Cookies are sent automatically with page.request when using storageState.',
  });
}

/**
 * probe — Make an authenticated HTTP request and return the full contract.
 *
 * Usage:
 *   node scripts/api-probe.mjs probe GET /api/v1/users
 *   node scripts/api-probe.mjs probe POST /api/v1/users --data '{"userId":"test","firstName":"Test"}'
 *   node scripts/api-probe.mjs probe DELETE /api/v1/users/some-uuid
 *
 * Returns: request details, response status, body shape, field inventory, auth info.
 */
async function cmdProbe() {
  const config = loadConfig();
  if (!config) {
    output('error', 'probe', null, [
      'Config not found at .ouroboros/config.json — run /tc-init first',
    ]);
    return;
  }

  // Parse probe args: probe <METHOD> <path>
  const method = (positionalArgs[0] || 'GET').toUpperCase();
  const path = positionalArgs[1] || '/';
  const payloadStr = dataFlag || positionalArgs[2];

  const fullUrl = path.startsWith('http')
    ? path
    : `${config.project.apiBaseUrl}${path.startsWith('/') ? '' : '/'}${path}`;

  const storageStatePath = getStorageStatePath(config);
  const authResult = extractTokenFromStorageState(storageStatePath);

  if (!authResult.token) {
    output('error', 'probe', null, [
      authResult.error || 'No auth token found',
      'Run `node scripts/api-probe.mjs auth` first to authenticate',
    ]);
    return;
  }

  const headers = buildAuthHeaders(authResult);
  const fetchOptions = { method, headers };

  if (payloadStr && method !== 'GET' && method !== 'HEAD') {
    try {
      JSON.parse(payloadStr);
      fetchOptions.body = payloadStr;
    } catch {
      output('error', 'probe', null, [
        `Invalid JSON payload: ${payloadStr}`,
      ]);
      return;
    }
  }

  try {
    const startTime = Date.now();
    const response = await fetch(fullUrl, fetchOptions);
    const elapsed = Date.now() - startTime;

    const contentType = response.headers.get('content-type') || '';
    let body;
    let bodyShape;
    let fieldInventory;

    if (contentType.includes('application/json')) {
      body = await response.json();
      bodyShape = inferShape(body);
      fieldInventory = flattenFields(body);
    } else {
      body = await response.text();
      bodyShape = 'string';
      fieldInventory = [];
    }

    let parsedPayload;
    try {
      parsedPayload = payloadStr ? JSON.parse(payloadStr) : undefined;
    } catch {
      parsedPayload = payloadStr;
    }

    output('success', 'probe', {
      request: {
        method,
        url: fullUrl,
        headers: {
          ...headers,
          Authorization: headers.Authorization
            ? 'Bearer <token>'
            : undefined,
        },
        payload: parsedPayload,
        payloadShape: parsedPayload
          ? inferShape(parsedPayload)
          : undefined,
      },
      response: {
        status: response.status,
        statusText: response.statusText,
        contentType,
        elapsed: `${elapsed}ms`,
        body: briefMode ? truncateBody(body) : body,
        bodyShape,
        fieldInventory,
      },
      auth: {
        mechanism: authResult.source,
        key: authResult.key,
        headerUsed: headers.Authorization
          ? 'Authorization: Bearer <token>'
          : `Cookie: ${authResult.key}=<token>`,
      },
    });
  } catch (err) {
    output('error', 'probe', null, [
      `Request to ${fullUrl} failed: ${err.message}`,
    ]);
  }
}

/**
 * smoke — All-in-one verification: auth + API probe + browser navigation.
 *
 * Use this as a quick sanity check that the entire auth + API pipeline works.
 * Runs three checks:
 *   1. Auth: storageState exists or can be created
 *   2. API: an authenticated GET request returns non-4xx
 *   3. Navigation: browser with storageState can reach the app (not redirected to login)
 *
 * Usage:
 *   node scripts/api-probe.mjs smoke                    # Uses apiBaseUrl from config
 *   node scripts/api-probe.mjs smoke /api/v1/users      # Probes specific endpoint
 */
async function cmdSmoke() {
  const config = loadConfig();
  if (!config) {
    output('error', 'smoke', null, [
      'Config not found at .ouroboros/config.json — run /tc-init first',
    ]);
    return;
  }

  const storageStatePath = getStorageStatePath(config);
  const results = { auth: null, apiProbe: null, navigation: null };
  const errors = [];

  if (!existsSync(storageStatePath)) {
    let browser;
    try {
      browser = await launchBrowser();
      const context = await browser.newContext();
      const page = await context.newPage();
      const creds = config.auth.credentials.default;

      await page.goto(config.auth.loginUrl, {
        waitUntil: 'domcontentloaded',
      });
      await page
        .locator('input[type="text"], input[type="email"]')
        .first()
        .fill(creds.username);
      await page
        .locator('input[type="password"]')
        .first()
        .fill(creds.password);
      await page
        .locator(
          'button[type="submit"], button:has-text("Login"), button:has-text("Sign In")',
        )
        .first()
        .click();
      await page.waitForURL(
        (url) => !url.toString().includes('/login'),
        { timeout: 20_000 },
      );

      const authInfo = await discoverAuth(page);
      await context.storageState({ path: storageStatePath });
      await browser.close();
      browser = null;

      results.auth = {
        status: 'pass',
        mechanism: authInfo.authMechanism,
      };
    } catch (err) {
      if (browser) await browser.close().catch(() => {});
      results.auth = { status: 'fail', error: err.message };
      errors.push(`Auth failed: ${err.message}`);
    }
  } else {
    results.auth = {
      status: 'pass',
      note: 'storageState already exists',
    };
  }

  const authResult = extractTokenFromStorageState(storageStatePath);
  if (authResult.token) {
    const smokePath = positionalArgs[0] || '';
    const probeUrl = smokePath
      ? smokePath.startsWith('http')
        ? smokePath
        : `${config.project.apiBaseUrl}${smokePath.startsWith('/') ? '' : '/'}${smokePath}`
      : config.project.apiBaseUrl;

    const headers = buildAuthHeaders(authResult);

    try {
      const resp = await fetch(probeUrl, { method: 'GET', headers });
      results.apiProbe = {
        status: resp.status < 400 ? 'pass' : 'fail',
        httpStatus: resp.status,
        url: probeUrl,
        authHeader: headers.Authorization
          ? 'Bearer <token>'
          : 'none',
      };
      if (resp.status >= 400) {
        errors.push(
          `API probe returned HTTP ${resp.status} at ${probeUrl}`,
        );
      }
    } catch (err) {
      results.apiProbe = { status: 'fail', error: err.message };
      errors.push(`API probe failed: ${err.message}`);
    }
  } else {
    results.apiProbe = {
      status: 'skip',
      reason: 'No auth token available',
    };
  }

  let browser;
  try {
    browser = await launchBrowser();
    const context = await browser.newContext({
      storageState: storageStatePath,
    });
    const page = await context.newPage();
    await page.goto(config.project.baseUrl, {
      waitUntil: 'domcontentloaded',
      timeout: 15_000,
    });
    const title = await page.title();
    const url = page.url();
    await browser.close();
    browser = null;

    const redirectedToLogin = url.includes('/login');
    results.navigation = {
      status: !redirectedToLogin ? 'pass' : 'fail',
      finalUrl: url,
      title,
      redirectedToLogin,
    };
    if (redirectedToLogin) {
      errors.push(
        'Navigation landed on login page — storageState may be expired or auth mechanism is wrong',
      );
    }
  } catch (err) {
    if (browser) await browser.close().catch(() => {});
    results.navigation = { status: 'fail', error: err.message };
    errors.push(`Navigation check failed: ${err.message}`);
  }

  output(errors.length === 0 ? 'success' : 'error', 'smoke', results, errors);
}

/**
 * intercept-snippet — Output a JavaScript snippet that patches both window.fetch
 * AND XMLHttpRequest to capture all API requests made during browser interactions.
 *
 * The agent injects this into the page BEFORE performing CRUD operations,
 * then reads window.__apiCaptures afterwards to get full request/response details.
 *
 * This replaces the need for agents to manually write network interceptors.
 * Both transport mechanisms are patched because SPAs vary — some use fetch,
 * some use XMLHttpRequest, and some use both.
 */
function cmdInterceptSnippet() {
  // The snippet is self-contained — no dependencies on the outer script.
  // It patches both window.fetch and XMLHttpRequest.prototype,
  // captures request+response details, and stores them in
  // window.__apiCaptures for later retrieval.
  const snippet = `(function() {
  if (window.__apiCaptures) return; // Already injected
  window.__apiCaptures = [];

  // Fetch interception
  const origFetch = window.fetch;
  window.fetch = async function(...fetchArgs) {
    const [input, init] = fetchArgs;
    const url = typeof input === 'string' ? input : input?.url || String(input);
    const method = (init?.method || 'GET').toUpperCase();

    let requestBody = null;
    if (init?.body) {
      try { requestBody = JSON.parse(init.body); }
      catch { requestBody = String(init.body).slice(0, 1000); }
    }

    const rawHeaders = init?.headers || {};
    const getHeader = (name) => {
      if (rawHeaders instanceof Headers) return rawHeaders.get(name);
      if (typeof rawHeaders.get === 'function') return rawHeaders.get(name);
      return rawHeaders[name] || rawHeaders[name.toLowerCase()] || null;
    };
    const authRaw = getHeader('Authorization') || getHeader('authorization');
    const authRedacted = authRaw
      ? authRaw.replace(/(Bearer\\s+).{20}.*/, '$1<token>')
      : null;

    const startTime = Date.now();
    const response = await origFetch.apply(this, fetchArgs);
    const elapsed = Date.now() - startTime;

    const clone = response.clone();
    let responseBody = null;
    try { responseBody = await clone.json(); }
    catch { try { responseBody = await clone.text(); } catch(e) { /* ignore */ } }

    window.__apiCaptures.push({
      timestamp: new Date().toISOString(),
      transport: 'fetch',
      method,
      url,
      requestHeaders: {
        authorization: authRedacted,
        contentType: getHeader('Content-Type') || getHeader('content-type'),
      },
      requestBody,
      responseStatus: response.status,
      responseBody,
      elapsed: elapsed + 'ms',
    });

    return response;
  };

  // XMLHttpRequest interception
  const origOpen = XMLHttpRequest.prototype.open;
  const origSend = XMLHttpRequest.prototype.send;
  const origSetHeader = XMLHttpRequest.prototype.setRequestHeader;

  XMLHttpRequest.prototype.open = function(method, url) {
    this.__capture = { method: (method || 'GET').toUpperCase(), url: String(url), headers: {} };
    return origOpen.apply(this, arguments);
  };

  XMLHttpRequest.prototype.setRequestHeader = function(name, value) {
    if (this.__capture) {
      this.__capture.headers[name] = value;
    }
    return origSetHeader.apply(this, arguments);
  };

  XMLHttpRequest.prototype.send = function(body) {
    if (this.__capture) {
      const cap = this.__capture;
      const startTime = Date.now();

      let requestBody = null;
      if (body) {
        try { requestBody = JSON.parse(body); }
        catch { requestBody = typeof body === 'string' ? body.slice(0, 1000) : String(body).slice(0, 1000); }
      }

      const authRaw = cap.headers['Authorization'] || cap.headers['authorization'] || null;
      const authRedacted = authRaw
        ? authRaw.replace(/(Bearer\\s+).{20}.*/, '$1<token>')
        : null;

      this.addEventListener('load', function() {
        const elapsed = Date.now() - startTime;
        let responseBody = null;
        try { responseBody = JSON.parse(this.responseText); }
        catch { responseBody = this.responseText ? this.responseText.slice(0, 2000) : null; }

        window.__apiCaptures.push({
          timestamp: new Date().toISOString(),
          transport: 'xhr',
          method: cap.method,
          url: cap.url,
          requestHeaders: {
            authorization: authRedacted,
            contentType: cap.headers['Content-Type'] || cap.headers['content-type'] || null,
          },
          requestBody,
          responseStatus: this.status,
          responseBody,
          elapsed: elapsed + 'ms',
        });
      });
    }
    return origSend.apply(this, arguments);
  };

  console.log('[api-probe] Network capture active (fetch + XHR). Read window.__apiCaptures after operations.');
})();`;

  if (jsonMode) {
    output('success', 'intercept-snippet', {
      snippet,
      usage: {
        step1_inject:
          'Run via browser_evaluate BEFORE performing CRUD operations',
        step2_operate:
          'Perform Create/Update/Delete actions normally via the UI',
        step3_read:
          'Run via browser_evaluate: JSON.stringify(window.__apiCaptures, null, 2)',
        step4_clear:
          'Run via browser_evaluate: window.__apiCaptures = []',
      },
    });
  } else {
    console.log('// API Capture Snippet');
    console.log(
      '// Inject BEFORE CRUD operations via browser_evaluate.',
    );
    console.log(
      '// After operations, read: JSON.stringify(window.__apiCaptures, null, 2)',
    );
    console.log('');
    console.log(snippet);
  }
  process.exit(0);
}

/**
 * run — Execute an arbitrary async function in an authenticated browser context.
 *
 * Use this instead of creating temporary debugging files. The function receives
 * a Playwright Page (already authenticated via storageState) and an authenticated
 * APIRequestContext. Return any JSON-serializable value.
 *
 * Usage:
 *   node scripts/api-probe.mjs run --code 'async (page) => await page.title()'
 *   node scripts/api-probe.mjs run --code 'async (page) => { await page.goto("https://app.example.com/users"); return await page.locator("[role=grid]").count(); }'
 *   node scripts/api-probe.mjs run --code 'async (page, request) => { const r = await request.get("/api/v1/users"); return (await r.json()).data.length; }'
 *   node scripts/api-probe.mjs run --url https://example.com/page --code 'async (page) => ...'
 *
 * The `page` is pre-navigated to --url if provided, otherwise starts at about:blank.
 * The `request` uses the same auth token extracted from storageState.
 *
 * Flags:
 *   --code <js>   The async function body (receives page, request)
 *   --url <url>   Optional URL to navigate to before running the code
 */
async function cmdRun() {
  const config = loadConfig();
  if (!config) {
    output('error', 'run', null, ['Config not found at .ouroboros/config.json — run /tc-init first']);
    return;
  }

  const code = getFlagValue('--code');
  if (!code) {
    output('error', 'run', null, [
      'Missing --code flag. Usage: node scripts/api-probe.mjs run --code \'async (page) => ...\'',
    ]);
    return;
  }

  const navigateUrl = getFlagValue('--url');
  const storageStatePath = getStorageStatePath(config);

  if (!existsSync(storageStatePath)) {
    output('error', 'run', null, [
      `storageState not found at ${storageStatePath}. Run 'node scripts/api-probe.mjs auth' first.`,
    ]);
    return;
  }

  // Extract auth token for the request context
  const authResult = extractTokenFromStorageState(storageStatePath);
  const headers = authResult.token ? buildAuthHeaders(authResult) : {};

  let browser;
  try {
    browser = await launchBrowser();
    const context = await browser.newContext({
      storageState: storageStatePath,
      viewport: { width: 1280, height: 948 },
    });
    const page = await context.newPage();

    // Create an authenticated request helper that resolves relative paths
    const apiBaseUrl = config.project.apiBaseUrl;
    const requestHelper = {
      _resolve(path) {
        return path.startsWith('http') ? path : `${apiBaseUrl}${path.startsWith('/') ? '' : '/'}${path}`;
      },
      async get(path, opts = {}) {
        return fetch(this._resolve(path), { method: 'GET', headers: { ...headers, ...opts.headers } });
      },
      async post(path, opts = {}) {
        return fetch(this._resolve(path), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...headers, ...opts.headers },
          body: opts.data ? JSON.stringify(opts.data) : opts.body,
        });
      },
      async put(path, opts = {}) {
        return fetch(this._resolve(path), {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', ...headers, ...opts.headers },
          body: opts.data ? JSON.stringify(opts.data) : opts.body,
        });
      },
      async delete(path, opts = {}) {
        return fetch(this._resolve(path), {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json', ...headers, ...opts.headers },
          body: opts.data ? JSON.stringify(opts.data) : opts.body,
        });
      },
    };

    if (navigateUrl) {
      const fullUrl = navigateUrl.startsWith('http')
        ? navigateUrl
        : `${config.project.baseUrl}${navigateUrl.startsWith('/') ? '' : '/'}${navigateUrl}`;
      await page.goto(fullUrl, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    }

    // Build and execute the user function
    // Security: only accept function expressions, not arbitrary statements
    const fn = new Function('page', 'request', `return (${code})(page, request);`);
    const result = await fn(page, requestHelper);

    await browser.close();
    browser = null;

    output('success', 'run', {
      result: result !== undefined ? result : null,
      navigatedTo: navigateUrl || null,
    });
  } catch (err) {
    if (browser) await browser.close().catch(() => {});
    output('error', 'run', null, [err.message]);
  }
}

/**
 * verify-contract — Read a spec file, extract the API Contracts table, and probe
 * each endpoint live to verify they match.
 *
 * Usage:
 *   node scripts/api-probe.mjs verify-contract src/docs/.../spec.md --json
 *   node scripts/api-probe.mjs verify-contract --all --json
 *
 * For each row in the spec's ## API Contracts table:
 *   1. Probes the endpoint with the documented method
 *   2. Compares response status, response wrapper path, and field names
 *   3. Reports matches and mismatches
 */
async function cmdVerifyContract() {
  const config = loadConfig();
  if (!config) {
    output('error', 'verify-contract', null, ['Config not found']);
    return;
  }

  const specPath = positionalArgs[0];
  const verifyAll = rawArgs.includes('--all');

  let specFiles = [];
  if (verifyAll) {
    const docsDir = join(ROOT, 'src', 'docs');
    specFiles = findSpecFiles(docsDir);
  } else if (specPath) {
    specFiles = [resolve(specPath)];
  } else {
    output('error', 'verify-contract', null, [
      'Usage: node scripts/api-probe.mjs verify-contract <spec-path> | --all [--json]',
    ]);
    return;
  }

  const storageStatePath = getStorageStatePath(config);
  const authResult = extractTokenFromStorageState(storageStatePath);
  if (!authResult.token) {
    output('error', 'verify-contract', null, [
      'No auth token. Run `node scripts/api-probe.mjs auth` first.',
    ]);
    return;
  }

  const headers = buildAuthHeaders(authResult);
  const results = [];

  for (const file of specFiles) {
    if (!existsSync(file)) {
      results.push({ file, status: 'error', error: 'File not found' });
      continue;
    }

    const content = readFileSync(file, 'utf-8');
    const contracts = parseApiContracts(content);

    if (contracts.length === 0) {
      results.push({
        file: file.replace(ROOT + '/', ''),
        status: 'skip',
        reason: 'No ## API Contracts table found (falling back to ## API Endpoints)',
        contracts: [],
      });
      // Try legacy ## API Endpoints table
      const legacyContracts = parseApiEndpoints(content);
      if (legacyContracts.length > 0) {
        for (const c of legacyContracts) {
          const probeResult = await probeContract(c, config, headers);
          results.push({
            file: file.replace(ROOT + '/', ''),
            ...probeResult,
          });
        }
      }
      continue;
    }

    for (const c of contracts) {
      const probeResult = await probeContract(c, config, headers);
      results.push({
        file: file.replace(ROOT + '/', ''),
        ...probeResult,
      });
    }
  }

  const failures = results.filter(r => r.status === 'mismatch' || r.status === 'error');
  output(
    failures.length === 0 ? 'success' : 'error',
    'verify-contract',
    { results, total: results.length, passed: results.filter(r => r.status === 'match').length, failed: failures.length },
    failures.map(f => `${f.operation || f.file}: ${f.error || f.mismatches?.join('; ')}`),
  );
}

/** Recursively find spec.md files */
function findSpecFiles(dir) {
  const results = [];
  let entries;
  try { entries = readdirSync(dir, { withFileTypes: true }); } catch { return results; }
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) results.push(...findSpecFiles(fullPath));
    else if (entry.name === 'spec.md') results.push(fullPath);
  }
  return results;
}

/** Parse ## API Contracts table from spec markdown */
function parseApiContracts(content) {
  return parseMarkdownTable(content, 'API Contracts');
}

/** Parse legacy ## API Endpoints table from spec markdown */
function parseApiEndpoints(content) {
  return parseMarkdownTable(content, 'API Endpoints');
}

/** Generic markdown table parser: find a heading, parse its table rows */
function parseMarkdownTable(content, heading) {
  const headingPattern = new RegExp(`^##\\s+${heading.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\$&')}\\s*$`, 'm');
  const match = content.match(headingPattern);
  if (!match) return [];

  const afterHeading = content.slice(match.index + match[0].length);
  const lines = afterHeading.split('\n');
  const rows = [];
  let headerCols = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed.startsWith('|')) {
      if (headerCols && rows.length > 0) break; // end of table
      if (trimmed.startsWith('#')) break; // next section
      if (trimmed.startsWith('<!--')) continue; // comment
      continue;
    }
    // Skip separator rows
    if (/^\|[\s-|]+\|$/.test(trimmed)) continue;

    const cells = trimmed.split('|').slice(1, -1).map(c => c.trim());
    if (!headerCols) {
      headerCols = cells.map(c => c.toLowerCase().replace(/\s+/g, '_'));
      continue;
    }
    if (cells.every(c => c === '' || c.startsWith('<!--'))) continue;

    const row = {};
    headerCols.forEach((col, i) => { row[col] = cells[i] || ''; });
    rows.push(row);
  }
  return rows;
}

/** Probe a single API contract row and compare results */
async function probeContract(contract, config, headers) {
  const method = (contract.method || 'GET').toUpperCase();
  const endpoint = contract.endpoint || contract.path || '';
  const operation = contract.operation || `${method} ${endpoint}`;

  if (!endpoint || endpoint.includes('{') || endpoint === '—' || endpoint === '-') {
    return { operation, status: 'skip', reason: 'Endpoint has placeholders or is empty' };
  }

  const fullUrl = endpoint.startsWith('http')
    ? endpoint
    : `${config.project.apiBaseUrl}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

  try {
    const response = await fetch(fullUrl, { method, headers });
    const contentType = response.headers.get('content-type') || '';
    let body = null;
    if (contentType.includes('application/json')) {
      body = await response.json();
    }

    const mismatches = [];

    // Check response status
    const expectedStatus = contract.response?.match(/^(\d{3})/)?.[1];
    if (expectedStatus && String(response.status) !== expectedStatus) {
      mismatches.push(`Expected status ${expectedStatus}, got ${response.status}`);
    }

    // Check response shape if documented
    if (contract.response_wrapper && body) {
      const wrapperPath = contract.response_wrapper.replace(/[`'"]/g, '').trim();
      const parts = wrapperPath.split('.');
      let current = body;
      for (const part of parts) {
        if (current && typeof current === 'object' && part in current) {
          current = current[part];
        } else {
          mismatches.push(`Response wrapper path '${wrapperPath}' not found in response`);
          break;
        }
      }
    }

    return {
      operation,
      status: mismatches.length > 0 ? 'mismatch' : 'match',
      httpStatus: response.status,
      responseShape: body ? inferShape(body) : 'non-json',
      fieldInventory: body ? flattenFields(body).slice(0, 20) : [],
      mismatches: mismatches.length > 0 ? mismatches : undefined,
    };
  } catch (err) {
    return { operation, status: 'error', error: err.message };
  }
}

// Router

const commands = {
  auth: cmdAuth,
  'extract-auth': cmdExtractAuth,
  probe: cmdProbe,
  smoke: cmdSmoke,
  'intercept-snippet': cmdInterceptSnippet,
  run: cmdRun,
  'verify-contract': cmdVerifyContract,
};

if (!command || !commands[command]) {
  console.error(`
API Probe — Agent Tooling Script

Usage: node scripts/api-probe.mjs <command> [args] [--json]

Commands:
  auth                                Login, discover auth mechanism, save storageState
  extract-auth                        Extract auth details from saved storageState
  probe <METHOD> <path> [--data '{}'] Make authenticated API call, return full contract
  smoke [path]                        Auth + API probe + navigation check (all-in-one)
  intercept-snippet                   JS snippet for browser-side network capture
  run --code '<fn>' [--url <url>]     Run code in authenticated browser context
  verify-contract <spec> [--all]      Verify spec API contracts against live endpoints

Flags:
  --json, --raw       Machine-readable JSON output
  --storageState <p>  Override storageState file path
  --data <json>       Request payload for probe POST/PUT/PATCH
  --brief             Truncate large response bodies
  --code <js>         Async function for 'run' command
  --url <url>         URL to navigate before running code

Examples:
  node scripts/api-probe.mjs auth
  node scripts/api-probe.mjs probe GET /api/v1/users --json
  node scripts/api-probe.mjs probe POST /api/v1/users --data '{"name":"Test"}' --json
  node scripts/api-probe.mjs smoke /api/v1/users
  node scripts/api-probe.mjs intercept-snippet --json
  node scripts/api-probe.mjs run --code 'async (page) => page.title()' --json
  node scripts/api-probe.mjs run --url /OperationsData/Users --code 'async (page) => page.locator("[role=grid]").count()' --json
  node scripts/api-probe.mjs verify-contract src/docs/module/page/sections/section/spec.md --json
  node scripts/api-probe.mjs verify-contract --all --json
`);
  process.exit(1);
}

commands[command]();
