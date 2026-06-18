# Diagram QA

Use these cases when changing diagram layout, edge routing, or table-card styling.

## Focused Mode Regression Cases

- LFDS `dbo.attribute_def_acls_audit`
  - Expected: one direct foreign key edge to `dbo.audit_events`.
  - Expected: connector line is visible in the gap between the two table boxes.
  - Expected: connector line does not draw across either table's column rows.

- LFDS `dbo.adgs_rules`
  - Expected: two direct foreign key edges.
  - Expected: related tables are `dbo.directory_objects` and `dbo.identity_providers`.
  - Expected: relationship cards show `container_id -> id` and `provider_id -> id`.
  - Expected: one-hop mode draws only the two direct relationship lines.
  - Expected: two-hop mode can show additional muted connector lines, and the 2-hop lines control hides or restores those secondary connectors.

- Forms `dbo.cf_business_processes`
  - Expected: focused mode shows fewer objects than full mode.
  - Expected: two-hop mode shows at least as many objects as one-hop mode.

## Browser Checks

- Full database mode renders table cards and connector lines.
- Focused mode resets scroll to the top-left of the focused canvas.
- Zoom controls preserve line/table alignment at 75%, 100%, 125%, and 150%.
- Compact columns mode does not change connector placement.
- Relationship card hover/focus keeps the selected connector gold and dims non-selected connectors to thin gray lines.
- The legend matches connector styling: foreign keys are teal, dependencies are purple dashed lines, and direct focused relationships are gold.
- Object filters can hide Views, Routines, and Triggers in All/Dependencies edge modes without hiding Tables.
- The Objects, Edges, Tables, and Dependencies tooltips remain inside the viewport.
