# {section-name}

> **Implementation details:** [impl.md](impl.md)

## Section Info
- **Page:** {page-name} ({page-slug})
- **Section Slug:** {section-slug}
- **App URL Path:** {/exact/browser/path — e.g., /Category/SubPage}
- **URL Query Params:** {?tab=X or NONE}
- **Status:** not-started
- **Explored:** {date}
- **Verified:** pending
- **Corrected:** false

## Description
<!-- Section purpose on page -->

## Location on Page
<!-- Section position and visibility -->
- **Position:** {top/middle/bottom/sidebar/modal}
- **Visibility:** {always-visible/tab/accordion/scroll-to}
- **Container:** {selector-hint for section boundary}

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

## States

### Loading State
<!-- Appearance during data load -->

### Empty State
<!-- Appearance with no data -->

### Error State
<!-- Appearance on error -->

---

## Cross-Page References
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
