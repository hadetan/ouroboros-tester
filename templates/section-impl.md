# {section-name} — Implementation Details

> **Test scenarios:** [spec.md](spec.md)

## Section Reference
- **Page:** {page-name} ({page-slug})
- **Section Slug:** {section-slug}

---

## UI Elements
<!-- Interactive and display elements in section -->

### Display Elements
<!-- Tables, lists, cards, text blocks, charts -->

### Interactive Elements
<!-- Buttons, links, inputs, dropdowns, toggles -->

---

## UI Framework & Component Details
<!-- Identify every UI library/framework by inspecting CSS classes and DOM structure.
     Document component type, framework, and accessibility gaps. -->

### Frameworks Detected
<!-- UI frameworks identified in section DOM -->
| Component | Framework | Version Hint | CSS Class Pattern |
|-----------|-----------|-------------|-------------------|
<!-- | Data grid | Grid Framework | grid-lib | `.grid-class`, `.cell-class`, `.filter-class` | -->
<!-- | Dropdown select | UI Framework Select | v4.x | `.select-class`, `.select-dropdown` | -->
<!-- | Modal/drawer | Custom modal | n/a | `.modal-class`, `.modal-mask` | -->
<!-- | Toast/notification | UI Framework message | v4.x | `.message-notice-class` | -->

### Accessibility & Locator Notes
<!-- ARIA role availability per component. Prevents test-writer from using getByRole() on elements without proper ARIA. -->
| Component | Has Standard ARIA Roles? | Recommended Locator Strategy |
|-----------|-------------------------|------------------------------|
<!-- | Custom Select options | NO — uses custom divs, NOT `role="option"` | `page.locator('.select-item-class').filter({ hasText: 'value' })` | -->
<!-- | Grid filter button | NO — uses custom class with no `role="button"` | `page.locator('.filter-icon-class')` with `evaluate(el => el.click())` (standard click may fail if element is outside viewport) | -->
<!-- | Custom modal | NO — uses custom class, NOT `role="dialog"` | `page.locator('.modal-class')` or by heading text inside | -->
<!-- | Table rows | YES — `role="row"` available | `page.getByRole('row')` | -->

### Layout Constraints
<!-- Viewport/scroll requirements affecting test automation -->
- **Minimum viewport for full interaction:** {width}x{height} (e.g., 1280x1080)
- **Modals/drawers exceeding default viewport:** {yes/no — if yes, list which ones and approximate height}
- **Sections requiring scroll-to-view:** {list sections that are below the fold}
- **Buttons hidden below fold in modals:** {list any Save/Cancel/Submit buttons that require scrollIntoView}

---

## Interaction Recipes
<!-- Behavioral proof between explorer and test-writer.
     Every interactive component: PROVE interaction works, document EXACT locator/method/assertion.
     Document failed approaches to prevent test-writer repeating mistakes.
     Target: one recipe per distinct interaction type. Name after user action. -->

### Recipe: {interaction-name}
- **Locator:** `{exact locator expression tested and working}`
- **Method:** `{click() | evaluate(el => el.click()) | fill('text') | nativeSetter('text') | selectOption('value')}`
  {ONLY if non-standard: reason}
- **Assert:** `{exact Playwright assertion command}`
  <!-- DON'T/DO notes if obvious assertion fails -->
- **Signal:** {DOM change confirming success} | **Timing:** {immediate | async ~Xms}
- **Preconditions:** {requirements | NONE}
- **Render:** {state-bound | once-triggered} · Trigger: {action} · Disappears: {condition}
  <!-- OMIT for always-present elements -->
- **Failed:** {approaches tried and why they failed}
  <!-- OMIT if standard approach worked -->

---

## Form Fields
<!-- Field documentation for CREATE/UPDATE forms.
     Validation column: ALL rules (required, format, min/max, regex, accepted domains). -->

| Field | Type | Required | Validation | Default | Locator Strategy | Notes |
|-------|------|----------|------------|---------|-----------------|-------|
<!-- | {field-name} | textbox | yes | required, must be valid email format | "" | `getByLabel('{Field Name}')` or `page.locator('input[placeholder="{Field Name}"]')` | -->
<!-- | {field-name} | combobox | yes | required, must match a value from API | "" | `page.locator('.{select-class}').nth(0)` — see Interaction Recipe for this dropdown | Has nested selector container | -->
<!-- | {field-name} | textbox | yes | required, numeric, max 15 chars | "" | `getByLabel('{Field Name}')` | -->

## API Contracts
<!-- Network requests captured during CRUD. Use actual response shapes, not guesses.
     Field names must match API exactly (camelCase, PascalCase, UUIDs vs display names). -->

| Operation | Method | Endpoint | Request Payload (key fields) | Response Shape | Status | Auth |
|-----------|--------|----------|------------------------------|---------------|--------|------|
<!-- | List | GET | /api/v1/entities | — | `{ data: [{ id, name, email, roleId, ... }], total }` | 200 | Bearer | -->
<!-- | Create | POST | /api/v1/entities | `{ name, email, roleId, password }` | `{ id, name, ... }` | 201 | Bearer | -->
<!-- | Update | PUT | /api/v1/entities/{id} | `{ name, email, roleId }` | `{ id, name, ... }` | 200 | Bearer | -->
<!-- | Delete | DELETE | /api/v1/entities/{id} | — | `{}` | 200 | Bearer | -->

### Field Name Mappings
<!-- Where API field names differ from UI labels. Architect uses API names in helpers. -->
| UI Label | API Field Name | Type | Notes |
|----------|---------------|------|-------|
<!-- | {UI Dropdown Label} (shows display text) | {apiFieldId} | UUID string | Dropdown shows "{Display Text}" but API expects "{uuid-...}" | -->
<!-- | {UI Field Label} | {apiFieldName} | string | Actual API field name differs from UI label | -->

---

## Mutation Side Effects
<!-- UI changes AFTER successful create/update/delete. Test-writer uses for post-mutation assertions.
     From DOM diff snapshots before and after each mutation. -->
| Operation | Filters Preserved? | Pagination State | Alert Text | Alert Persists? | Other Side Effects |
|-----------|-------------------|-----------------|------------|----------------|-------------------|
<!-- | Create | ✓ Yes | Stays on current page; new record on page N (alphabetical by Name) | "Entity created successfully" | ✅ Yes — does not auto-dismiss | Modal closes automatically | -->
<!-- | Update | ❌ No — all column filters cleared | Stays on current page | "Entity updated successfully" | ✅ Yes — replaces previous alert | Modal closes automatically | -->
<!-- | Delete | ❌ No — all column filters cleared | Stays on current page; total count decreases by 1 | "Entity removed successfully" | ✅ Yes | Popconfirm disappears | -->

## Feedback Mechanisms
<!-- Exact type and locator for every success/error feedback element.
     No generic "toast" — specify exact implementation. -->
| Trigger | Feedback Type | Locator | Exact Message Text | Auto-Dismisses? | Assertion Command |
|---------|--------------|---------|-------------------|-----------------|-------------------|
<!-- | Create success | role="alert" banner (.{framework-alert-class}) | `page.getByRole('alert')` | "Entity created successfully" | No — persists until next mutation | `await expect(page.getByRole('alert')).toContainText('created successfully')` | -->
<!-- | Validation error | Inline error (.{framework-error-class}) | `page.locator('.{framework-error-class}')` | Per-field — see Form Fields table | No — persists until corrected | `await expect(page.locator('.{framework-error-class}')).toHaveCount(N)` | -->

## Create vs Edit Form Differences
<!-- Fields that differ between Create and Edit mode. -->
| Field | In Create Form? | In Edit Form? | Edit Behavior |
|-------|----------------|--------------|---------------|
<!-- | {field-name} | ✅ enabled | ✅ DISABLED (readonly) | Pre-filled, cannot be changed | -->
<!-- | {field-name} | ✅ enabled | ❌ HIDDEN | Not shown in edit mode | -->
<!-- | {field-name} | ❌ hidden | ✅ Conditional — shown when {other-field} = "{value}" | -->

## Concurrency & Timing Notes
<!-- Timing-sensitive interactions that could cause flaky tests. Include wait strategies. -->
<!--
- **After modal close:** Wait for the modal element to disappear from DOM before interacting with grid elements (overlay may intercept clicks)
- **Multiple confirm dialogs:** After cancel + re-click delete, multiple confirmation elements may coexist in DOM. Target the VISIBLE one using `getBoundingClientRect().height > 0`.
- **After filter apply:** Grid rows re-render asynchronously. Wait for pagination text to update before asserting on row content.
- **Sequential CRUD operations:** Previous success alert persists until next mutation. No need to dismiss it, but be aware it may affect snapshot text assertions.
-->
