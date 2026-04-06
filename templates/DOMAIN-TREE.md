# Domain Relationship Tree

## Overview
This document maps how entities and data flow across pages and sections in the domain.

## Entity Registry

<!-- Entities discovered during exploration -->
<!-- Format:
### {Entity Name}
- **Created in:** {page}/{section}
- **Read in:** {page}/{section}, {page}/{section}
- **Updated in:** {page}/{section}
- **Deleted in:** {page}/{section}
- **Fields:** {field1}, {field2}, ...
-->

## Relationship Graph

<!-- Cross-page data flows -->
<!-- Format:
### {source-page}/{source-section} → {target-page}/{target-section}
- **Entity:** {entity-name}
- **Flow:** When {entity} is created/updated in {source}, it appears/changes in {target}
- **Verified:** true/false
- **Discovered:** {date}
-->

## Dependency Order

<!-- Suggested testing order based on data dependencies -->
<!-- Pages that create entities should be tested before pages that consume them -->
<!--
1. {page-slug} — Creates: {entity1}, {entity2}
2. {page-slug} — Depends on: {entity1}; Creates: {entity3}
3. {page-slug} — Depends on: {entity1}, {entity3}
-->
