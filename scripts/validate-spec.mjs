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
  const pattern = new RegExp(`^#{2,3}\\s+${escapeRegex(sectionHeading)}\\s*$`, 'm');
  const match = content.match(pattern);
  if (!match) return { exists: false, hasContent: false };

  const startIdx = match.index + match[0].length;
  const headingLevel = match[0].match(/^(#+)/)[1].length;
  const nextHeadingPattern = new RegExp(`^#{1,${headingLevel}}\\s+`, 'm');
  const rest = content.slice(startIdx);
  const nextMatch = rest.match(nextHeadingPattern);
  const sectionContent = nextMatch ? rest.slice(0, nextMatch.index) : rest;

  const stripped = sectionContent
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\|[-\s|]+\|/g, '')
    .trim();

  const hasData = stripped.length > 0 && !stripped.match(/^\|[^|]+\|\s*$/);

  return { exists: true, hasContent: hasData };
}

/** Check if a markdown table has data rows */
function tableHasDataRows(content, sectionHeading) {
  const pattern = new RegExp(`^#{2,3}\\s+${escapeRegex(sectionHeading)}\\s*$`, 'm');
  const match = content.match(pattern);
  if (!match) return false;

  const startIdx = match.index + match[0].length;
  const rest = content.slice(startIdx, startIdx + 2000);

  const tableLines = rest.split('\n').filter(l => l.trim().startsWith('|'));
  const dataLines = tableLines.filter(l =>
    !l.includes('<!--') && !l.match(/^\|[\s-|]+\|$/)
  );
  return dataLines.length >= 2;
}

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Validate page-level specs (non-section specs) */
function validatePageSpec(content, relPath) {
  const failures = [];
  const warnings = [];

  const hasUrlPath = /\*\*URL Path:\*\*\s*\S+/.test(content) || /\*\*App URL Path:\*\*\s*\S+/.test(content);
  if (!hasUrlPath) {
    failures.push('MISSING: Page spec has no "URL Path" defined');
  }

  const hasSlug = /\*\*Slug:\*\*\s*\S+/.test(content);
  if (!hasSlug) {
    warnings.push('WARNING: Page spec has no "Slug" defined');
  }

  const hasAuth = /\*\*Auth Required:\*\*\s*\S+/.test(content) || /\*\*Authentication:\*\*\s*\S+/.test(content);
  if (!hasAuth) {
    warnings.push('WARNING: Page spec has no "Auth Required" field');
  }

  const hasSections = /##\s+Sections/i.test(content) || /##\s+Page Sections/i.test(content);
  if (!hasSections) {
    warnings.push('WARNING: Page spec does not list its sections');
  }

  // Template placeholder detection for page specs
  const placeholders = content.match(/\{(page-name|section-name|Category|SubPage)\}/g);
  if (placeholders) {
    const unique = [...new Set(placeholders)];
    failures.push(`TEMPLATE: Unfilled template placeholders found: ${unique.join(', ')}`);
  }

  return { path: relPath, failures, warnings, isPageSpec: true };
}

/** Core validation logic */
function validateSpec(filePath) {
  const content = readFileSync(filePath, 'utf-8');
  const relPath = relative(ROOT, filePath);
  const failures = [];
  const warnings = [];

  const isPageSpec = !relPath.includes('sections/');
  if (isPageSpec) {
    return validatePageSpec(content, relPath);
  }

  const placeholders = content.match(/\{(section-name|page-name|interaction-name|modal-class|framework-alert-class|framework-error-class|field-name|apiFieldId|apiFieldName|filter-dialog-class|Category|SubPage)\}/g);
  if (placeholders) {
    const unique = [...new Set(placeholders)];
    failures.push(`TEMPLATE: Unfilled template placeholders found: ${unique.join(', ')} — these must be replaced with actual values from the live site`);
  }

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

    const recipeSection = content.match(/## Interaction Recipes[\s\S]*?(?=\n## [^#]|$)/)?.[0] || '';
    if (recipeBlocks.length > 0 && !recipeSection.includes('**Assert:**') && !recipeSection.includes('Assertion Command')) {
      failures.push('MISSING: Interaction Recipes have no "Assert" field — every recipe must specify how a test verifies the interaction');
    }

    if (recipeBlocks.length > 0 && !recipeSection.includes('**Failed:**') && !recipeSection.includes('Failed Approaches')) {
      warnings.push('WARNING: No "Failed" documentation in any recipe — non-standard methods should document what was tried first');
    }

    if (recipeBlocks.length > 0) {
      const hasLocator = recipeSection.includes('**Locator:**') || recipeSection.includes('Proven Locator');
      const hasMethod = recipeSection.includes('**Method:**') || recipeSection.includes('Interaction Method');
      if (!hasLocator) {
        failures.push('MISSING: Interaction Recipes have no "Locator" field — every recipe must document the proven locator');
      }
      if (!hasMethod) {
        failures.push('MISSING: Interaction Recipes have no "Method" field — every recipe must document the interaction method');
      }
    }

    const isCrudSection = /Creation|Update|Delete|Create|Edit|POST|PUT|DELETE/i.test(content);
    if (isCrudSection && recipeBlocks.length < 4) {
      warnings.push(`WARNING: CRUD section has only ${recipeBlocks.length} recipe(s) — typically needs at minimum: open-form, fill-field, save, close/cancel`);
    }

    if (recipeSection.includes('.fill(') && !recipeSection.includes('Assert') && !recipeSection.includes('assert')) {
      warnings.push('WARNING: Recipe uses .fill() but no Assert verifies the filled value persists — add value persistence assertion');
    }
  }

  const hasUrlPath = /\*\*App URL Path:\*\*\s*\S+/.test(content);
  if (!hasUrlPath) {
    failures.push('MISSING: "App URL Path" not found in ## Section Info — must be captured from actual browser URL');
  }

  const hasCrud = /Creation|Update|Delete|Create|Edit|POST|PUT|DELETE/i.test(content);
  if (hasCrud) {
    const apiContracts = sectionHasContent(content, 'API Contracts');
    const apiEndpoints = sectionHasContent(content, 'API Endpoints');
    if (!apiContracts.exists && !apiEndpoints.exists) {
      failures.push('MISSING: ## API Contracts section (required for sections with CRUD operations)');
    } else if ((apiContracts.exists && !tableHasDataRows(content, 'API Contracts')) &&
               (apiEndpoints.exists && !tableHasDataRows(content, 'API Endpoints'))) {
      failures.push('EMPTY: ## API Contracts table has no data rows');
    }

    const fieldMappings = sectionHasContent(content, 'Field Name Mappings');
    if (!fieldMappings.exists || !fieldMappings.hasContent) {
      warnings.push('WARNING: ### Field Name Mappings section missing or empty — document where UI labels differ from API field names');
    }
  }

  const framework = sectionHasContent(content, 'UI Framework & Component Details');
  if (!framework.exists || !framework.hasContent) {
    failures.push('MISSING/EMPTY: ## UI Framework & Component Details');
  } else {
    const fwSection = content.match(/## UI Framework & Component Details[\s\S]*?(?=\n## [^#]|$)/)?.[0] || '';
    if (fwSection.includes('Frameworks Detected') && !tableHasDataRows(content, 'Frameworks Detected')) {
      warnings.push('WARNING: Frameworks Detected sub-table has no data rows — list detected CSS/component frameworks');
    }
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

  const feedback = sectionHasContent(content, 'Feedback Mechanisms');
  if (!feedback.exists) {
    failures.push('MISSING: ## Feedback Mechanisms section');
  } else if (!tableHasDataRows(content, 'Feedback Mechanisms')) {
    failures.push('EMPTY: ## Feedback Mechanisms table has no data rows');
  } else {
    const fbSection = content.match(/## Feedback Mechanisms[\s\S]*?(?=\n## [^#]|$)/)?.[0] || '';
    if (/\btoast\b/i.test(fbSection) && !/toast.*class|toast.*role|toast.*selector|toast.*locator/i.test(fbSection)) {
      failures.push('GENERIC TERM: ## Feedback Mechanisms uses "toast" without specifying exact CSS class/ARIA role/selector');
    }
    if (/\bnotification\b/i.test(fbSection) && !/notification.*class|notification.*role|notification.*selector/i.test(fbSection)) {
      warnings.push('WARNING: ## Feedback Mechanisms uses "notification" without specifying exact selector');
    }
    if (/\bsuccess message\b/i.test(fbSection) && !/class|role=|selector|locator/i.test(fbSection)) {
      failures.push('GENERIC TERM: ## Feedback Mechanisms uses "success message" without specifying how to locate it');
    }
  }

  const mutation = sectionHasContent(content, 'Mutation Side Effects');
  if (!mutation.exists) {
    failures.push('MISSING: ## Mutation Side Effects section');
  } else if (!tableHasDataRows(content, 'Mutation Side Effects')) {
    failures.push('EMPTY: ## Mutation Side Effects table has no data rows');
  } else {
    const mutSection = content.match(/## Mutation Side Effects[\s\S]*?(?=\n## [^#]|$)/)?.[0] || '';
    if (!mutSection.includes('Filters Preserved') && !mutSection.includes('Filter')) {
      warnings.push('WARNING: ## Mutation Side Effects table may be missing Filters Preserved column');
    }
    // Validate table has at least 5 columns (Operation | Filters Preserved? | Pagination State | Alert Text | Alert Persists?)
    const mutTableHeader = mutSection.match(/^\|.+\|$/m)?.[0] || '';
    const colCount = (mutTableHeader.match(/\|/g) || []).length - 1;
    if (colCount > 0 && colCount < 5) {
      warnings.push(`WARNING: ## Mutation Side Effects table has ${colCount} column(s) — expected at least 5 (Operation, Filters Preserved?, Pagination State, Alert Text, Alert Persists?)`);
    }
  }

  const hasRequirements = content.includes('## Requirements');
  const hasCreateOrUpdate = /Creation|Update|Create|Edit/i.test(content);
  if (hasRequirements && hasCreateOrUpdate) {
    const formFields = sectionHasContent(content, 'Form Fields');
    if (!formFields.exists) {
      failures.push('MISSING: ## Form Fields section (required for sections with Create/Update operations)');
    } else if (!tableHasDataRows(content, 'Form Fields')) {
      failures.push('EMPTY: ## Form Fields table has no data rows');
    } else {
      const ffSection = content.match(/## Form Fields[\s\S]*?(?=\n## [^#]|$)/)?.[0] || '';
      const ffRows = ffSection.split('\n').filter(l => l.trim().startsWith('|') && !l.includes('---') && !l.includes('Field') && !l.includes('Validation'));
      const requiredOnlyRows = ffRows.filter(r => /\|\s*required\s*\|/i.test(r) && !/required\s*[,;]|required\s+\+|min|max|pattern|format|email|phone|length|regex/i.test(r));
      if (requiredOnlyRows.length > 3) {
        warnings.push(`WARNING: ${requiredOnlyRows.length} form field rows have "required" as the ONLY validation rule — most fields have format/length/pattern rules too`);
      }
    }

    const hasBothForms = /Create/i.test(content) && /Edit|Update/i.test(content);
    if (hasBothForms) {
      const formDiff = sectionHasContent(content, 'Create vs Edit Form Differences');
      if (!formDiff.exists || !formDiff.hasContent) {
        warnings.push('WARNING: ## Create vs Edit Form Differences section missing or empty (recommended for sections with both Create and Edit forms)');
      }
    }
  }

  if (hasCreateOrUpdate || /Delet/i.test(content)) {
    const timing = sectionHasContent(content, 'Concurrency & Timing Notes');
    if (!timing.exists || !timing.hasContent) {
      warnings.push('WARNING: ## Concurrency & Timing Notes section missing or empty (recommended for sections with mutations)');
    }
  }


  if (/not fully explored/i.test(content)) {
    failures.push('INCOMPLETE: Spec contains "Not fully explored" — all sections must be completed');
  }
  if (/requires follow-up/i.test(content)) {
    failures.push('INCOMPLETE: Spec contains "Requires follow-up" — all sections must be completed');
  }

  const scenarios = content.match(/#### Scenario:[\s\S]*?(?=####|## |\n---\n|$)/g) || [];
  for (const scenario of scenarios) {
    if (/THEN.*success message/i.test(scenario) && !/role="alert"|class.*=|locator\(|\.alert|\[data-/i.test(scenario)) {
      warnings.push('WARNING: A scenario THEN clause uses generic "success message" without specifying exact feedback selector');
    }
  }

  return { path: relPath, failures, warnings, isPageSpec: false };
}

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

const results = specs.map(validateSpec);
const sectionResults = results.filter(r => !r.isPageSpec);
const pageResults = results.filter(r => r.isPageSpec);

if (jsonOutput) {
  console.log(JSON.stringify(results, null, 2));
} else {
  let totalFailures = 0;
  let totalWarnings = 0;

  if (pageResults.length > 0 && pageResults.some(r => r.failures.length > 0 || r.warnings.length > 0)) {
    console.log('\n── Page Specs ──');
    for (const result of pageResults) {
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
  }

  if (sectionResults.length > 0) {
    console.log('\n── Section Specs ──');
  }
  for (const result of sectionResults) {
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
  console.log(`Page specs checked: ${pageResults.length}`);
  console.log(`Section specs checked: ${sectionResults.length}`);
  console.log(`Failures: ${totalFailures}`);
  console.log(`Warnings: ${totalWarnings}`);

  if (totalFailures > 0) {
    console.log('\n❌ Spec validation failed. Fix the above issues before running downstream agents.');
  } else {
    console.log('\n✅ All specs pass validation.');
  }
}

process.exit(results.some(r => r.failures.length > 0) ? 1 : 0);
