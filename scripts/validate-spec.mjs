#!/usr/bin/env node

/**
 * Spec Validation Script
 *
 * Validates that spec files produced by the crawl-explorer (and patched by
 * the spec-verifier) meet all completeness requirements before downstream
 * agents (test-architect, test-writer) consume them.
 *
 * Usage:
 *   node scripts/validate-spec.mjs src/docs/.../spec.md
 *   node scripts/validate-spec.mjs --all          # validate all specs
 *   node scripts/validate-spec.mjs --json         # output JSON for programmatic use
 *
 * Exit codes:
 *   0 — all specs pass
 *   1 — one or more specs have failures
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

const ROOT = resolve(process.cwd());
const DOCS_DIR = join(ROOT, 'src', 'docs');

// Parse args
const args = process.argv.slice(2);
const jsonOutput = args.includes('--json');
const validateAll = args.includes('--all');
const specPaths = args.filter(a => !a.startsWith('--'));

/** Recursively find all spec.md files under a directory */
function findSpecs(dir) {
  const results = [];
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return results;
  }
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...findSpecs(fullPath));
    } else if (entry.name === 'spec.md') {
      results.push(fullPath);
    }
  }
  return results;
}

/** Check if a markdown section exists and has content beyond template comments */
function sectionHasContent(content, sectionHeading) {
  // Match ## or ### heading
  const pattern = new RegExp(`^#{2,3}\\s+${escapeRegex(sectionHeading)}\\s*$`, 'm');
  const match = content.match(pattern);
  if (!match) return { exists: false, hasContent: false };

  const startIdx = match.index + match[0].length;
  // Find next heading of same or higher level
  const headingLevel = match[0].match(/^(#+)/)[1].length;
  const nextHeadingPattern = new RegExp(`^#{1,${headingLevel}}\\s+`, 'm');
  const rest = content.slice(startIdx);
  const nextMatch = rest.match(nextHeadingPattern);
  const sectionContent = nextMatch ? rest.slice(0, nextMatch.index) : rest;

  // Strip HTML comments and whitespace
  const stripped = sectionContent
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\|[-\s|]+\|/g, '') // strip table separators
    .trim();

  // Check if there's actual content (not just table headers)
  const hasData = stripped.length > 0 && !stripped.match(/^\|[^|]+\|\s*$/);

  return { exists: true, hasContent: hasData };
}

/** Check if a markdown table has data rows (not just header + separator) */
function tableHasDataRows(content, sectionHeading) {
  const pattern = new RegExp(`^#{2,3}\\s+${escapeRegex(sectionHeading)}\\s*$`, 'm');
  const match = content.match(pattern);
  if (!match) return false;

  const startIdx = match.index + match[0].length;
  const rest = content.slice(startIdx, startIdx + 2000); // look at first 2000 chars

  // Find table: lines starting with |
  const tableLines = rest.split('\n').filter(l => l.trim().startsWith('|'));
  // Filter out comment lines and separator lines
  const dataLines = tableLines.filter(l =>
    !l.includes('<!--') && !l.match(/^\|[\s-|]+\|$/)
  );
  // Need at least header row + 1 data row
  return dataLines.length >= 2;
}

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Core validation logic */
function validateSpec(filePath) {
  const content = readFileSync(filePath, 'utf-8');
  const relPath = relative(ROOT, filePath);
  const failures = [];
  const warnings = [];

  // Skip page-level specs (they're just summaries)
  const isPageSpec = !relPath.includes('sections/');
  if (isPageSpec) {
    return { path: relPath, failures: [], warnings: [], isPageSpec: true };
  }

  // === RECIPE COMPLETENESS ===

  const recipes = sectionHasContent(content, 'Interaction Recipes');
  if (!recipes.exists) {
    failures.push('MISSING: ## Interaction Recipes section does not exist');
  } else if (!recipes.hasContent) {
    failures.push('EMPTY: ## Interaction Recipes has no recipes (only template comments)');
  } else {
    // Check each recipe has required fields
    const recipeBlocks = content.match(/### Recipe:.+/g) || [];
    if (recipeBlocks.length === 0) {
      failures.push('EMPTY: ## Interaction Recipes has no ### Recipe: entries');
    }

    // Check for Assertion Command in recipes
    const recipeSection = content.match(/## Interaction Recipes[\s\S]*?(?=\n## [^#]|$)/)?.[0] || '';
    if (recipeBlocks.length > 0 && !recipeSection.includes('Assertion Command')) {
      failures.push('MISSING: Interaction Recipes have no "Assertion Command" field — every recipe must specify how a test verifies the interaction');
    }

    // Check for Failed Approaches
    if (recipeBlocks.length > 0 && !recipeSection.includes('Failed')) {
      warnings.push('WARNING: No "Failed Approaches" documented in any recipe — non-standard methods should document what was tried first');
    }
  }

  // === SPEC COMPLETENESS ===

  const framework = sectionHasContent(content, 'UI Framework & Component Details');
  if (!framework.exists || !framework.hasContent) {
    failures.push('MISSING/EMPTY: ## UI Framework & Component Details');
  }

  const accessNotes = sectionHasContent(content, 'Accessibility & Locator Notes');
  if (!accessNotes.exists) {
    failures.push('MISSING: ### Accessibility & Locator Notes');
  } else if (!tableHasDataRows(content, 'Accessibility & Locator Notes')) {
    failures.push('EMPTY: ### Accessibility & Locator Notes table has no data rows');
  }

  const layout = sectionHasContent(content, 'Layout Constraints');
  if (!layout.exists || !layout.hasContent) {
    failures.push('MISSING/EMPTY: ### Layout Constraints');
  }

  // Feedback Mechanisms
  const feedback = sectionHasContent(content, 'Feedback Mechanisms');
  if (!feedback.exists) {
    failures.push('MISSING: ## Feedback Mechanisms section');
  } else if (!tableHasDataRows(content, 'Feedback Mechanisms')) {
    failures.push('EMPTY: ## Feedback Mechanisms table has no data rows');
  } else {
    // Check for generic terms
    const fbSection = content.match(/## Feedback Mechanisms[\s\S]*?(?=\n## [^#]|$)/)?.[0] || '';
    if (/\btoast\b/i.test(fbSection) && !/toast.*class/i.test(fbSection)) {
      failures.push('GENERIC TERM: ## Feedback Mechanisms uses "toast" without specifying exact CSS class/ARIA role');
    }
  }

  // Mutation Side Effects
  const mutation = sectionHasContent(content, 'Mutation Side Effects');
  if (!mutation.exists) {
    failures.push('MISSING: ## Mutation Side Effects section');
  } else if (!tableHasDataRows(content, 'Mutation Side Effects')) {
    failures.push('EMPTY: ## Mutation Side Effects table has no data rows');
  } else {
    // Check for explicit filter/pagination columns
    const mutSection = content.match(/## Mutation Side Effects[\s\S]*?(?=\n## [^#]|$)/)?.[0] || '';
    if (!mutSection.includes('Filters Preserved') && !mutSection.includes('Filter')) {
      warnings.push('WARNING: ## Mutation Side Effects table may be missing Filters Preserved column');
    }
  }

  // Form Fields (only required if section has forms)
  const hasRequirements = content.includes('## Requirements');
  const hasCreateOrUpdate = /Creation|Update|Create|Edit/i.test(content);
  if (hasRequirements && hasCreateOrUpdate) {
    const formFields = sectionHasContent(content, 'Form Fields');
    if (!formFields.exists) {
      failures.push('MISSING: ## Form Fields section (required for sections with Create/Update operations)');
    } else if (!tableHasDataRows(content, 'Form Fields')) {
      failures.push('EMPTY: ## Form Fields table has no data rows');
    }

    // Create vs Edit Form Differences
    const hasBothForms = /Create/i.test(content) && /Edit|Update/i.test(content);
    if (hasBothForms) {
      const formDiff = sectionHasContent(content, 'Create vs Edit Form Differences');
      if (!formDiff.exists || !formDiff.hasContent) {
        warnings.push('WARNING: ## Create vs Edit Form Differences section missing or empty (recommended for sections with both Create and Edit forms)');
      }
    }
  }

  // Concurrency & Timing Notes
  if (hasCreateOrUpdate || /Delet/i.test(content)) {
    const timing = sectionHasContent(content, 'Concurrency & Timing Notes');
    if (!timing.exists || !timing.hasContent) {
      warnings.push('WARNING: ## Concurrency & Timing Notes section missing or empty (recommended for sections with mutations)');
    }
  }

  // === CONTENT QUALITY CHECKS ===

  // Check for incomplete markers
  if (/not fully explored/i.test(content)) {
    failures.push('INCOMPLETE: Spec contains "Not fully explored" — all sections must be completed');
  }
  if (/requires follow-up/i.test(content)) {
    failures.push('INCOMPLETE: Spec contains "Requires follow-up" — all sections must be completed');
  }

  // Check for generic "success message" in scenarios
  const scenarios = content.match(/#### Scenario:[\s\S]*?(?=####|## |\n---\n|$)/g) || [];
  for (const scenario of scenarios) {
    if (/THEN.*success message/i.test(scenario) && !/\.ant-|role="alert"|\.alert/i.test(scenario)) {
      warnings.push('WARNING: A scenario THEN clause uses generic "success message" without specifying exact feedback type');
    }
  }

  return { path: relPath, failures, warnings, isPageSpec: false };
}

// === MAIN ===

let specs = [];

if (validateAll) {
  specs = findSpecs(DOCS_DIR);
} else if (specPaths.length > 0) {
  specs = specPaths.map(p => resolve(p));
} else {
  console.error('Usage: node scripts/validate-spec.mjs <spec-path> | --all [--json]');
  process.exit(1);
}

if (specs.length === 0) {
  console.log('No spec files found.');
  process.exit(0);
}

const results = specs.map(validateSpec).filter(r => !r.isPageSpec);

if (jsonOutput) {
  console.log(JSON.stringify(results, null, 2));
} else {
  let totalFailures = 0;
  let totalWarnings = 0;

  for (const result of results) {
    const status = result.failures.length === 0 ? '✅' : '❌';
    console.log(`\n${status} ${result.path}`);

    for (const f of result.failures) {
      console.log(`  ❌ ${f}`);
      totalFailures++;
    }
    for (const w of result.warnings) {
      console.log(`  ⚠️  ${w}`);
      totalWarnings++;
    }
    if (result.failures.length === 0 && result.warnings.length === 0) {
      console.log('  All checks passed');
    }
  }

  console.log(`\n${'─'.repeat(60)}`);
  console.log(`Specs checked: ${results.length}`);
  console.log(`Failures: ${totalFailures}`);
  console.log(`Warnings: ${totalWarnings}`);

  if (totalFailures > 0) {
    console.log('\n❌ Spec validation failed. Fix the above issues before running downstream agents.');
  } else {
    console.log('\n✅ All specs pass validation.');
  }
}

process.exit(results.some(r => r.failures.length > 0) ? 1 : 0);
