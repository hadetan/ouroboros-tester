# {section-name}

## Section Info
- **Page:** {page-name} ({page-slug})
- **Section Slug:** {section-slug}
- **Status:** not-started
- **Explored:** {date}
- **Verified:** pending
- **Corrected:** false

## Description
<!-- What this section does, its purpose in the page -->

## Location on Page
<!-- Where this section appears on the page -->
- **Position:** {top/middle/bottom/sidebar/modal}
- **Visibility:** {always-visible/tab/accordion/scroll-to}
- **Container:** {selector-hint for the section boundary}

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

## UI Elements
<!-- All interactive and display elements in this section -->

### Display Elements
<!-- Tables, lists, cards, text blocks, charts, etc. -->

### Interactive Elements
<!-- Buttons, links, inputs, dropdowns, toggles, etc. -->

---

## Requirements

### Requirement: {Entity} Creation
The system SHALL allow users to create a new {entity} via {form/modal/inline}.

#### Scenario: Successful creation with valid data
- GIVEN the user is on the {page-name} page
- AND the {section-name} section is visible
- WHEN the user clicks "{create-button-text}"
- AND fills in {required-fields} with valid data
- AND clicks "{submit-button-text}"
- THEN a new {entity} is created
- AND a {feedback-type: toast | alert-banner | notification | inline-message} is shown with text: "{exact-message}"
- AND the {entity} appears in the {display-area}

#### Scenario: Validation error on required fields
- GIVEN the user is on the {section-name} creation form
- WHEN the user leaves {required-field} empty
- AND clicks "{submit-button-text}"
- THEN validation error "{exact-error-message}" is displayed
- AND the form is NOT submitted

### Requirement: {Entity} Display
The system SHALL display {entities} in a {table/list/grid} with {columns/fields}.

#### Scenario: View {entity} list with data
- GIVEN there are existing {entities}
- WHEN the user navigates to the {page-name} page
- THEN the {section-name} shows a {table/list} of {entities}
- AND each row displays: {field1}, {field2}, {field3}

#### Scenario: Empty state
- GIVEN there are no {entities}
- WHEN the user navigates to the {page-name} page
- THEN the {section-name} shows "{empty-state-message}"

#### Scenario: Pagination
- GIVEN there are more than {page-size} {entities}
- WHEN the user views the {section-name}
- THEN pagination controls are displayed
- AND clicking "Next" loads the next page

### Requirement: {Entity} Update
The system SHALL allow users to edit an existing {entity}.

#### Scenario: Successful update
- GIVEN an existing {entity} is displayed
- WHEN the user clicks "{edit-button-text}" on the {entity}
- AND modifies {field} to "{new-value}"
- AND clicks "{save-button-text}"
- THEN the {entity} is updated
- AND a {feedback-type} is shown with text: "{exact-message}"
- AND the updated values are displayed in the grid

### Requirement: {Entity} Deletion
The system SHALL allow users to delete an existing {entity}.

#### Scenario: Delete with confirmation
- GIVEN an existing {entity} is displayed
- WHEN the user clicks "{delete-button-text}" on the {entity}
- THEN a {confirmation-type: modal-dialog | inline-popover | alert} appears with "{confirm-message}"
- WHEN the user confirms deletion
- THEN the {entity} is removed from the {display-area}
- AND a {feedback-type} is shown with text: "{exact-message}"

#### Scenario: Cancel deletion
- GIVEN the delete confirmation is open
- WHEN the user clicks "{cancel-button-text}"
- THEN the confirmation closes
- AND the {entity} is NOT deleted

---

## Interaction Recipes
<!-- CRITICAL CONTRACT: This section is the behavioral proof between explorer and test-writer.
     For EVERY interactive component discovered, the explorer MUST:
     1. PROVE the interaction works by executing it during exploration
     2. Document the EXACT locator, method, and success signal that succeeded
     3. Document any failed approaches (to prevent the test-writer from repeating mistakes)
     
     The test-writer will implement these recipes EXACTLY as documented.
     If an interaction is not documented here, the test-writer MUST report it as a gap.
     
     One recipe per distinct interaction type found on the page.
     Name each recipe after the user action: "Open Create Form", "Select Dropdown Value",
     "Apply Column Filter", "Confirm Delete", "Navigate Pagination", "Close Modal", etc. -->

### Recipe: {interaction-name}
- **Component:** {what this component is}
- **Trigger:** {what user action starts this interaction}
- **Proven Locator:**
  ```
  {the exact locator expression that was tested and works}
  ```
- **Interaction Method:** {which method successfully performs the action}
  <!-- One of: click() | evaluate(el => el.click()) | dispatchEvent('event') | keyboard.press('Key') | fill('text') | nativeSetter('text') | selectOption('value') | other: {describe} -->
- **Why This Method:** {why the chosen method is needed — what about the element makes simpler approaches fail}
  <!-- Be specific with measured evidence: "element positioned outside viewport (getBoundingClientRect().y = -32005)",
       "element has zero dimensions (height: 0, width: 0)", "no ARIA role on options (role attribute is null, textContent contains UUIDs)",
       "multiple elements match (strict mode violation — 3 close buttons exist)",
       "framework ignores Playwright fill events (value was empty after fill, confirmed via evaluate)" -->
- **Success Signal:** {what observable change confirms the interaction worked}
  <!-- Exact attribute, text, or DOM state. e.g., "dialog with class '.flexible-modal' appears in DOM",
       "button's aria-pressed changes to 'true'", "alert with role='alert' and class '.ant-alert-success' appears with text 'Created successfully'" -->
- **Signal Timing:** {immediate | async}
  <!-- If async: specify approximate delay and recommend web-first assertions.
       e.g., "async ~200-500ms — use expect(locator).toHaveAttribute('aria-pressed', 'true')" -->
- **Assertion Command:** {the exact Playwright assertion a test should use to verify this interaction}
  <!-- e.g., "await expect(page.locator('.flexible-modal')).toBeVisible()"
       or "await expect(page.getByRole('alert')).toContainText('Created successfully')"
       If the obvious assertion would fail, document the working alternative:
       "DON'T: expect(row).toBeVisible() — row height is 0. DO: expect(row.getByRole('gridcell').first()).toBeVisible()" -->
- **Preconditions:** {what must be true before this interaction — e.g., "grid loaded", "no overlay present", "modal is open"}
- **Render Condition:** {ONLY if conditionally rendered — what must be true for this element to exist in the DOM}
  <!-- Write "NONE" if the element is always present. Examples:
       "appears after changing or updating any values",
       "visible only when an element or area is hovered" -->
- **Render Behavior:** {always | state-bound | once-triggered}
  <!-- always: element is present on page load
       state-bound: element appears/disappears as its triggering state changes (e.g., save button tied to unsaved changes)
       once-triggered: element requires an initial trigger but then persists until page reload -->
- **Trigger Action:** {ONLY if conditionally rendered — the specific user action that causes the element to appear}
  <!-- e.g., "Updating a value", "hovering over an element", "Making a change on the page" -->
- **Disappear Condition:** {ONLY if conditionally rendered — what causes the element to leave the DOM}
  <!-- e.g., "reverted when all changed states are undone" (state-bound),
       "persists until page reload" (once-triggered),
       "disappears after save completes" -->
- **Failed Approaches:** {approaches that were tried and did NOT work, with specific error or evidence}
  <!-- e.g., "1. click() → Playwright error 'element outside viewport' (y=-32005). 2. fill('text') → value empty after fill (confirmed via page.evaluate(() => input.value))." -->

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
<!-- | Email | textbox | yes | required, must be valid email format (API rejects non-standard TLDs like .local; use .com/.org) | "" | `getByLabel('Email')` or `page.locator('input[placeholder="Email"]')` | -->
<!-- | Role | combobox | yes | required, must match a value from API | "" | `page.locator('.select-class').nth(0)` — see Interaction Recipe for this dropdown | Has nested selector container |  -->
<!-- | Contact Number | textbox | yes | required, numeric, has country-code prefix dropdown | "+91" | `getByLabel('Contact Number')` | Country-code dropdown is a separate select component — see its Interaction Recipe | -->

## API Endpoints
<!-- Network requests captured during CRUD operations -->

| Operation | Method | Endpoint | Request Body | Response | Notes |
|-----------|--------|----------|-------------|----------|-------|
<!-- | Create | POST | /api/entities | { name, ... } | 201 { id, ... } | | -->
<!-- | Send Password | POST | /api/v1/users/{userId}/send_password | {} | 200 | Response triggers feedback banner — see Interaction Recipe for exact type and locator | -->

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
<!-- | Create success | role="alert" banner (.ant-alert-success) | `page.getByRole('alert')` | "Entity created successfully" | No — persists until next mutation | `await expect(page.getByRole('alert')).toContainText('created successfully')` | -->
<!-- | Validation error | Inline error (.ant-form-item-explain-error) | `page.locator('.ant-form-item-explain-error')` | Per-field — see Form Fields table | No — persists until corrected | `await expect(page.locator('.ant-form-item-explain-error')).toHaveCount(N)` | -->

## Create vs Edit Form Differences
<!-- CRITICAL: Document which fields differ between Create and Edit mode.
     The test-writer uses this to write correct assertions for edit form state. -->
| Field | In Create Form? | In Edit Form? | Edit Behavior |
|-------|----------------|--------------|---------------|
<!-- | User ID | ✅ enabled | ✅ DISABLED (readonly) | Pre-filled, cannot be changed | -->
<!-- | Password | ✅ enabled | ❌ HIDDEN | Not shown in edit mode | -->
<!-- | Select Vendor | ❌ hidden | ✅ Conditional — shown when Role = "Vendor" | -->

## Concurrency & Timing Notes
<!-- Document interactions that are timing-sensitive and could cause flaky tests.
     Include recommended wait strategies. -->
<!-- 
- **After modal close:** Wait for `.flexible-modal` to disappear from DOM before interacting with grid elements (overlay may intercept clicks)
- **Multiple popconfirms:** After cancel + re-click delete, multiple `.ant-popconfirm` elements coexist in DOM. Target the VISIBLE one using `getBoundingClientRect().height > 0`.
- **After filter apply:** Grid rows re-render asynchronously. Wait for pagination text to update before asserting on row content.
- **Sequential CRUD operations:** Previous success alert persists until next mutation. No need to dismiss it, but be aware it may affect snapshot text assertions.
-->

## States
<!-- Different visual states of the section -->

### Loading State
<!-- What the section looks like while data loads -->

### Empty State  
<!-- What the section looks like with no data -->

### Error State
<!-- What the section looks like when an error occurs -->

### Success State
<!-- Covered in detail in the Feedback Mechanisms table above -->

## Cross-Page References
<!-- Entities created here that appear elsewhere, or entities from elsewhere used here -->
<!-- Format:
- **Creates:** {entity} → used in {page}/{section}
- **Consumes:** {entity} ← created in {page}/{section}
-->

## Verification
- **Status:** pending | verified | corrected
- **Verified Date:** 
- **Accuracy Score:** 
- **Corrections:** 
- **Verified By:** spec-verifier agent
