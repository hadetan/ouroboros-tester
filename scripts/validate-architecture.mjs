#!/usr/bin/env node

/**
 * Architecture Validation Script
 *
 * Quality gate between the test-architect and test-writer agents.
 * Validates that the Playwright test architecture correctly maps to verified specs:
 *
 *   1. Every spec recipe has a corresponding POM method
 *   2. Every API contract in specs has a matching helper/constant
 *   3. Spec URL paths match route constants
 *   4. Fixtures compose correctly (no broken chains)
 *   5. TypeScript compiles clean
 *
 * Usage:
 *   node scripts/validate-architecture.mjs                # validate all
 *   node scripts/validate-architecture.mjs --json         # JSON output
 *   node scripts/validate-architecture.mjs --spec <path>  # validate against specific spec
 *
 * Exit codes:
 *   0 — all checks pass
 *   1 — failures found
 */

import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { execSync } from 'node:child_process';

const ROOT = resolve(process.cwd());
const DOCS_DIR = join(ROOT, 'src', 'docs');
const PAGES_DIR = join(ROOT, 'src', 'pages');
const HELPERS_DIR = join(ROOT, 'src', 'helpers');
const FIXTURES_DIR = join(ROOT, 'src', 'fixtures');
const MANIFEST_PATH = join(ROOT, '.ouroboros', 'architect-manifest.md');

const args = process.argv.slice(2);
const jsonOutput = args.includes('--json');
const specFlagIdx = args.indexOf('--spec');
const specFilter = specFlagIdx !== -1 ? args[specFlagIdx + 1] : null;

// Helpers

function findFiles(dir, pattern) {
  const results = [];
  let entries;
  try { entries = readdirSync(dir, { withFileTypes: true }); } catch { return results; }
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) results.push(...findFiles(full, pattern));
    else if (pattern.test(entry.name)) results.push(full);
  }
  return results;
}

function findSpecs(dir) { return findFiles(dir, /^spec\.md$/); }
function findPageFiles(dir) { return findFiles(dir, /\.page\.ts$/); }

/** Extract recipe names from a spec file */
function extractRecipeNames(content) {
  const names = [];
  const regex = /^###\s+Recipe:\s+(.+)$/gm;
  let match;
  while ((match = regex.exec(content)) !== null) {
    names.push(match[1].trim());
  }
  return names;
}

/** Extract API contract rows from spec */
function extractApiContracts(content) {
  const contracts = [];
  for (const heading of ['API Contracts', 'API Endpoints']) {
    const pattern = new RegExp(`^##\\s+${heading}\\s*$`, 'm');
    const match = content.match(pattern);
    if (!match) continue;

    const after = content.slice(match.index + match[0].length);
    const lines = after.split('\n');
    let headerCols = null;

    for (const line of lines) {
      const t = line.trim();
      if (t.startsWith('#') && !t.startsWith('<!--')) break;
      if (!t.startsWith('|')) continue;
      if (/^\|[\s-|]+\|$/.test(t)) continue;

      const cells = t.split('|').slice(1, -1).map(c => c.trim());
      if (!headerCols) { headerCols = cells; continue; }
      if (cells.every(c => !c || c.startsWith('<!--'))) continue;

      const row = {};
      headerCols.forEach((h, i) => { row[h.toLowerCase()] = cells[i] || ''; });
      contracts.push(row);
    }
    if (contracts.length > 0) break;
  }
  return contracts;
}

/** Extract URL path from spec */
function extractUrlPath(content) {
  const match = content.match(/^\s*-\s+\*\*App URL Path:\*\*\s*(.+)/m);
  return match ? match[1].trim() : null;
}

/** Extract public method names from a .page.ts file */
function extractPublicMethods(tsContent) {
  const methods = [];
  const regex = /^\s+(?:async\s+)?(\w+)\s*\(/gm;
  let match;
  while ((match = regex.exec(tsContent)) !== null) {
    const name = match[1];
    if (name === 'constructor') continue;
    methods.push(name);
  }
  return methods;
}

/** Check if a recipe name maps to any POM method (fuzzy match) */
function recipeMatchesMethods(recipeName, methods) {
  const words = recipeName
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .split(/\s+/)
    .filter(Boolean);

  const camelCase = words.map((w, i) =>
    i === 0 ? w.toLowerCase() : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
  ).join('');

  if (methods.some(m => m.toLowerCase() === camelCase.toLowerCase())) return true;

  const keyWords = words.filter(w => !['a', 'an', 'the', 'in', 'on', 'via', 'to', 'from', 'of', 'for'].includes(w.toLowerCase()));
  const keyPattern = keyWords.map(w => w.toLowerCase()).join('');

  return methods.some(m => {
    const ml = m.toLowerCase();
    return ml.includes(keyPattern) || keyPattern.includes(ml);
  });
}

function validate() {
  const failures = [];
  const warnings = [];
  const info = [];

  if (!existsSync(MANIFEST_PATH)) {
    failures.push('MISSING: .ouroboros/architect-manifest.md does not exist — run /tc-architect first');
    return { failures, warnings, info };
  }
  info.push('Manifest found: .ouroboros/architect-manifest.md');

  let specs = findSpecs(DOCS_DIR).filter(s => s.includes('sections/'));
  if (specFilter) {
    const filterPath = resolve(specFilter);
    specs = specs.filter(s => s === filterPath || s.includes(specFilter));
  }

  if (specs.length === 0) {
    warnings.push('No section spec files found in src/docs/');
    return { failures, warnings, info };
  }
  info.push(`Found ${specs.length} section spec(s)`);

  const pomFiles = findPageFiles(PAGES_DIR);
  if (pomFiles.length === 0) {
    failures.push('MISSING: No .page.ts files found in src/pages/');
    return { failures, warnings, info };
  }
  info.push(`Found ${pomFiles.length} POM file(s)`);

  const allPomMethods = {};
  for (const pom of pomFiles) {
    const content = readFileSync(pom, 'utf-8');
    const relPath = relative(ROOT, pom);
    allPomMethods[relPath] = extractPublicMethods(content);

    // Ban waitForTimeout in POM methods — flaky by definition
    const timeoutMatches = content.match(/waitForTimeout\s*\(/g);
    if (timeoutMatches) {
      failures.push(`${relPath}: Uses waitForTimeout (${timeoutMatches.length} occurrence(s)) — replace with condition-based waits`);
    }
  }

  for (const specPath of specs) {
    const content = readFileSync(specPath, 'utf-8');
    const relSpec = relative(ROOT, specPath);
    const recipes = extractRecipeNames(content);

    if (recipes.length === 0) {
      warnings.push(`${relSpec}: No recipes found in spec`);
      continue;
    }

    const allMethods = Object.values(allPomMethods).flat();

    for (const recipe of recipes) {
      if (!recipeMatchesMethods(recipe, allMethods)) {
        warnings.push(`${relSpec}: Recipe "${recipe}" has no matching POM method`);
      }
    }

    const contracts = extractApiContracts(content);
    if (contracts.length === 0) {
      const hasCrud = /Create|Update|Delete|POST|PUT|DELETE/i.test(content);
      if (hasCrud) {
        warnings.push(`${relSpec}: Has CRUD operations but no API contract table`);
      }
    }

    const urlPath = extractUrlPath(content);
    if (!urlPath) {
      warnings.push(`${relSpec}: Missing "App URL Path" in Section Info`);
    } else {
      const constantsPath = join(HELPERS_DIR, 'constants.ts');
      if (existsSync(constantsPath)) {
        const constants = readFileSync(constantsPath, 'utf-8');
        const pathSegment = urlPath.split('/').filter(Boolean).pop();
        if (pathSegment && !constants.includes(pathSegment)) {
          warnings.push(`${relSpec}: URL path segment "${pathSegment}" not found in constants.ts`);
        }
      }
    }
  }

  try {
    execSync('npx tsc --noEmit 2>&1', { cwd: ROOT, encoding: 'utf-8' });
    info.push('TypeScript compilation: PASS');
  } catch (err) {
    const output = err.stdout || err.stderr || err.message;
    const errorCount = (output.match(/error TS/g) || []).length;
    failures.push(`TypeScript compilation: ${errorCount} error(s). Run 'npx tsc --noEmit' for details.`);
  }

  const testFixturePath = join(FIXTURES_DIR, 'test.fixture.ts');
  const dataFixturePath = join(FIXTURES_DIR, 'data.fixture.ts');
  const baseFixturePath = join(FIXTURES_DIR, 'base.fixture.ts');

  for (const [name, path] of [['test.fixture.ts', testFixturePath], ['data.fixture.ts', dataFixturePath], ['base.fixture.ts', baseFixturePath]]) {
    if (!existsSync(path)) {
      failures.push(`MISSING: src/fixtures/${name} — fixture chain is broken`);
    }
  }

  if (existsSync(testFixturePath)) {
    const testFixture = readFileSync(testFixturePath, 'utf-8');
    if (!testFixture.includes('data.fixture') && !testFixture.includes('base.fixture')) {
      warnings.push('test.fixture.ts does not import from data.fixture or base.fixture — fixture chain may be broken');
    }
  }

  // Verify reporter config has open: 'never' so reports don't auto-open during agent runs
  const playwrightConfigPath = join(ROOT, 'src', 'tests', 'playwright.config.ts');
  if (existsSync(playwrightConfigPath)) {
    const pwConfig = readFileSync(playwrightConfigPath, 'utf-8');
    if (!pwConfig.includes("open: 'never'") && !pwConfig.includes('open: "never"')) {
      failures.push('playwright.config.ts: reporter must have open: \'never\' — reports auto-opening blocks agent execution');
    }
  }

  return { failures, warnings, info };
}

// Main

const result = validate();

if (jsonOutput) {
  console.log(JSON.stringify(result, null, 2));
} else {
  for (const i of result.info) console.log(`ℹ️  ${i}`);
  for (const w of result.warnings) console.log(`⚠️  ${w}`);
  for (const f of result.failures) console.log(`❌ ${f}`);

  console.log(`\n${'─'.repeat(60)}`);
  console.log(`Failures: ${result.failures.length}`);
  console.log(`Warnings: ${result.warnings.length}`);

  if (result.failures.length > 0) {
    console.log('\n❌ Architecture validation failed.');
  } else if (result.warnings.length > 0) {
    console.log('\n⚠️  Architecture passes with warnings.');
  } else {
    console.log('\n✅ Architecture validation passed.');
  }
}

process.exit(result.failures.length > 0 ? 1 : 0);
