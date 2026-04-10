# {section-name} — Implementation Details

> **Test scenarios:** [spec.md](spec.md)

## Section Reference
- **Page:** {page-name} ({page-slug})
- **Section Slug:** {section-slug}

---

## UI Elements
<!-- All interactive and display elements in this section -->

### Display Elements
<!-- Tables, lists, cards, text blocks, charts, etc. -->

### Interactive Elements
<!-- Buttons, links, inputs, dropdowns, toggles, etc. -->

---

## UI Framework & Component Details
<!-- CRITICAL: The test-writer agent depends entirely on this section to choose correct locator strategies.
     Identify every UI library/framework used in this section by inspecting CSS classes and DOM structure.
     For EACH component, document its type, framework, and any accessibility gaps. -->

### Frameworks Detected
<!-- List every UI framework/library identified in this section's DOM -->
<!-- Examples: Framework A, Framework B, custom components -->
| Component | Framework | Version Hint | CSS Class Pattern |
|-----------|-----------|-------------|-------------------|
<!-- | Data grid | Grid Framework | grid-lib | `.grid-class`, `.cell-class`, `.filter-class` | -->
<!-- | Dropdown select | UI Framework Select | v4.x | `.select-class`, `.select-dropdown` | -->
<!-- | Modal/drawer | Custom modal | n/a | `.modal-class`, `.modal-mask` | -->
<!-- | Toast/notification | UI Framework message | v4.x | `.message-notice-class` | -->

### Accessibility & Locator Notes
<!-- Document ARIA role availability for each interactive component. This prevents the test-writer
     from using getByRole() on elements that lack proper ARIA roles. -->
| Component | Has Standard ARIA Roles? | Recommended Locator Strategy |
|-----------|-------------------------|------------------------------|
<!-- | Custom Select options | NO — uses custom divs, NOT `role="option"` | `page.locator('.select-item-class').filter({ hasText: 'value' })` | -->
<!-- | Grid filter button | NO — uses custom class with no `role="button"` | `page.locator('.filter-icon-class')` with `evaluate(el => el.click())` (standard click may fail if element is outside viewport) | -->
<!-- | Custom modal | NO — uses custom class, NOT `role="dialog"` | `page.locator('.modal-class')` or by heading text inside | -->
<!-- | Table rows | YES — `role="row"` available | `page.getByRole('row')` | -->

### Layout Constraints
<!-- Document viewport/scroll requirements that affect test automation -->
- **Minimum viewport for full interaction:** {width}x{height} (e.g., 1280x1080)
- **Modals/drawers exceeding default viewport:** {yes/no — if yes, list which ones and approximate height}
- **Sections requiring scroll-to-view:** {list sections that are below the fold}
- **Buttons hidden below fold in modals:** {list any Save/Cancel/Submit buttons that require scrollIntoView}

---

## Interaction Recipes
<!-- CRITICAL CONTRACT: This section is the behavioral proof between explorer and test-writer.
     For EVERY interactive component discovered, the explorer MUST:
     1. PROVE the interaction works by executing it during exploration
     2. Document the EXACT locator, method, and assertion that succeeded
     3. Document any failed approaches (to prevent the test-writer from repeating mistakes)

     The test-writer will implement these recipes EXACTLY as documented.
     If an interaction is not documented here, the test-writer MUST report it as a gap.

     COMPACT FORMAT: Each recipe keeps ALL actionable information in fewer lines.
     - "Signal" = what DOM change proves success (prose). "Assert" = the Playwright code that verifies it.
     - "Render" line is ONLY needed for conditionally rendered elements (omit for always-present elements).
     - "Failed" line is ONLY needed when non-standard methods were required (omit when standard click/fill works).
     - "Why This Method" explanation after Method is ONLY needed for non-standard methods.

     One recipe per distinct interaction type found on the page.
     Name each recipe after the user action: "Open Create Form", "Select Dropdown Value",
     "Apply Column Filter", "Confirm Delete", "Navigate Pagination", "Close Modal", etc. -->

### Recipe: {interaction-name}
- **Locator:** `{exact locator expression that was tested and works}`
- **Method:** `{click() | evaluate(el => el.click()) | fill('text') | nativeSetter('text') | selectOption('value') | etc.}`
  {ONLY if non-standard: — "element outside viewport (y=-32005)" | "framework ignores fill events" | "no ARIA role on options" | etc.}
- **Assert:** `{exact Playwright assertion command — e.g., await expect(page.locator('.{modal-class}')).toBeVisible()}`
  <!-- If the obvious assertion fails, document: DON'T: {failing assertion} — DO: {working assertion} -->
- **Signal:** {what observable DOM change confirms success — e.g., "modal with class '.{modal-class}' appears"} | **Timing:** {immediate | async ~Xms}
- **Preconditions:** {what must be true — e.g., "grid loaded", "modal is open" | NONE}
- **Render:** {state-bound | once-triggered} · Trigger: {action that causes element to appear} · Disappears: {condition}
  <!-- OMIT this entire line for always-present elements. Include ONLY for conditionally rendered elements. -->
- **Failed:** {1. click() → 'element outside viewport' (y=-32005). 2. fill('text') → value empty after fill.}
  <!-- OMIT this line if standard approach worked on first try. -->

<!-- Repeat ### Recipe: ... for each distinct interaction type.
     Typical set for a CRUD section: Open Form, Fill Text Field, Fill Input (native setter),
     Select Dropdown Value, Submit Form, Close Form (all close mechanisms),
     Open Filter Dialog, Apply Filter, Clear Filter,
     Click Row Action, Confirm Delete, Cancel Delete, Navigate Page, Find Row Across Pages -->

---

## Form Fields
<!-- Detailed field documentation for CREATE/UPDATE forms.
     CRITICAL: The Validation column must include ALL rules — not just "required".
     Document format rules, min/max length, regex patterns, accepted domains, etc.
     The test-writer will use this to generate valid test data. -->

| Field | Type | Required | Validation | Default | Locator Strategy | Notes |
|-------|------|----------|------------|---------|-----------------|-------|
<!-- | {field-name} | textbox | yes | required, must be valid email format | "" | `getByLabel('{Field Name}')` or `page.locator('input[placeholder="{Field Name}"]')` | -->
<!-- | {field-name} | combobox | yes | required, must match a value from API | "" | `page.locator('.{select-class}').nth(0)` — see Interaction Recipe for this dropdown | Has nested selector container | -->
<!-- | {field-name} | textbox | yes | required, numeric, max 15 chars | "" | `getByLabel('{Field Name}')` | -->

## API Contracts
<!-- Network requests captured during CRUD operations.
     CRITICAL: The test-architect uses this table to build API helpers and data factories.
     Capture ACTUAL response shapes — do not guess from form labels.
     Field names must match the API exactly (camelCase, PascalCase, UUIDs vs display names).
     Use `node scripts/api-probe.mjs probe GET /api/v1/{resource} --json` to verify shapes. -->

| Operation | Method | Endpoint | Request Payload (key fields) | Response Shape | Status | Auth |
|-----------|--------|----------|------------------------------|---------------|--------|------|
<!-- | List | GET | /api/v1/entities | — | `{ data: [{ id, name, email, roleId, ... }], total }` | 200 | Bearer | -->
<!-- | Create | POST | /api/v1/entities | `{ name, email, roleId, password }` | `{ id, name, ... }` | 201 | Bearer | -->
<!-- | Update | PUT | /api/v1/entities/{id} | `{ name, email, roleId }` | `{ id, name, ... }` | 200 | Bearer | -->
<!-- | Delete | DELETE | /api/v1/entities/{id} | — | `{}` | 200 | Bearer | -->

### Field Name Mappings
<!-- CRITICAL: Document where API field names differ from UI form labels.
     The architect MUST use API field names (not UI labels) in helpers and data factories. -->
| UI Label | API Field Name | Type | Notes |
|----------|---------------|------|-------|
<!-- | {UI Dropdown Label} (shows display text) | {apiFieldId} | UUID string | Dropdown shows "{Display Text}" but API expects "{uuid-...}" | -->
<!-- | {UI Field Label} | {apiFieldName} | string | Actual API field name differs from UI label | -->

---

## Mutation Side Effects
<!-- CRITICAL: Document what happens to the UI AFTER a successful create/update/delete.
     The test-writer needs this to write correct post-mutation assertions.
     These observations come from DOM Diff snapshots taken before and after each mutation. -->
| Operation | Filters Preserved? | Pagination State | Alert Text | Alert Persists? | Other Side Effects |
|-----------|-------------------|-----------------|------------|----------------|-------------------|
<!-- | Create | ✓ Yes | Stays on current page; new record on page N (alphabetical by Name) | "Entity created successfully" | ✅ Yes — does not auto-dismiss | Modal closes automatically | -->
<!-- | Update | ❌ No — all column filters cleared | Stays on current page | "Entity updated successfully" | ✅ Yes — replaces previous alert | Modal closes automatically | -->
<!-- | Delete | ❌ No — all column filters cleared | Stays on current page; total count decreases by 1 | "Entity removed successfully" | ✅ Yes | Popconfirm disappears | -->

## Feedback Mechanisms
<!-- CRITICAL: Document the EXACT type and locator for every success/error feedback element.
     Do NOT use generic terms like "toast" — specify the exact implementation. -->
| Trigger | Feedback Type | Locator | Exact Message Text | Auto-Dismisses? | Assertion Command |
|---------|--------------|---------|-------------------|-----------------|-------------------|
<!-- | Create success | role="alert" banner (.{framework-alert-class}) | `page.getByRole('alert')` | "Entity created successfully" | No — persists until next mutation | `await expect(page.getByRole('alert')).toContainText('created successfully')` | -->
<!-- | Validation error | Inline error (.{framework-error-class}) | `page.locator('.{framework-error-class}')` | Per-field — see Form Fields table | No — persists until corrected | `await expect(page.locator('.{framework-error-class}')).toHaveCount(N)` | -->

## Create vs Edit Form Differences
<!-- CRITICAL: Document which fields differ between Create and Edit mode.
     The test-writer uses this to write correct assertions for edit form state. -->
| Field | In Create Form? | In Edit Form? | Edit Behavior |
|-------|----------------|--------------|---------------|
<!-- | {field-name} | ✅ enabled | ✅ DISABLED (readonly) | Pre-filled, cannot be changed | -->
<!-- | {field-name} | ✅ enabled | ❌ HIDDEN | Not shown in edit mode | -->
<!-- | {field-name} | ❌ hidden | ✅ Conditional — shown when {other-field} = "{value}" | -->

## Concurrency & Timing Notes
<!-- Document interactions that are timing-sensitive and could cause flaky tests.
     Include recommended wait strategies. -->
<!--
- **After modal close:** Wait for the modal element to disappear from DOM before interacting with grid elements (overlay may intercept clicks)
- **Multiple confirm dialogs:** After cancel + re-click delete, multiple confirmation elements may coexist in DOM. Target the VISIBLE one using `getBoundingClientRect().height > 0`.
- **After filter apply:** Grid rows re-render asynchronously. Wait for pagination text to update before asserting on row content.
- **Sequential CRUD operations:** Previous success alert persists until next mutation. No need to dismiss it, but be aware it may affect snapshot text assertions.
-->
