# Backlog

This backlog tracks remaining implementation work so completed items do not keep getting suggested again.

## Recently Completed

- Diagram connector routing extraction and regression coverage.
- Focused 1-hop and 2-hop diagram behavior.
- 2-hop line toggle.
- Legend styling for foreign keys, dependencies, focused relationships, and object types.
- Object type badges for tables, views, routines, and triggers.
- LFDS dependency key normalization.
- Selected relationship hover/focus dimming.
- Public read-only editing guard.
- Data and notes validation scripts.
- Diagram QA, release checklist, and known limitations docs.
- Sidebar documentation coverage filters and unknown CSV export.
- Import tab protected behind local editing mode and support-warning acceptance.
- Static build smoke, accessibility audit, and performance budget scripts.
- Production readiness checklist and deployed-site smoke verification.
- Import/editor code excluded from public bundles.
- Diagram toolbar extracted from the main diagram component.
- Diagram focused relationship panel extracted from the main diagram component.

## Next 100 Items

1. [x] Add automated Playwright regression for relationship-card hover dimming.
2. [x] Add automated Playwright regression for keyboard focus dimming.
3. [x] Add tests for dependency mode object badges.
4. [x] Add tests for FK/dependency mixed focused mode.
5. [x] Add tests for ambiguous unqualified dependency references.
6. [x] Add tests for unresolved dependency reporting.
7. [x] Add tests for object-type legend entries.
8. [x] Add tests for diagram URL state restore with dependency mode.
9. [x] Add tests for `2-hop lines` URL persistence if persisted.
10. [x] Add tests for table filters in the left sidebar.
11. [x] Add object-type filters: Tables, Views, Routines, Triggers.
12. [x] Persist object-type filters in URL state.
13. [x] Add connected objects only toggle in full diagram mode.
14. [x] Add dependencies only for selected object quick filter.
15. [x] Add foreign keys only for selected object quick filter.
16. [x] Add incoming only and outgoing only relationship filters.
17. [x] Add relationship grouping: Foreign keys, Dependencies.
18. [x] Add count badges per relationship group.
19. [x] Add selected edge details drawer or panel.
20. [x] Add pin-selected-relationship behavior.
21. [x] Add clear selected relationship button.
22. [x] Add selected-edge label on the line only while selected.
23. [x] Add dependency arrowheads.
24. [x] Add FK direction arrows.
25. [x] Add optional FK cardinality markers.
26. [x] Add source/target column labels for selected FK.
27. [x] Add dependency source/target object type labels.
28. [x] Add relationship confidence/status labels.
29. [x] Add unresolved dependency visual warning.
30. [x] Add edge tooltip with relationship details.
31. [x] Add diagram mini-map.
32. [x] Add fit-to-selection behavior.
33. [x] Improve initial focused diagram scroll positioning.
34. [x] Add center-on-focused-object command.
35. [x] Add zoom-to-fit for full database mode.
36. [x] Add zoom-to-fit for focused mode.
37. [x] Add pan controls for keyboard users.
38. [x] Add reset-layout button separate from reset-filters.
39. [x] Add compact non-table cards mode.
40. [x] Add compact table cards mode that hides types.
41. [x] Improve 2-hop layout grouping by parent object.
42. [x] Add lane headers for Focused, Direct, Second-hop.
43. [x] Add visual separators between lanes.
44. [x] Add collision avoidance for dense dependency lines.
45. [x] Add line bundling for repeated parallel relationships.
46. [x] Add curved connectors option for dense views.
47. [x] Add orthogonal routing improvements around table boxes.
48. [x] Add viewport clipping detection for connector endpoints.
49. [x] Add hidden-column connector fallback when referenced row is scrolled out.
50. [x] Add scroll-to-column when selecting an FK relationship.
51. [x] Add copy object key button on diagram cards.
52. [x] Add copy relationship name button.
53. [x] Add open table details icon on table cards.
54. [x] Add open object details for views/routines/triggers.
55. [x] Add object details page/panel for routines.
56. [x] Add object details page/panel for views.
57. [x] Add object details page/panel for triggers.
58. [x] Add routine definition preview if exported.
59. [x] Add view definition preview if exported.
60. [x] Add trigger definition preview if exported.
61. [x] Add unresolved dependencies report page.
62. [x] Add dependency resolution stats to `validate:data`.
63. [x] Group validation warnings by product/version.
64. [x] Add validation summary JSON output mode.
65. [x] Add import warning for empty views/triggers result sets.
66. [x] Add import warning for dependency rows with missing schema.
67. [x] Add import warning for duplicate unqualified object names.
68. [x] Add import warning for FK references to missing tables.
69. [x] Add import warning for missing primary keys.
70. [x] Add import warning for tables with zero columns.
71. [x] Add schema snapshot completeness panel in the app.
72. [x] Add export manifest completeness display.
73. [x] Add product/version import history display.
74. [x] Add last imported metadata if available.
75. [x] Exclude local SQL Server environment version details from app-facing metadata.
76. [x] Add database role explanation per product.
77. [x] Add do-not-rely-on-database-name note in UI docs.
78. [x] Add safe-reporting warning near export/import docs.
79. [x] Add what-dependencies-mean documentation.
80. [x] Add FK vs dependency explanation in the Diagram page.
81. [x] Add high-contrast diagram mode.
82. [x] Add color tokens for all diagram object/edge colors.
83. [x] Add color contrast validation notes.
84. [x] Add reduced-motion-safe transitions.
85. [x] Add responsive diagram toolbar polish.
86. [x] Add mobile diagram fallback message or simplified mode.
87. [x] Add horizontal overflow affordance for large diagrams.
88. [x] Add sticky focused relationship panel.
89. [x] Add resizable relationship panel.
90. [x] Add collapsible relationship panel.
91. [x] Add visual regression screenshots for focused FK mode.
92. [x] Add visual regression screenshots for dependency mode.
93. [x] Add visual regression screenshots for selected relationship hover.
94. [x] Add CI step for `npm run test:diagram`.
95. [x] Add CI step for `npm run validate:notes`.
96. [x] Add CI artifact upload for failed e2e screenshots.
97. [x] Add CI artifact upload for validation summaries.
98. [x] Add docs checklist entry for diagram hover QA.
99. [x] Add release checklist entry for dependency normalization QA.
100. [x] Keep this backlog updated after each implementation batch.

## Recommended Next 100 Items

1. [x] Add a compact/global search command palette for tables, columns, objects, and relationships.
2. [x] Add keyboard shortcuts for switching primary tabs.
3. [x] Add keyboard shortcuts for diagram zoom, fit, pan, and clear focus.
4. [x] Add a visible keyboard shortcut help dialog.
5. [x] Add saved diagram view presets per product/version.
6. [x] Add pinned/favorite objects for frequently referenced tables and dependencies.
7. [x] Add breadcrumb navigation for product, version, tab, object, and selected relationship.
8. [x] Add deep-link copy buttons for tables, objects, diagram focus, and comparison views.
9. [x] Add table detail tabs for Columns, Keys, Indexes, Relationships, and Notes.
10. [x] Add column-level search inside the table detail panel.
11. [x] Add column grouping by key/index participation.
12. [x] Add badges for PK, FK, indexed, nullable, and computed columns.
13. [x] Add a table density toggle for compact/comfortable rows.
14. [x] Add sticky table headers for long column/key/index tables.
15. [x] Add row virtualization for long table and column lists.
16. [x] Add a compare summary strip with added, removed, changed, and unchanged counts.
17. [x] Add compare filters for only added, removed, changed, or unchanged tables.
18. [x] Add column-level version comparison.
19. [x] Add key/index-level version comparison.
20. [x] Add relationship-level version comparison.
21. [x] Add object add/remove/metadata diff for views, routines, and triggers; definition-only changes are not counted.
22. [x] Add a dependency change diff between versions.
23. [x] Add exportable compare report as JSON.
24. [x] Add exportable compare report as CSV.
25. [x] Add print-friendly compare report styling.
26. [x] Add a dedicated data dictionary print stylesheet.
27. [x] Add markdown export for selected table documentation.
28. [x] Add markdown export for selected product/version summary.
29. [x] Add CSV export for selected table columns.
30. [x] Add CSV export for relationship lists.
31. [x] Add diagram PNG export from the current viewport.
32. [x] Add full diagram SVG export.
33. [x] Add selected relationship export from the Diagram tab.
34. [x] Add user-facing import checklist before loading new exports.
35. [x] Add drag-and-drop import for schema export JSON bundles.
36. [x] Add import preview before committing files into `data/` and `public/data/`.
37. [x] Add import validation summary page after import.
38. [x] Add import duplicate version warning with explicit overwrite guidance.
39. [x] Add importer support for prefixed file names across all products.
40. [x] Add importer support for optional missing result files.
41. [x] Add importer warnings for suspiciously small exports.
42. [x] Add importer warnings for product/version mismatch.
43. [x] Add importer warnings for non-JSON files.
44. [x] Add schema export file checksum recording.
45. [x] Add source export script version to the manifest.
46. [x] Exclude local SQL Server compatibility level from app-facing metadata.
47. [x] Add export timestamp timezone normalization.
48. [x] Add app-visible data freshness warnings.
49. [x] Add schema snapshot size and object count trend cards.
50. [x] Add product/version health score trend over time.
51. [x] Add dependency resolution trend over time.
52. [x] Add notes completion trend over time.
53. [x] Add table documentation completion by schema.
54. [x] Add object documentation completion by object type.
55. [x] Add notes review workflow statuses.
56. [x] Add notes owner/reviewer fields.
57. [x] Add notes last-reviewed date field.
58. [x] Add notes stale-review warning.
59. [x] Add notes confidence explanation tooltip.
60. [x] Add notes lint rules for empty/manual placeholder text.
61. [x] Add notes lint rules for unsupported write guidance.
62. [x] Add notes lint rules for accidental database-name assumptions.
63. [x] Add schema docs style guide.
64. [x] Add product-specific glossary pages.
65. [x] Add read-only reporting examples by product.
66. [x] Add unsafe-query examples to avoid with explanations.
67. [x] Add support-plan warning acceptance in editing mode.
68. [x] Add stronger local-only editing mode banner.
69. [x] Add editing-mode route guard tests.
70. [x] Add content security policy meta tag for static deployment.
71. [x] Add dependency vulnerability audit to CI.
72. [x] Add lockfile integrity check in CI.
73. [x] Add static build smoke test against `dist/`.
74. [x] Add accessibility audit script using Playwright and axe or equivalent.
75. [x] Add color contrast checks for the main navigation.
76. [x] Add focus-visible regression checks for primary controls.
77. [x] Add screen-reader labels for all icon-only controls.
78. [x] Add reduced-motion regression coverage.
79. [x] Add mobile snapshot screenshots for core tabs.
80. [x] Add responsive screenshot coverage for tablet widths.
81. [x] Add performance budget for initial JavaScript bundle size.
82. [x] Add performance budget for rendered table list size.
83. [x] Add diagram render timing measurements.
84. Memoize expensive schema analysis selectors.
85. [x] Split large data analysis helpers into smaller modules.
86. Split `DatabaseDiagram.jsx` into focused subcomponents.
87. [x] Extract relationship panel into its own component.
88. [x] Extract diagram toolbar into its own component.
89. [x] Extract selected relationship card into its own component.
90. Extract object detail panel into its own component.
91. [x] Add unit tests for URL state parsing edge cases.
92. [x] Add unit tests for schema completeness calculations.
93. [x] Add unit tests for notes filtering and CSV export.
94. [x] Add unit tests for dependency alias resolution.
95. [x] Add unit tests for diagram lane assignment.
96. Add unit tests for diagram hit target generation.
97. [x] Add snapshot tests for generated validation summaries.
98. [x] Add GitHub Pages deployment workflow.
99. [x] Add release notes generator from backlog and git history.
100. [x] Keep this recommended backlog updated as items are completed.

## Production Readiness Backlog

1. [x] Finish extracting `DatabaseDiagram.jsx` into smaller components.
2. [x] Extract the object detail panel from the diagram.
3. [x] Extract the minimap from the diagram.
4. [x] Extract diagram canvas and layer rendering from the diagram.
5. [x] Keep connector geometry logic isolated in `diagramGeometry.js`.
6. [x] Add or keep regression tests for focused mode, 1-hop, 2-hop, FK, dependency, and mixed diagrams.
7. [x] Confirm no editing/import code is shipped in public builds.
8. [x] Confirm public build hides Import, note editing, note import, and note export.
9. [x] Confirm local/internal editing build still works when `VITE_ENABLE_EDITING=true`.
10. [ ] Run `npm ci` from a clean checkout.
11. [x] Run `npm run lint`.
12. [x] Run `npm run test:unit`.
13. [x] Run `npm run test:diagram`.
14. [x] Run `npm run validate:data`.
15. [x] Run `npm run validate:notes`.
16. [x] Run `npm run verify:lockfile`.
17. [x] Run `npm run verify:static-security`.
18. [x] Run `npm run build`.
19. [x] Run `npm run test:static-build`.
20. [x] Run `npm run verify:public-build`.
21. [x] Run `npm run audit:performance`.
22. [x] Run `npm run audit:accessibility`.
23. [x] Run `npm run test:e2e`.
24. [x] Run `npm run test:visual`.
25. [x] Run `npm run validate:full`.
26. [x] Review all `validate:data` warnings.
27. [x] Categorize acceptable warnings, especially unresolved SQL dependencies.
28. [x] Document warning classes that are expected.
29. [x] Confirm product/version identity comes from manifest fields, not database names.
30. [x] Confirm all product manifests load correctly.
31. [x] Confirm all schema files load correctly.
32. [x] Confirm all notes files load correctly.
33. [x] Confirm Forms, LFDS, Repository, and Workflow versions display correctly.
34. [x] Confirm Forms `11.0.2311.50564` replaced old `11.0.2311`.
35. [x] Confirm no local SQL Server version or compatibility-level data is displayed.
36. [x] Confirm production deploy uses `VITE_ENABLE_EDITING=false`.
37. [x] Confirm `verify:public-build` passes before deploy.
38. [x] Confirm public bundle does not contain Import/editor strings.
39. [x] Confirm public site has no editing route exposed.
40. [x] Confirm CSP meta tag exists.
41. [x] Decide whether GitHub Pages is enough for headers.
42. [x] If stronger security is needed, deploy behind a host that supports CSP/security headers.
43. [x] Add recommended HTTP headers where possible: `Content-Security-Policy`, `X-Content-Type-Options`, `Referrer-Policy`, and `Permissions-Policy`.
44. [x] Confirm GitHub Pages workflow runs on `main`.
45. [x] Confirm Pages workflow runs `verify:public-build`.
46. [x] Confirm Pages workflow runs `test:static-build`.
47. [x] Confirm Pages workflow runs deployed-site verification.
48. [ ] Run `npm run verify:deployed-site` against the final hosted URL.
49. [ ] Make deploy workflow/checks required before release.
50. [ ] Confirm hosted static paths work under the final base URL.
51. [x] Add a visible in-app link to Known Limitations.
52. [x] Add visible data provenance details where users can find them.
53. [x] Show export script version when available.
54. [x] Show export/import timestamp when available.
55. [x] Show product/database role clearly.
56. [x] Keep read-only/support warning prominent.
57. [x] Confirm README production instructions are current.
58. [x] Confirm `docs/production-readiness.md` is current.
59. [x] Confirm `docs/known-limitations.md` is current.
60. [x] Confirm `docs/release-checklist.md` is current.
61. [x] Confirm schema export guide is current.
62. [x] Confirm unsafe query examples are clear.
63. [x] Confirm product glossary docs are accurate.
64. [x] Confirm bundle size remains within budget.
65. [x] Confirm table list render count remains within budget.
66. [x] Confirm diagram render timing remains within budget.
67. [x] Confirm keyboard navigation works.
68. [x] Confirm icon-only buttons have accessible labels.
69. [x] Confirm focus-visible styles are clear.
70. [x] Confirm mobile/tablet layouts do not overflow.
71. [x] Confirm reduced-motion mode behaves correctly.
72. [x] Confirm diagram has a mobile fallback.
73. [x] Create a production release checklist issue/template.
74. [x] Generate release notes with `npm run release-notes:draft`.
75. [x] Review the full diff before release.
76. [x] Commit changes in logical commits.
77. [ ] Push to a branch.
78. [ ] Open a PR.
79. [ ] Require CI to pass.
80. [ ] Review public build artifact behavior before merging.
81. [ ] Merge to `main`.
82. [ ] Confirm GitHub Pages deployment completed.
83. [ ] Run deployed-site smoke check against the live URL.
84. [ ] Tag or mark the production release.
