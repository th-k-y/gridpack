# Changelog

## 0.2.0

### Auto-Flow

- **`*N` auto-flow mode** — `*4` creates a 4-column grid, rows derived from child count. Uses `grid-auto-flow` instead of `grid-template-areas`. Children are named `c0`, `c1`, `c2`, ...
- **`*pattern` span patterns** — `*s3c6a3` creates a 12-column grid where children cycle spans of 3/6/3. `*w2*2` = w spans 2 + 2 singles = 4-col grid.
- **Mixed mode** — combine static map rows with auto-flow: `h12 *s3c6a3` = pinned header row + auto-flow body.
- **`?f` flag** — reverses auto-flow direction (row↔column). `*3 ?f` fills top→bottom instead of left→right.
- **`?F` flag** — enables dense packing (`grid-auto-flow: dense`). Backfills gaps left by spanning items.
- **`needsAreas` extension hook** — extensions that need grid-area placement (splitPane, collapsible, accordion, scrollable, overlay, multiColumn) declare `needsAreas: true`. When combined with auto-flow layouts, Grid automatically converts to template-areas so extensions work transparently.

### Size Cycling

- **Trailing `*` in col/row sizes** — cycles the preceding size tokens to fill all tracks. `*6 | 80 # *` → `80px 1fr 80px 1fr 80px 1fr`. Works independently on cols and rows: `|| 40 80 *` cycles row sizes only.

### Char-Count Shorthand

- **`h12` in map rows** — expands to `hhhhhhhhhhhh`. Any lowercase letter followed by digits repeats that letter. Useful for wide-spanning areas without typing repeated characters.

### Transpose Improvements

- Transpose now swaps **justify-self ↔ align-self** on all per-area alignment modifiers.
- Transpose now swaps **justifyContent ↔ alignContent** in `?` flags.
- Transpose now swaps **gapH ↔ gapV** when asymmetric gaps are specified.
- Fisheye extension auto-swaps its axis on transpose (`axis: "x"` becomes `"y"` and vice versa).

### Render Extension

- New **`render({ container, cell })`** extension for custom DOM output.
- `renderContainer({ props, children, parsed })` — full control over the container element and child grouping. Enables semantic HTML structures like `<table>/<thead>/<tbody>/<tr>/<td>` with CSS subgrid, `<dl>/<dt>/<dd>`, or any custom DOM shape.
- `wrapCell(child, areaStyle, key, childIdx, parsed)` — replace the default `<div>` wrapper per child with any element or component.

### Alignment Fix

- Auto-flow tracks now default to `auto` (instead of `1fr`) when `justifyContent` or `alignContent` flags are set. This makes `?whcC` correctly center content instead of stretching tracks to fill the container.

### Fisheye Improvements

- Fixed `--fe-scale` / `--fe-scale-x` / `--fe-scale-y` CSS custom properties not being set in auto-flow mode. Added index-based position fallback when `getComputedStyle` returns `auto` for grid positions.
- Fixed area name resolution for map-based layouts where `gridArea` serializes as `"a / a / a / a"` — now extracts the first token.
- When all tracks on an axis are `auto` (no `fr` tracks), fisheye treats them as flexible so the effect works with both `*7` and `abcdefg` style layouts.

### Bug Fixes

- Fixed React "fewer hooks than expected" error when typing produces a transient parse error. Error check moved after all hooks.
- Fixed `fillSizes` utility to correctly handle explicit sizes that exceed or match the target count.

## 0.1.2

- Bug fixes.

## 0.1.1

- Initial working release.
- Layout string DSL: areas, grow, empty cells, proportional sizing, transpose, minmax, gaps, `?` flags (w/h/secbag), per-area alignment modifiers, template variables, repeat rows.
- `Grid` React component with container-width breakpoints (xs/sm/md/lg/xl), `vars`/`onVarsChange` for bidirectional state, and `extensions` prop.
- Extensions: `debug`, `splitPane`, `collapsible`, `accordion`, `scrollable`, `overlay`, `animate`, `tabs`, `multiColumn`, `fisheye`.
- Landing page, playground with 35+ presets, and docs panel.

## 0.1.0

- Package name claimed on npm.
