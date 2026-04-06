# {section-name} — CRUD Scenarios

## Section Reference
- **Page:** {page-name} ({page-slug})
- **Section Slug:** {section-slug}
- **Entity:** {entity-name}
- **Status:** draft | verified

---

## Create

### Happy Path
- GIVEN the user is on the {page-name} page
- AND the {section-name} section is visible
- WHEN the user clicks "{create-button-text}"
- AND the {form/modal} opens
- AND fills in all required fields with valid data
- AND clicks "{submit-button-text}"
- THEN a success message "{success-message}" is displayed
- AND the new {entity} appears in the {table/list}

### Validation — Required Fields
- GIVEN the {create-form/modal} is open
- WHEN the user submits without filling "{required-field}"
- THEN a validation error is shown for "{required-field}"
- AND the form is not submitted

### Validation — Duplicate / Conflict
- GIVEN a {entity} with "{unique-field}" already exists
- WHEN the user tries to create another with the same "{unique-field}"
- THEN an error "{duplicate-error-message}" is displayed

---

## Read

### List — With Data
- GIVEN there are existing {entities}
- WHEN the user navigates to the {page-name} page
- THEN the {section-name} displays a {table/list/grid} of {entities}
- AND each row shows: {col1}, {col2}, {col3}

### List — Empty State
- GIVEN there are no {entities}
- WHEN the user navigates to the {page-name} page
- THEN "{empty-state-message}" is shown

### Pagination / Infinite Scroll
- GIVEN there are more than {page-size} {entities}
- WHEN the user views the {section-name}
- THEN pagination controls / load-more are visible
- AND navigating shows the next set of {entities}

### Search / Filter
- GIVEN {entities} exist
- WHEN the user types "{search-term}" in the search input
- THEN only {entities} matching "{search-term}" are shown

---

## Update

### Happy Path
- GIVEN an existing {entity} is listed
- WHEN the user clicks "{edit-button-text}" on the {entity}
- AND the {edit-form/modal} opens with current values pre-filled
- AND the user changes "{field}" to "{new-value}"
- AND clicks "{save-button-text}"
- THEN the {entity} is updated
- AND the updated value is reflected in the {table/list}
- AND a success message "{success-message}" is displayed

### Cancel Edit
- GIVEN the {edit-form/modal} is open
- WHEN the user clicks "{cancel-button-text}"
- THEN the form closes without saving changes

---

## Delete

### With Confirmation Dialog
- GIVEN an existing {entity} is listed
- WHEN the user clicks "{delete-button-text}" on the {entity}
- THEN a confirmation dialog appears: "{confirm-message}"
- WHEN the user clicks "{confirm-button-text}"
- THEN the {entity} is removed from the {table/list}
- AND a success message "{success-message}" is displayed

### Cancel Deletion
- GIVEN the delete confirmation dialog is open
- WHEN the user clicks "{cancel-button-text}"
- THEN the dialog closes
- AND the {entity} is NOT deleted
- AND it remains visible in the {table/list}
