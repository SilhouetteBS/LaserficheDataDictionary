# Color Contrast Notes

The diagram uses CSS custom properties for relationship and object colors so normal and high-contrast modes stay aligned.

## Diagram Color Roles

- `--diagram-fk`: SQL foreign key connector lines.
- `--diagram-dependency`: SQL expression dependency connector lines.
- `--diagram-focus`: direct focused relationship highlight.
- `--diagram-selected`: selected or pinned relationship highlight.
- `--diagram-dimmed`: non-selected relationships when a relationship is hovered or pinned.
- `--diagram-table`, `--diagram-view`, `--diagram-routine`, `--diagram-trigger`: object type badges and card accents.

## Review Checklist

- Foreign key and dependency lines must remain distinguishable by both color and line style.
- High-contrast mode must increase stroke weight and use darker object colors.
- Selected relationships must remain visually dominant over dimmed relationships.
- Object type badges should remain readable against their backgrounds.
- Reduced-motion users should not receive smooth-scroll or animated transition effects.
